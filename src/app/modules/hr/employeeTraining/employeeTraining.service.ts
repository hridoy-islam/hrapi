import httpStatus from "http-status";
import AppError from "../../../errors/AppError";
import { EmployeeTraining } from "./employeeTraining.model";
import {
  TEmployeeTraining,
  TCompletionRecord,
} from "./employeeTraining.interface";
import QueryBuilder from "../../../builder/QueryBuilder";
import { EmployeeTrainingSearchableFields } from "./employeeTraining.constant";

const getAllEmployeeTrainingFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(
    EmployeeTraining.find().populate("trainingId")
      .populate("employeeId", "firstName lastName initial name"),
    query,
  )
    .search(EmployeeTrainingSearchableFields)
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

const getSingleEmployeeTrainingFromDB = async (id: string) => {
  const result = await EmployeeTraining.findById(id).populate("trainingId") .populate("employeeId", "firstName lastName initial name");
  return result;
};

const createEmployeeTrainingIntoDB = async (payload: any) => {
  // 1. Check if training already exists for this user
  const existingTraining = await EmployeeTraining.findOne({
    employeeId: payload.employeeId,
    trainingId: payload.trainingId,
  });

  if (existingTraining) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Training already assigned. Please update the existing record.",
    );
  }

  // 2. Create new record (History starts empty)
  const result = await EmployeeTraining.create({
    ...payload,
    status: payload.status || "pending",
    completionHistory: [],
  });

  return result;
};

const updateEmployeeTrainingIntoDB = async (
  id: string,
  payload: Partial<TEmployeeTraining>,
) => {
  const employeeTraining = await EmployeeTraining.findById(id);

  if (!employeeTraining) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "EmployeeTraining record not found",
    );
  }

  // If the new status is 'completed' AND it wasn't completed before (or we want to log every completion)
  if (
    payload.status === "completed" &&
    employeeTraining.status !== "completed"
  ) {
    // Create a history entry using the CURRENT data (snapshot)
    const historyEntry: TCompletionRecord = {
      assignedDate: employeeTraining.assignedDate, // The date it was originally assigned
      expireDate: employeeTraining.expireDate,
      completedAt: new Date(), // Now
      certificate: payload.certificate || employeeTraining.certificate, // Use new cert if provided, else old
    };

    // Push to history
    employeeTraining.completionHistory.push(historyEntry);
  }

  if (payload.assignedDate)
    employeeTraining.assignedDate = payload.assignedDate;
  if (payload.expireDate) employeeTraining.expireDate = payload.expireDate;
  if (payload.status) employeeTraining.status = payload.status;
  if (payload.certificate) employeeTraining.certificate = payload.certificate;

  const result = await employeeTraining.save();
  return result;
};

export const EmployeeTrainingServices = {

  createEmployeeTrainingIntoDB,
  updateEmployeeTrainingIntoDB,
  getAllEmployeeTrainingFromDB,
  getSingleEmployeeTrainingFromDB,
};
