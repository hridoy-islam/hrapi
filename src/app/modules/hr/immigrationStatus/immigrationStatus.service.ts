import httpStatus from "http-status";

import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";
import { ImmigrationStatusSearchableFields } from "./immigrationStatus.constant";
import { ImmigrationStatus } from "./immigrationStatus.model";
import { TImmigrationStatus } from "./immigrationStatus.interface";
import moment from "moment";

const getAllImmigrationStatusFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(
    ImmigrationStatus.find()
      .populate("logs.updatedBy", "firstName lastName initial name")
      .populate("employeeId", "firstName lastName initial name"),
    query
  )
    .search(ImmigrationStatusSearchableFields)
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

const getSingleImmigrationStatusFromDB = async (id: string) => {
  const result = await ImmigrationStatus.findById(id);
  return result;
};

const createImmigrationStatusIntoDB = async (payload: any) => {
  try {
    const initialLogEntry = {
      title: "Initiate Immigration Status Verification", // Professional title
      date: new Date(), 
      updatedBy: payload.updatedBy,
      document: payload.document || "", 
    };

    const rtwData = {
      employeeId: payload.employeeId,
      nextCheckDate: payload.nextCheckDate,
      logs: [initialLogEntry], 
    };

    const result = await ImmigrationStatus.create(rtwData);
    return result;
  } catch (error: any) {
    console.error("Error in createImmigrationStatusIntoDB:", error);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to create ImmigrationStatus"
    );
  }
};

const updateImmigrationStatusIntoDB = async (
  id: string,
  payload: Partial<TImmigrationStatus>
) => {
  const immigrationStatus = await ImmigrationStatus.findById(id);

  if (!immigrationStatus) {
    throw new AppError(httpStatus.NOT_FOUND, "ImmigrationStatus not found");
  }

  const logsToAdd = [];

  // Helper function to compare dates properly
  const areDatesEqual = (date1: Date | null | undefined, date2: Date | null | undefined) => {
    if (!date1 && !date2) return true;
    if (!date1 || !date2) return false;
    return moment(date1).isSame(moment(date2), 'day');
  };


  if (payload.nextCheckDate && !areDatesEqual(payload.nextCheckDate, immigrationStatus.nextCheckDate)) {
    const oldDate = immigrationStatus.nextCheckDate
      ? moment(immigrationStatus.nextCheckDate).format('DD MMM YYYY')
      : 'N/A';
    const newDate = moment(payload.nextCheckDate).format('DD MMM YYYY');

    logsToAdd.push({
      title: `Immigration status Check Date Updated from ${oldDate} to ${newDate}`,
      date: new Date(),
      updatedBy: (payload as any)?.updatedBy,
      document: (payload as any)?.document,

    });
  }


  // Push logs to existing logs
  if (logsToAdd.length > 0) {
    immigrationStatus.logs?.push(...logsToAdd);
  }

  if (payload.nextCheckDate !== undefined) {
    immigrationStatus.nextCheckDate = payload.nextCheckDate;
  }

  // Apply other payload properties
  Object.keys(payload).forEach(key => {
    if ( key !== 'nextCheckDate') {
      (immigrationStatus as any)[key] = (payload as any)[key];
    }
  });

  const result = await immigrationStatus.save();


  return result;
};

export const ImmigrationStatusServices = {
  getAllImmigrationStatusFromDB,
  getSingleImmigrationStatusFromDB,
  createImmigrationStatusIntoDB,
  updateImmigrationStatusIntoDB,
};
