import httpStatus from "http-status";

import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";
import { AppraisalSearchableFields } from "./appraisal.constant";
import { Appraisal } from "./appraisal.model";
import { TAppraisal } from "./appraisal.interface";
import moment from "moment";

const getAllAppraisalFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(
    Appraisal.find()
      .populate("logs.updatedBy", "firstName lastName initial name")
      .populate("employeeId", "firstName lastName initial name"),
    query
  )
    .search(AppraisalSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await userQuery.countTotal();
  const result = await userQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleAppraisalFromDB = async (id: string) => {
  const result = await Appraisal.findById(id);
  return result;
};

const createAppraisalIntoDB = async (payload: any) => {
  try {
    const initialLogEntry = {
      title: "Appraisal Record Initiated", // Professional title
      date: new Date(), 
      updatedBy: payload.updatedBy,
      document: payload.document || "", 
    };

    const rtwData = {
      employeeId: payload.employeeId,
      nextCheckDate: payload.nextCheckDate,
      logs: [initialLogEntry], 
    };

    const result = await Appraisal.create(rtwData);
    return result;
  } catch (error: any) {
    console.error("Error in createAppraisalIntoDB:", error);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to create Appraisal"
    );
  }
};

const updateAppraisalIntoDB = async (
  id: string,
  payload: Partial<TAppraisal>
) => {
  const appraisal = await Appraisal.findById(id);

  if (!appraisal) {
    throw new AppError(httpStatus.NOT_FOUND, "Appraisal not found");
  }

  const logsToAdd = [];

  // Helper function to compare dates properly
  const areDatesEqual = (date1: Date | null | undefined, date2: Date | null | undefined) => {
    if (!date1 && !date2) return true;
    if (!date1 || !date2) return false;
    return moment(date1).isSame(moment(date2), 'day');
  };


  if (payload.nextCheckDate && !areDatesEqual(payload.nextCheckDate, appraisal.nextCheckDate)) {
    const oldDate = appraisal.nextCheckDate
      ? moment(appraisal.nextCheckDate).format('DD MMM YYYY')
      : 'N/A';
    const newDate = moment(payload.nextCheckDate).format('DD MMM YYYY');

    logsToAdd.push({
      title: `Appraisal Check Date Updated from ${oldDate} to ${newDate}`,
      date: new Date(),
      updatedBy: (payload as any)?.updatedBy,
      document: (payload as any)?.document,

    });
  }


  // Push logs to existing logs
  if (logsToAdd.length > 0) {
    appraisal.logs?.push(...logsToAdd);
  }

  if (payload.nextCheckDate !== undefined) {
    appraisal.nextCheckDate = payload.nextCheckDate;
  }

  // Apply other payload properties
  Object.keys(payload).forEach(key => {
    if ( key !== 'nextCheckDate') {
      (appraisal as any)[key] = (payload as any)[key];
    }
  });

  const result = await appraisal.save();


  return result;
};

export const AppraisalServices = {
  getAllAppraisalFromDB,
  getSingleAppraisalFromDB,
  createAppraisalIntoDB,
  updateAppraisalIntoDB,
};
