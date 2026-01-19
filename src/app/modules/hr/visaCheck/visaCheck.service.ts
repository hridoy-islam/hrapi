import httpStatus from "http-status";

import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";
import { VisaCheckSearchableFields } from "./visaCheck.constant";
import { VisaCheck } from "./visaCheck.model";
import { TVisaCheck } from "./visaCheck.interface";
import moment from "moment";

const getAllVisaCheckFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(
    VisaCheck.find()
      .populate("logs.updatedBy", "firstName lastName initial name")
      .populate("employeeId", "firstName lastName initial name"),
    query
  )
    .search(VisaCheckSearchableFields)
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

const getSingleVisaCheckFromDB = async (id: string) => {
  const result = await VisaCheck.findById(id);
  return result;
};

const createVisaCheckIntoDB = async (payload: any) => {
  try {
    // 1. Construct the initial log entry
    const initialLogEntry = {
      title: "Visa Information Initiated", // Professional default title
      date: new Date(),
      updatedBy: payload.updatedBy,
      document: payload.document || "",
    };

    // 2. Prepare the final data object matching the Schema
    const visaData = {
      employeeId: payload.employeeId,
      startDate: payload.startDate,
      expiryDate: payload.expiryDate,
      status: "active", 
      logs: [initialLogEntry],
    };

    // 3. Create the record in the database
    const result = await VisaCheck.create(visaData);
    return result;
  } catch (error: any) {
    console.error("Error in createVisaCheckIntoDB:", error);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to create VisaCheck"
    );
  }
};

const updateVisaCheckIntoDB = async (
  id: string,
  payload: Partial<TVisaCheck> 
) => {
  const visaCheck = await VisaCheck.findById(id);

  if (!visaCheck) {
    throw new AppError(httpStatus.NOT_FOUND, "VisaCheck not found");
  }


  const { title, document, updatedBy, ...updateData } = payload as any;

 
  const logEntry = {
    title:  "Visa Details Updated",
    date: new Date(),
    document: document || "",
    updatedBy: updatedBy,
  };

  if (visaCheck.logs) {
    visaCheck.logs.push(logEntry);
  } else {
    visaCheck.logs = [logEntry];
  }

  // 3. Update the Visa data fields (startDate, expiryDate, status, etc.)
  Object.assign(visaCheck, updateData);

  
  const result = await visaCheck.save();
  return result;
};


export const VisaCheckServices = {
  getAllVisaCheckFromDB,
  getSingleVisaCheckFromDB,
  createVisaCheckIntoDB,
  updateVisaCheckIntoDB,
};
