import httpStatus from "http-status";

import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";
import { RightToWorkSearchableFields } from "./rightToWork.constant";
import { RightToWork } from "./rightToWork.model";
import { TRightToWork } from "./rightToWork.interface";
import moment from "moment";

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

const createRightToWorkIntoDB = async (payload: TRightToWork) => {
  try {
    const result = await RightToWork.create(payload);
    return result;
  } catch (error: any) {
    console.error("Error in createRightToWorkIntoDB:", error);

    // Throw the original error or wrap it with additional context
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

  // Check and log startDate update
  if (payload.startDate && !areDatesEqual(payload.startDate, rightToWork.startDate)) {
    logsToAdd.push({
      title: `RTW Start Date Updated to ${moment(payload.startDate).format("DD MMM YYYY")}`,
      date: new Date(),
      document: payload.document,
      updatedBy: payload.updatedBy,
    });
  }

  // Check and log expiryDate update
  if (payload.expiryDate && !areDatesEqual(payload.expiryDate, rightToWork.expiryDate)) {
    logsToAdd.push({
      title: `RTW Expiry Date Updated to ${moment(payload.expiryDate).format("DD MMM YYYY")}`,
      date: new Date(),
      document: payload.document,

      updatedBy: payload.updatedBy,
    });
  }

  // Check and log nextCheckDate change
  if (payload.nextCheckDate && !areDatesEqual(payload.nextCheckDate, rightToWork.nextCheckDate)) {
    const oldDate = rightToWork.nextCheckDate
      ? moment(rightToWork.nextCheckDate).format('DD MMM YYYY')
      : 'N/A';
    const newDate = moment(payload.nextCheckDate).format('DD MMM YYYY');

    logsToAdd.push({
      title: `RTW Next Check Date Updated from ${oldDate} to ${newDate}`,
      date: new Date(),
      updatedBy: payload.updatedBy,
      document: payload.document,

    });
  }


  // Push logs to existing logs
  if (logsToAdd.length > 0) {
    rightToWork.logs?.push(...logsToAdd);
  }

  // Apply the rest of the payload - explicitly update date fields
  if (payload.startDate !== undefined) {
    rightToWork.startDate = payload.startDate;
  }
  if (payload.expiryDate !== undefined) {
    rightToWork.expiryDate = payload.expiryDate;
  }
  if (payload.nextCheckDate !== undefined) {
    rightToWork.nextCheckDate = payload.nextCheckDate;
  }

  // Apply other payload properties
  Object.keys(payload).forEach(key => {
    if (key !== 'startDate' && key !== 'expiryDate' && key !== 'nextCheckDate') {
      rightToWork[key] = payload[key];
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
