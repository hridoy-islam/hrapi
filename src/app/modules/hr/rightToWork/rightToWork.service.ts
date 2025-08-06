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

  // Check and log expiryDate update
  if (payload.expiryDate) {
    logsToAdd.push({
      title: `RTW Expiry Date Updated to ${moment(payload.expiryDate).format(
        "DD MMM YYYY"
      )}`,
      date: new Date(),
      updatedBy: payload.updatedBy,
    });
  }

  // Check and log status change
  if (payload.status) {
    logsToAdd.push({
      title: "RTW Status Checked & Updated",
      date: new Date(),
      updatedBy: payload.updatedBy,
    });
  }

  // Push logs to existing logs
  if (logsToAdd.length > 0) {
    rightToWork.logs?.push(...logsToAdd);
  }

  // Apply the rest of the payload
  Object.assign(rightToWork, payload);

  const result = await rightToWork.save();

  return result;
};

export const RightToWorkServices = {
  getAllRightToWorkFromDB,
  getSingleRightToWorkFromDB,
  createRightToWorkIntoDB,
  updateRightToWorkIntoDB,
};
