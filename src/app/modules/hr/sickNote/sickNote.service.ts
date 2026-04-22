import httpStatus from "http-status";

import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";
import { SickNoteSearchableFields } from "./sickNote.constant";
import { SickNote } from "./sickNote.model";
import { TSickNote } from "./sickNote.interface";

const getSickNoteFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(
    SickNote.find(),
    query,
  )
    .search(SickNoteSearchableFields)
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

const getSingleSickNoteFromDB = async (id: string) => {
  const result = await SickNote.findById(id);
  return result;
};

const createSickNoteIntoDB = async (payload: TSickNote) => {
  try {
    const result = await SickNote.create(payload);
    return result;
  } catch (error: any) {
    console.error("Error in createNoticeIntoDB:", error);

    // Throw the original error or wrap it with additional context
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to create Notice",
    );
  }
};

const updateSickNoteIntoDB = async (
  id: string,
  payload: Partial<TSickNote>,
) => {
  const notice = await SickNote.findById(id);

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
  const result = await SickNote.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};

export const SickNoteServices = {
  createSickNoteIntoDB,
  getSickNoteFromDB,
  updateSickNoteIntoDB,
  getSingleSickNoteFromDB,
};
