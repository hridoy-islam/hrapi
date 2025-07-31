import httpStatus from "http-status";

import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";

import { Email } from "./email-setup.model";
import { EmailSearchableFields } from "./email-setup.constant";
import { TEmail } from "./email-setup.interface";

const getEmailFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(Email.find(), query)
    .search(EmailSearchableFields)
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
//   const result = await Department.findById(id);
//   return result;
// };

const createEmailIntoDB = async (payload: TEmail) => {
  try {
    const result = await Email.create(payload);
    return result;
  } catch (error: any) {
    console.error("Error in createEmailIntoDB:", error);

    // Throw the original error or wrap it with additional context
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to create Email"
    );
  }
};

const updateEmailIntoDB = async (id: string, payload: Partial<TEmail>) => {
  const notice = await Email.findById(id);

  if (!notice) {
    throw new AppError(httpStatus.NOT_FOUND, "Email not found");
  }

  // Toggle `isDeleted` status for the selected user only
  // const newStatus = !user.isDeleted;

  // // Check if the user is a company, but only update the selected user
  // if (user.role === "company") {
  //   payload.isDeleted = newStatus;
  // }

  // Update only the selected user
  const result = await Email.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};

export const EmailServices = {
  createEmailIntoDB,
  getEmailFromDB,
  updateEmailIntoDB,
};
