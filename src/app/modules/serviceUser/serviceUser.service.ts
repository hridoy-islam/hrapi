import httpStatus from "http-status";

import AppError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { ServiceUserSearchableFields } from "./serviceUser.constant";
import { ServiceUser } from "./serviceUser.model";
import { TServiceUser } from "./serviceUser.interface";

const getServiceUserFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(ServiceUser.find(), query)
    .search(ServiceUserSearchableFields)
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

// const getSingleNoticeFromDB = async (id: string) => {
//   const result = await ServiceUser.findById(id);
//   return result;
// };

const createServiceUserIntoDB = async (payload: TServiceUser) => {
  try {
    const result = await ServiceUser.create(payload);
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

const updateServiceUserIntoDB = async (
  id: string,
  payload: Partial<TServiceUser>
) => {
  const notice = await ServiceUser.findById(id);

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
  const result = await ServiceUser.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};

export const ServiceUserServices = {
  createServiceUserIntoDB,
  getServiceUserFromDB,
  updateServiceUserIntoDB,
};
