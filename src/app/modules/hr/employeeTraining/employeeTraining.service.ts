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
  // Check if training already exists
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

  // If optional, ensure expireDate is null
  if (payload.isOptional) {
    payload.expireDate = null;
  }

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

  // If the new status is 'completed'
  if (payload.status === "completed") {
    const historyEntry: TCompletionRecord = {
      assignedDate: employeeTraining.assignedDate,
      expireDate: employeeTraining.expireDate,
      completedAt: (payload as any).completedAt || new Date(),
      certificate: payload.certificate || employeeTraining.certificate,
    };

    employeeTraining.completionHistory.push(historyEntry);

    employeeTraining.assignedDate = null as any;
   
    employeeTraining.expireDate = null as any;
    employeeTraining.certificate = [] as any;
    employeeTraining.status = "completed";
  } else {
    // Standard updates
    if (payload.assignedDate !== undefined) 
      employeeTraining.assignedDate = payload.assignedDate;
    
    if (payload.expireDate !== undefined) {
      employeeTraining.expireDate = payload.expireDate;
    }
    
    if (payload.status !== undefined) 
      employeeTraining.status = payload.status;
    if (payload.certificate !== undefined) 
      employeeTraining.certificate = payload.certificate;
    if (payload.isOptional !== undefined) 
      employeeTraining.isOptional = payload.isOptional;
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
