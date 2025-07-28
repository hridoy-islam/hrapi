import httpStatus from "http-status";

import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";
import { DepartmentSearchableFields } from "./department.constant";
import { Department } from "./department.model";
import { TDepartment } from "./department.interface";

const getDepartmentFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(Department.find(), query)
    .search(DepartmentSearchableFields)
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

// const getSingleNoticeFromDB = async (id: string) => {
//   const result = await Department.findById(id);
//   return result;
// };

const createDepartmentIntoDB = async (payload: TDepartment) => {
  try {
    const result = await Department.create(payload);
    return result;
  } catch (error: any) {
    console.error("Error in createNoticeIntoDB:", error);

    // Throw the original error or wrap it with additional context
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to create Notice"
    );
  }
};

const updateDepartmentIntoDB = async (
  id: string,
  payload: Partial<TDepartment>
) => {
  const notice = await Department.findById(id);

  if (!notice) {
    throw new AppError(httpStatus.NOT_FOUND, "Notice not found");
  }

  // Toggle `isDeleted` status for the selected user only
  // const newStatus = !user.isDeleted;

  // // Check if the user is a company, but only update the selected user
  // if (user.role === "company") {
  //   payload.isDeleted = newStatus;
  // }

  // Update only the selected user
  const result = await Department.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};

export const DepartmentServices = {
  createDepartmentIntoDB,
  getDepartmentFromDB,
  updateDepartmentIntoDB,
};
