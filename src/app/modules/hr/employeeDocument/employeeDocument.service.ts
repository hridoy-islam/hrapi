import httpStatus from "http-status";

import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";
import { EmployeeDocument } from "./employeeDocument.model";
import { TEmployeeDocument } from "./employeeDocument.interface";
import { EmployeeDocumentSearchableFields } from "./employeeDocument.constant";


const getAllEmployeeDocumentFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(EmployeeDocument.find(), query)
    .search(EmployeeDocumentSearchableFields)
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

const getSingleEmployeeDocumentFromDB = async (id: string) => {
  const result = await EmployeeDocument.findById(id);
  return result;
};


const createEmployeeDocumentIntoDB = async (payload: TEmployeeDocument) => {
    try {
      
      const result = await EmployeeDocument.create(payload);
      return result;
    } catch (error: any) {
      console.error("Error in createEmployeeDocumentIntoDB:", error);
  
      // Throw the original error or wrap it with additional context
      if (error instanceof AppError) {
        throw error;
      }
  
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message || "Failed to create EmployeeDocument");
    }
  };


const updateEmployeeDocumentIntoDB = async (id: string, payload: Partial<TEmployeeDocument>) => {
  const employeeDocument = await EmployeeDocument.findById(id);

  if (!employeeDocument) {
    throw new AppError(httpStatus.NOT_FOUND, "EmployeeDocument not found");
  }

  // Toggle `isDeleted` status for the selected user only
  // const newStatus = !user.isDeleted;

  // // Check if the user is a company, but only update the selected user
  // if (user.role === "company") {
  //   payload.isDeleted = newStatus;
  // }

  // Update only the selected user
  const result = await EmployeeDocument.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};



const deleteEmployeeDocumentFromDB = async (id: string) => {
  const employeeDocument = await EmployeeDocument.findById(id);

  if (!employeeDocument) {
    throw new AppError(httpStatus.NOT_FOUND, "EmployeeDocument not found");
  }

  await EmployeeDocument.findByIdAndDelete(id);

  return { message: "EmployeeDocument deleted successfully" };
};



export const EmployeeDocumentServices = {
    getAllEmployeeDocumentFromDB,
    getSingleEmployeeDocumentFromDB,
    updateEmployeeDocumentIntoDB,
    createEmployeeDocumentIntoDB,
    deleteEmployeeDocumentFromDB
  
};



  