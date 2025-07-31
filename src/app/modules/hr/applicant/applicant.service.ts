import httpStatus from "http-status";

import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";
import { Applicant } from "./applicant.model";
import { ApplicantSearchableFields } from "./applicant.constant";
import { TApplicant } from "./applicant.interface";

const getAllApplicantFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(Applicant.find(), query)
    .search(ApplicantSearchableFields)
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

const getSingleApplicantFromDB = async (id: string) => {
  const result = await Applicant.findById(id);
  return result;
};

const createApplicantIntoDB = async (payload: TApplicant) => {
  try {
    const result = await Applicant.create(payload);
    return result;
  } catch (error: any) {
    console.error("Error in createApplicantIntoDB:", error);

    // Throw the original error or wrap it with additional context
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to create Applicant"
    );
  }
};

const updateApplicantIntoDB = async (
  id: string,
  payload: Partial<TApplicant>
) => {
  const applicant = await Applicant.findById(id);

  if (!applicant) {
    throw new AppError(httpStatus.NOT_FOUND, "Notice not found");
  }

  // Toggle `isDeleted` status for the selected user only
  // const newStatus = !user.isDeleted;

  // // Check if the user is a company, but only update the selected user
  // if (user.role === "company") {
  //   payload.isDeleted = newStatus;
  // }

  // Update only the selected user
  const result = await Applicant.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};

export const ApplicantServices = {
  getAllApplicantFromDB,
  getSingleApplicantFromDB,
  updateApplicantIntoDB,
  createApplicantIntoDB,
};
