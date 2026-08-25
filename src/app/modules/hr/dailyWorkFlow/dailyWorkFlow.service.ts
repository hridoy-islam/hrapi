import httpStatus from "http-status";

import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";
import { DailyWorkFlow } from "./dailyWorkFlow.model";
import { TDailyWorkFlow } from "./dailyWorkFlow.interface";
import { DailyWorkFlowSearchableFields } from "./dailyWorkFlow.constant";

const getAllDailyWorkFlowFromDB = async (query: Record<string, unknown>) => {
  const dailyWorkFlowQuery = new QueryBuilder(DailyWorkFlow.find().populate("employeeId", "firstName lastName initial name"), query)
    .search(DailyWorkFlowSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await dailyWorkFlowQuery.countTotal();
  const result = await dailyWorkFlowQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleDailyWorkFlowFromDB = async (id: string) => {
  const result = await DailyWorkFlow.findById(id).populate("employeeId", "firstName lastName initial name");
  return result;
};

const createDailyWorkFlowIntoDB = async (payload: TDailyWorkFlow) => {
  try {
    // Prevent duplicate daily work flow for the same employee on the same date
    const existing = await DailyWorkFlow.findOne({
      employeeId: payload.employeeId,
      date: payload.date,
    });

    if (existing) {
      throw new AppError(
        httpStatus.CONFLICT,
        "A daily work flow already exists for this employee on this date"
      );
    }

    const result = await DailyWorkFlow.create(payload);
    return result;
  } catch (error: any) {
    console.error("Error in createDailyWorkFlowIntoDB:", error);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to create Daily Work Flow"
    );
  }
};

const updateDailyWorkFlowIntoDB = async (
  id: string,
  payload: Partial<TDailyWorkFlow>
) => {
  const dailyWorkFlow = await DailyWorkFlow.findById(id);

  if (!dailyWorkFlow) {
    throw new AppError(httpStatus.NOT_FOUND, "Daily Work Flow not found");
  }

  const result = await DailyWorkFlow.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};

const deleteDailyWorkFlowFromDB = async (id: string) => {
  const dailyWorkFlow = await DailyWorkFlow.findById(id);

  if (!dailyWorkFlow) {
    throw new AppError(httpStatus.NOT_FOUND, "Daily Work Flow not found");
  }

  const result = await DailyWorkFlow.findByIdAndDelete(id);
  return result;
};

export const DailyWorkFlowServices = {
  getAllDailyWorkFlowFromDB,
  getSingleDailyWorkFlowFromDB,
  createDailyWorkFlowIntoDB,
  updateDailyWorkFlowIntoDB,
  deleteDailyWorkFlowFromDB,
};
