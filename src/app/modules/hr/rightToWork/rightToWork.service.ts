import httpStatus from "http-status";

import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";
import { RightToWorkSearchableFields } from "./rightToWork.constant";
import { RightToWork } from "./rightToWork.model";
import { TRightToWork } from "./rightToWork.interface";
import moment from '../../../utils/moment-setup';

const getAllRightToWorkFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(
    RightToWork.find()
      .populate("logs.updatedBy", "firstName lastName initial name")
      .populate("employeeId", "firstName lastName initial name"),
    query
  )
    .search(RightToWorkSearchableFields)
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

const getSingleRightToWorkFromDB = async (id: string) => {
  const result = await RightToWork.findById(id);
  return result;
};

const createRightToWorkIntoDB = async (payload: any) => {
  try {
    const initialLogEntry = {
      title: "Initial Right to Work Verification", // Professional title
      date: new Date(), 
      updatedBy: payload.updatedBy,
      document: payload.document || "", 
    };

    const rtwData = {
      employeeId: payload.employeeId,
      nextCheckDate: payload.nextCheckDate,
      logs: [initialLogEntry], 
    };

    const result = await RightToWork.create(rtwData);
    return result;
  } catch (error: any) {
    console.error("Error in createRightToWorkIntoDB:", error);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to create RightToWork"
    );
  }
};

const updateRightToWorkIntoDB = async (
  id: string,
  payload: Partial<TRightToWork>
) => {
  const rightToWork = await RightToWork.findById(id);

  if (!rightToWork) {
    throw new AppError(httpStatus.NOT_FOUND, "RightToWork not found");
  }

  const logsToAdd = [];

  // Helper function to compare dates properly
  const areDatesEqual = (date1: Date | null | undefined, date2: Date | null | undefined) => {
    if (!date1 && !date2) return true;
    if (!date1 || !date2) return false;
    return moment(date1).isSame(moment(date2), 'day');
  };


  if (payload.nextCheckDate && !areDatesEqual(payload.nextCheckDate, rightToWork.nextCheckDate)) {
    const oldDate = rightToWork.nextCheckDate
      ? moment(rightToWork.nextCheckDate).format('DD MMM YYYY')
      : 'N/A';
    const newDate = moment(payload.nextCheckDate).format('DD MMM YYYY');

    logsToAdd.push({
      title: `RTW Next Check Date Updated from ${oldDate} to ${newDate}`,
      date: new Date(),
      updatedBy: (payload as any)?.updatedBy,
      document: (payload as any)?.document,

    });
  }


  // Push logs to existing logs
  if (logsToAdd.length > 0) {
    rightToWork.logs?.push(...logsToAdd);
  }

  if (payload.nextCheckDate !== undefined) {
    rightToWork.nextCheckDate = payload.nextCheckDate;
  }

  // Apply other payload properties
  Object.keys(payload).forEach(key => {
    if ( key !== 'nextCheckDate') {
      (rightToWork as any)[key] = (payload as any)[key];
    }
  });

  const result = await rightToWork.save();


  return result;
};

export const RightToWorkServices = {
  getAllRightToWorkFromDB,
  getSingleRightToWorkFromDB,
  createRightToWorkIntoDB,
  updateRightToWorkIntoDB,
};
