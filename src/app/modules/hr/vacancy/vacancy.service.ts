import httpStatus from "http-status";

import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";
import { VacancySearchableFields } from "./vacancy.constant";
import { Vacancy } from "./vacancy.model";
import { TVacancy } from "./vacancy.interface";

const getAllVacancyFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(Vacancy.find().populate('postedBy'), query)
    .search(VacancySearchableFields)
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

const getSingleVacancyFromDB = async (id: string) => {
  const result = await Vacancy.findById(id);
  return result;
};


const createVacancyIntoDB = async (payload: TVacancy) => {
    try {
      
      const result = await Vacancy.create(payload);
      return result;
    } catch (error: any) {
      console.error("Error in createVacancyIntoDB:", error);
  
      // Throw the original error or wrap it with additional context
      if (error instanceof AppError) {
        throw error;
      }
  
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message || "Failed to create Vacancy");
    }
  };


const updateVacancyIntoDB = async (id: string, payload: Partial<TVacancy>) => {
  const vacancy = await Vacancy.findById(id);

  if (!vacancy) {
    throw new AppError(httpStatus.NOT_FOUND, "Vacancy not found");
  }

  // Toggle `isDeleted` status for the selected user only
  // const newStatus = !user.isDeleted;

  // // Check if the user is a company, but only update the selected user
  // if (user.role === "company") {
  //   payload.isDeleted = newStatus;
  // }

  // Update only the selected user
  const result = await Vacancy.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};


export const VacancyServices = {
    getAllVacancyFromDB,
    getSingleVacancyFromDB,
    createVacancyIntoDB,
    updateVacancyIntoDB  
};



  