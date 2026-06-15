import httpStatus from "http-status";

import AppError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { ServiceUserDocument } from "./serviceUserDocument.model";
import { TServiceUserDocument } from "./serviceUserDocument.interface";
import { ServiceUserDocumentSearchableFields } from "./serviceUserDocument.constant";
import { User } from "../user/user.model";


const getAllServiceUserDocumentFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(ServiceUserDocument.find(), query)
    .search(ServiceUserDocumentSearchableFields)
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

const getSingleServiceUserDocumentFromDB = async (id: string) => {
  const result = await ServiceUserDocument.findById(id);
  return result;
};


const createServiceUserDocumentIntoDB = async (payload: TServiceUserDocument) => {
    try {
      
      const result = await ServiceUserDocument.create(payload);
      return result;
    } catch (error: any) {
      console.error("Error in createServiceUserDocumentIntoDB:", error);
  
      // Throw the original error or wrap it with additional context
      if (error instanceof AppError) {
        throw error;
      }
  
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message || "Failed to create ServiceUserDocument");
    }
  };


const updateServiceUserDocumentIntoDB = async (id: string, payload: Partial<TServiceUserDocument>) => {
  const serviceUserDocument = await ServiceUserDocument.findById(id);

  if (!serviceUserDocument) {
    throw new AppError(httpStatus.NOT_FOUND, "ServiceUserDocument not found");
  }


  const result = await ServiceUserDocument.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};



const deleteServiceUserDocumentFromDB = async (id: string) => {
  const serviceUserDocument = await ServiceUserDocument.findById(id);

  if (!serviceUserDocument) {
    throw new AppError(httpStatus.NOT_FOUND, "ServiceUser Document not found");
  }

  await ServiceUserDocument.findByIdAndDelete(id);

  return { message: "ServiceUserDocument deleted successfully" };
};






export const ServiceUserDocumentServices = {
  getAllServiceUserDocumentFromDB,
  getSingleServiceUserDocumentFromDB,
  updateServiceUserDocumentIntoDB,
  createServiceUserDocumentIntoDB,
  deleteServiceUserDocumentFromDB,
 
};



  