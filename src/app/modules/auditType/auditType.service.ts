import httpStatus from "http-status";


import { AuditType } from "./auditType.model";
import { TAuditType } from "./auditType.interface";
import { AuditTypeSearchableFields } from "./auditType.constant";
import AppError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";


const getAllAuditTypeFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(AuditType.find(), query)
    .search(AuditTypeSearchableFields)
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

const getSingleAuditTypeFromDB = async (id: string) => {
  const result = await AuditType.findById(id);
  return result;
};


const createAuditTypeIntoDB = async (payload: TAuditType) => {
    try {
      
      const result = await AuditType.create(payload);
      return result;
    } catch (error: any) {
      console.error("Error in createAuditTypeIntoDB:", error);
  
      // Throw the original error or wrap it with additional context
      if (error instanceof AppError) {
        throw error;
      }
  
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message || "Failed to create AuditType");
    }
  };


const updateAuditTypeIntoDB = async (id: string, payload: Partial<TAuditType>) => {
  const auditType = await AuditType.findById(id);

  if (!auditType) {
    throw new AppError(httpStatus.NOT_FOUND, "AuditType not found");
  }

  // Toggle `isDeleted` status for the selected user only

  // Update only the selected user
  const result = await AuditType.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};



const deleteAuditTypeFromDB = async (id: string) => {
  const auditType = await AuditType.findById(id);

  if (!auditType) {
    throw new AppError(httpStatus.NOT_FOUND, "AuditType not found");
  }

  await AuditType.findByIdAndDelete(id);

  return { message: "AuditType deleted successfully" };
};



export const AuditTypeServices = {
    getAllAuditTypeFromDB,
    getSingleAuditTypeFromDB,
    updateAuditTypeIntoDB,
    createAuditTypeIntoDB,
    deleteAuditTypeFromDB
  
};



  