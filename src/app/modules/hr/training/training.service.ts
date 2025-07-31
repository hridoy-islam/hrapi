import httpStatus from "http-status";

import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";
import { Training } from "./training.model";
import { TrainingSearchableFields } from "./training.constant";
import { TrainingModule } from "./training.interface";


const getAllTrainingFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(Training.find(), query)
    .search(TrainingSearchableFields)
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

const getSingleTrainingFromDB = async (id: string) => {
  const result = await Training.findById(id);
  return result;
};


const createTrainingIntoDB = async (payload: TrainingModule) => {
    try {
      
      const result = await Training.create(payload);
      return result;
    } catch (error: any) {
      console.error("Error in createTrainingIntoDB:", error);
  
      // Throw the original error or wrap it with additional context
      if (error instanceof AppError) {
        throw error;
      }
  
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message || "Failed to create Training");
    }
  };


const updateTrainingIntoDB = async (id: string, payload: Partial<TrainingModule>) => {
  const notice = await Training.findById(id);

  if (!notice) {
    throw new AppError(httpStatus.NOT_FOUND, "Training not found");
  }

  // Toggle `isDeleted` status for the selected user only
  // const newStatus = !user.isDeleted;

  // // Check if the user is a company, but only update the selected user
  // if (user.role === "company") {
  //   payload.isDeleted = newStatus;
  // }

  // Update only the selected user
  const result = await Training.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};


export const TrainingServices = {
    getAllTrainingFromDB,
    getSingleTrainingFromDB,
    updateTrainingIntoDB,
    createTrainingIntoDB
  
};

  