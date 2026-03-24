import httpStatus from "http-status";

import AppError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { SignatureDoc } from "./signatureDoc.model";
import { TSignatureDoc } from "./signatureDoc.interface";
import { SignatureDocSearchableFields } from "./signatureDoc.constant";


const getAllSignatureDocFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(SignatureDoc.find().populate({
      path: "employeeId",
      select:
        "name firstName lastName email phone ",}), query)
    .search(SignatureDocSearchableFields)
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

const getSingleSignatureDocFromDB = async (id: string) => {
  const result = await SignatureDoc.findById(id);
  return result;
};


const createSignatureDocIntoDB = async (payload: TSignatureDoc) => {
    try {
      
      const result = await SignatureDoc.create(payload);
      return result;
    } catch (error: any) {
      console.error("Error in createSignatureDocIntoDB:", error);
  
      // Throw the original error or wrap it with additional context
      if (error instanceof AppError) {
        throw error;
      }
  
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message || "Failed to create SignatureDoc");
    }
  };


const updateSignatureDocIntoDB = async (id: string, payload: Partial<TSignatureDoc>) => {
  const signatureDoc = await SignatureDoc.findById(id);

  if (!signatureDoc) {
    throw new AppError(httpStatus.NOT_FOUND, "SignatureDoc not found");
  }

  // Toggle `isDeleted` status for the selected user only
  // const newStatus = !user.isDeleted;

  // // Check if the user is a company, but only update the selected user
  // if (user.role === "company") {
  //   payload.isDeleted = newStatus;
  // }

  // Update only the selected user
  const result = await SignatureDoc.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};



const deleteSignatureDocFromDB = async (id: string) => {
  const signatureDoc = await SignatureDoc.findById(id);

  if (!signatureDoc) {
    throw new AppError(httpStatus.NOT_FOUND, "SignatureDoc not found");
  }

  await SignatureDoc.findByIdAndDelete(id);

  return { message: "SignatureDoc deleted successfully" };
};



export const SignatureDocServices = {
    getAllSignatureDocFromDB,
    getSingleSignatureDocFromDB,
    updateSignatureDocIntoDB,
    createSignatureDocIntoDB,
    deleteSignatureDocFromDB
  
};



  