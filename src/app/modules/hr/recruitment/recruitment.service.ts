import httpStatus from "http-status";

import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";
import { Recruitment } from "./recruitment.model";
import { RecruitmentSearchableFields } from "./recruitment.constant";
import { TRecruitment } from "./recruitment.interface";

const getAllRecruitmentFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(
    Recruitment.find().populate({
      path: 'applicantId',
      
      populate: {
        path: 'vacancyId',
        select: 'title'
      }
    }),
    query
  )
  
  
    .search(RecruitmentSearchableFields)
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

const getSingleRecruitmentFromDB = async (id: string) => {
  const result = await Recruitment.findById(id);
  return result;
};


const createRecruitmentIntoDB = async (payload: TRecruitment) => {
    try {
      
      const result = await Recruitment.create(payload);
      return result;
    } catch (error: any) {
      console.error("Error in createRecruitmentIntoDB:", error);
  
      // Throw the original error or wrap it with additional context
      if (error instanceof AppError) {
        throw error;
      }
  
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message || "Failed to create Recruitment");
    }
  };


const updateRecruitmentIntoDB = async (id: string, payload: Partial<TRecruitment>) => {
  const notice = await Recruitment.findById(id);

  if (!notice) {
    throw new AppError(httpStatus.NOT_FOUND, "Recruitment not found");
  }

  // Toggle `isDeleted` status for the selected user only
  // const newStatus = !user.isDeleted;

  // // Check if the user is a company, but only update the selected user
  // if (user.role === "company") {
  //   payload.isDeleted = newStatus;
  // }

  // Update only the selected user
  const result = await Recruitment.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};


export const RecruitmentServices = {
    getAllRecruitmentFromDB,
    getSingleRecruitmentFromDB,
    updateRecruitmentIntoDB,
    createRecruitmentIntoDB
  
};



  