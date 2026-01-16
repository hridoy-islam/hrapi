import httpStatus from "http-status";

import { AdminNotice } from "./noticeAdmin.model";
import { TAdminNotice } from "./noticeAdmin.interface";
import { AdminNoticeSearchableFields } from "./noticeAdmin.constant";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";


const getAllAdminNoticeFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(AdminNotice.find().populate("users" ,"title firstName lastName").populate("noticeBy" ,"title firstName lastName name"), query)
    .search(AdminNoticeSearchableFields)
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

const getSingleAdminNoticeFromDB = async (id: string) => {
  const result = await AdminNotice.findById(id);
  return result;
};


const createAdminNoticeIntoDB = async (payload: TAdminNotice) => {
    try {
      
      const result = await AdminNotice.create(payload);
      return result;
    } catch (error: any) {
      console.error("Error in createAdminNoticeIntoDB:", error);
  
      // Throw the original error or wrap it with additional context
      if (error instanceof AppError) {
        throw error;
      }
  
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message || "Failed to create AdminNotice");
    }
  };


const updateAdminNoticeIntoDB = async (id: string, payload: Partial<TAdminNotice>) => {
  const adminNotice = await AdminNotice.findById(id);

  if (!adminNotice) {
    throw new AppError(httpStatus.NOT_FOUND, "AdminNotice not found");
  }

  // Toggle `isDeleted` status for the selected user only
  // const newStatus = !user.isDeleted;

  // // Check if the user is a company, but only update the selected user
  // if (user.role === "company") {
  //   payload.isDeleted = newStatus;
  // }

  // Update only the selected user
  const result = await AdminNotice.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};




export const AdminNoticeServices = {
    getAllAdminNoticeFromDB,
    getSingleAdminNoticeFromDB,
    updateAdminNoticeIntoDB,
    createAdminNoticeIntoDB
  
};



  