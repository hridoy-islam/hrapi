import httpStatus from "http-status";

import { Notice } from "./notice.model";
import { TNotice } from "./notice.interface";
import { NoticeSearchableFields } from "./notice.constant";
import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";

const getAllNoticeFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(Notice.find().populate("designation" ,"title").populate("department" ,"departmentName").populate("users" ,"title firstName lastName").populate("noticeBy" ,"title firstName lastName"), query)
    .search(NoticeSearchableFields)
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

const getSingleNoticeFromDB = async (id: string) => {
  const result = await Notice.findById(id);
  return result;
};


const createNoticeIntoDB = async (payload: TNotice) => {
    try {
      
      const result = await Notice.create(payload);
      return result;
    } catch (error: any) {
      console.error("Error in createNoticeIntoDB:", error);
  
      // Throw the original error or wrap it with additional context
      if (error instanceof AppError) {
        throw error;
      }
  
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message || "Failed to create Notice");
    }
  };


const updateNoticeIntoDB = async (id: string, payload: Partial<TNotice>) => {
  const notice = await Notice.findById(id);

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
  const result = await Notice.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};




export const NoticeServices = {
    getAllNoticeFromDB,
    getSingleNoticeFromDB,
    updateNoticeIntoDB,
    createNoticeIntoDB
  
};



  