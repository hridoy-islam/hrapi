import httpStatus from "http-status";

import { Notice } from "./notice.model";
import { TNotice } from "./notice.interface";
import { NoticeSearchableFields } from "./notice.constant";
import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";
import { User } from "../../user/user.model";
import { Types } from "mongoose";

const getAllNoticeFromDB = async (query: Record<string, unknown>) => {
  const { userId, ...restQuery } = query;
  let filterCondition: any = {};

  if (userId) {
    const objectUserId = new Types.ObjectId(userId as string);

    const user = await User.findById(objectUserId)
      .select("_id departmentId designationId");

    if (!user) throw new Error("User not found");

    filterCondition = {
      $or: [
        { noticeSetting: "all" },
        {
          noticeSetting: "department",
          department: { $in: [user.departmentId] },
        },
        {
          noticeSetting: "designation",
          designation: { $in: [user.designationId] },
        },
        {
          noticeSetting: "individual",
          users: { $in: [objectUserId] },
        },
      ],
    };
  }

  const userQuery = new QueryBuilder(
    Notice.find(filterCondition)
      .populate("designation", "title")
      .populate("department", "departmentName")
      .populate("users", "title firstName lastName")
      .populate("noticeBy", "title name firstName lastName"),
    restQuery
  )
    .search(NoticeSearchableFields)
    .filter(restQuery)
    .sort()
    .paginate()
    .fields();

  const meta = await userQuery.countTotal();
  const result = await userQuery.modelQuery;

  return { meta, result };
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



  