import httpStatus from "http-status";

import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";

import moment from "moment";
import { RequestDocumentSearchableFields } from "./requestDocument.constant";
import { RequestDocument } from "./requestDocument.model";
import { TRequestDocument } from "./requestDocument.interface";

const getMonthStartAndEnd = (month: string, year: string) => {
  const startOfMonth = moment(`${year}-${month}-01`, "YYYY-MM-DD")
    .startOf("month")
    .toDate();
  const endOfMonth = moment(`${year}-${month}-01`, "YYYY-MM-DD")
    .endOf("month")
    .toDate();
  return { startOfMonth, endOfMonth };
};

const getRequestDocumentFromDB = async (query: Record<string, unknown>) => {
  const { fromDate, toDate, ...otherQueryParams } = query;

  // Base query with population
  const userQuery = new QueryBuilder(
    RequestDocument.find()
      .populate("userId", "name firstName initial lastName email phone")
      .populate({
        path: "userId",
        populate: {
          path: "departmentId",
          select: "departmentName",
        },
      }).populate({
        path: "userId",
        populate: {
          path: "designationId",
          select: "title",
        },
      }),
    otherQueryParams
  )
    .search(RequestDocumentSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  // --- Fetch meta and results ---
  const meta = await userQuery.countTotal();
  const result = await userQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleRequestDocumentFromDB = async (id: string) => {
  const result = await RequestDocument.findById(id);
  return result;
};

const createRequestDocumentIntoDB = async (payload: TRequestDocument) => {
  try {
    const result = await RequestDocument.create(payload);
    return result;
  } catch (error: any) {
    console.error("Error in create RequestDocumentIntoDB:", error);

    // Throw the original error or wrap it with additional context
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to create RequestDocument"
    );
  }
};

const updateRequestDocumentIntoDB = async (id: string, payload: Partial<TRequestDocument>) => {
  const requestDocument = await RequestDocument.findById(id);

  if (!requestDocument) {
    throw new AppError(httpStatus.NOT_FOUND, "RequestDocument not found");
  }

  const result = await RequestDocument.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};

export const RequestDocumentServices = {
  getRequestDocumentFromDB,
  getSingleRequestDocumentFromDB,
  createRequestDocumentIntoDB,
  updateRequestDocumentIntoDB,
};
