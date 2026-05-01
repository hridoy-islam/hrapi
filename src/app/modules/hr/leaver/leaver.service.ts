import httpStatus from "http-status";

import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";
import { Leaver } from "./leaver.model";
import { LeaverSearchableFields } from "./leaver.constant";
import { TLeaver } from "./leaver.interface";
import { User } from "../../user/user.model";

const getAllLeaverFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(
    Leaver.find().populate({
      path: "userId",
      select: "name firstName lastName email",
    }).populate({
      path: "approvedBy",
      select: "name firstName lastName email",
    }),
    query,
  )

    .search(LeaverSearchableFields)
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

const getSingleLeaverFromDB = async (id: string) => {
  const result = await Leaver.findById(id);
  return result;
};

const createLeaverIntoDB = async (payload: TLeaver) => {
  try {
    const result = await Leaver.create(payload);

    if (payload.userId) {
      const user = await User.findById(payload.userId);

      if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
      }

      user.status = "block";
      await user.save();
    }

    return result;
  } catch (error: any) {
    console.error("Error in createLeaverIntoDB:", error);

    // Throw the original error or wrap it with additional context
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to create Leaver",
    );
  }
};

const updateLeaverIntoDB = async (id: string, payload: Partial<TLeaver>) => {
  const notice = await Leaver.findById(id);

  if (!notice) {
    throw new AppError(httpStatus.NOT_FOUND, "Leaver not found");
  }

  // Toggle `isDeleted` status for the selected user only
  // const newStatus = !user.isDeleted;

  // // Check if the user is a company, but only update the selected user
  // if (user.role === "company") {
  //   payload.isDeleted = newStatus;
  // }

  // Update only the selected user
  const result = await Leaver.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};


const deleteSingleLeaverFromDB = async (id: string) => {
  const leaver = await Leaver.findById(id);
  if (!leaver) {
    throw new AppError(httpStatus.NOT_FOUND, "Leaver not found");
  }
  const result = await Leaver.findByIdAndDelete(id);


  return result;
};

export const LeaverServices = {
  getAllLeaverFromDB,
  getSingleLeaverFromDB,
  updateLeaverIntoDB,
  createLeaverIntoDB,
  deleteSingleLeaverFromDB
};
