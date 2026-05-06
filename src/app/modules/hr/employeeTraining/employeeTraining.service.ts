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

  // If the new status is 'completed' AND it wasn't completed before
  if (
    payload.status === "completed" 
  
  ) {
    // Create a history entry using the CURRENT data (snapshot)
    const historyEntry: TCompletionRecord = {
      assignedDate: employeeTraining.assignedDate,
      expireDate: employeeTraining.expireDate,
      completedAt: (payload as any).completedAt || null,
      certificate: payload.certificate || employeeTraining.certificate, 
    };

    // Push to history logs
    employeeTraining.completionHistory.push(historyEntry);

    // Nullify main fields after logging
    employeeTraining.assignedDate = null as any; 
    employeeTraining.expireDate = null as any;
    employeeTraining.certificate = [] as any; 
    employeeTraining.status = "completed";

  } else {
    // Standard updates (e.g., when re-assigning and status is back to 'pending')
    if (payload.assignedDate) employeeTraining.assignedDate = payload.assignedDate;
    if (payload.expireDate) employeeTraining.expireDate = payload.expireDate;
    if (payload.status) employeeTraining.status = payload.status;
    if (payload.certificate) employeeTraining.certificate = payload.certificate;
  }

  const result = await employeeTraining.save();
  return result;
};



const updateTrainingLogIntoDB = async (
  employeeTrainingId: string,
  logId: string,
  payload: Partial<TCompletionRecord>,
) => {
  // 1. Find the main EmployeeTraining document
  const employeeTraining = await EmployeeTraining.findById(employeeTrainingId);

  if (!employeeTraining) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "EmployeeTraining record not found",
    );
  }

  // 2. Find the specific log inside the completionHistory array
  const logIndex = employeeTraining.completionHistory.findIndex(
    (log) => (log as any)._id.toString() === logId
  );

  if (logIndex === -1) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Training history log not found",
    );
  }

  // 3. Update the specific fields in the log
  if (payload.assignedDate) {
    employeeTraining.completionHistory[logIndex].assignedDate = payload.assignedDate;
  }
  if (payload.expireDate) {
    employeeTraining.completionHistory[logIndex].expireDate = payload.expireDate;
  }
  if (payload.completedAt) {
    employeeTraining.completionHistory[logIndex].completedAt = payload.completedAt;
  }
  if (payload.certificate) {
    employeeTraining.completionHistory[logIndex].certificate = payload.certificate;
  }

  // 4. Save the parent document to persist the nested array changes
  const result = await employeeTraining.save();
  
  return result;
};



export const EmployeeTrainingServices = {

  createEmployeeTrainingIntoDB,
  updateEmployeeTrainingIntoDB,
  getAllEmployeeTrainingFromDB,
  getSingleEmployeeTrainingFromDB,
  updateTrainingLogIntoDB,
};
