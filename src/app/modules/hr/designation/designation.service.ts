import httpStatus from "http-status";

import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";
import { Designation } from "./designation.model";
import { TDesignation } from "./designation.interface";
import { DesignationSearchableFields } from "./designation.constant";


const getAllDesignationFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(Designation.find(), query)
    .search(DesignationSearchableFields)
    .filter()
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

const getSingleDesignationFromDB = async (id: string) => {
  const result = await Designation.findById(id);
  return result;
};


const createDesignationIntoDB = async (payload: TDesignation) => {
    try {
      
      const result = await Designation.create(payload);
      return result;
    } catch (error: any) {
      console.error("Error in createDesignationIntoDB:", error);
  
      // Throw the original error or wrap it with additional context
      if (error instanceof AppError) {
        throw error;
      }
  
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message || "Failed to create Designation");
    }
  };


const updateDesignationIntoDB = async (id: string, payload: Partial<TDesignation>) => {
  const notice = await Designation.findById(id);

  if (!notice) {
    throw new AppError(httpStatus.NOT_FOUND, "Designation not found");
  }

  // Toggle `isDeleted` status for the selected user only
  // const newStatus = !user.isDeleted;

  // // Check if the user is a company, but only update the selected user
  // if (user.role === "company") {
  //   payload.isDeleted = newStatus;
  // }

  // Update only the selected user
  const result = await Designation.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};


export const DesignationServices = {
    getAllDesignationFromDB,
    getSingleDesignationFromDB,
    updateDesignationIntoDB,
    createDesignationIntoDB
  
};



  