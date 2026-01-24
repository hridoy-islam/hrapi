import AppError from "../../errors/AppError";
import mongoose from "mongoose";
import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import moment from "moment";

import { TCSV } from "./csv.interface";
import CSV from "./csv.model";
import { User } from "../user/user.model";

// Searchable fields
const csvSearchableFields = [
  "attendances.name",
  "attendances.email",
  "attendances.phone",
  "attendances.note",
];

const createCSVIntoDB = async (payload: TCSV) => {
  try {
    // Validate that attendances exist
    if (!payload.attendances || !Array.isArray(payload.attendances)) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid attendance data format");
    }

    // Step 1: Extract all emails from the payload
    const emails = payload.attendances
      .map((entry) => entry.email?.trim())
      .filter((email) => email); // Filter out null/undefined/empty strings

    // Step 2: Query existing Users by these emails
    const existingUsers = await User.find({
      email: { $in: emails },
    }).select("_id email");

    // Step 3: Create an Email -> UserId Map for O(1) lookup
    const emailToUserIdMap = new Map(
      existingUsers.map((u:any) => [u.email, u._id])
    );

    // Step 4: Update the attendance objects with the found userId
    const updatedAttendances = payload.attendances.map((entry) => {
      const userEmail = entry.email?.trim();
      const matchedUserId = userEmail ? emailToUserIdMap.get(userEmail) : undefined;

      return {
        ...entry,
        userId: matchedUserId, // Adds userId if found, otherwise undefined
      };
    });

    // Step 5: Create the CSV document with the linked userIds
    const result = await CSV.create({
      ...payload,
      attendances: updatedAttendances,
    });

    return result;
  } catch (error: any) {
    console.error("❌ Error in createCSVIntoDB:", error);
    if (error instanceof AppError) throw error;
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to create CSV"
    );
  }
};

const deleteCSVFromDB = async (id: string) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid ID format");
    }

    const existingCSV = await CSV.findById(id);
    if (!existingCSV) {
      throw new AppError(httpStatus.NOT_FOUND, "CSV not found!");
    }

    const result = await CSV.findByIdAndDelete(id);

    if (!result) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to delete the CSV"
      );
    }

    return result;
  } catch (error: any) {
    console.error("Error in deleteCSVFromDB:", error);
    if (error instanceof AppError) throw error;
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to delete CSV"
    );
  }
};

// Removes a specific Attendance line item from the CSV document
const removeAttendanceFromCSV = async (
  csvId: string,
  attendanceId: string
) => {
  const result = await CSV.findByIdAndUpdate(
    csvId,
    { $pull: { attendances: { _id: attendanceId } } },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!result) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "CSV document not found or attendance entry doesn't exist"
    );
  }

  return result;
};

// Retrieves all CSVs from the database
const getAllCSVsFromDB = async (query: Record<string, unknown>) => {
  const CSVQuery = new QueryBuilder(CSV.find().populate("companyId"), query)
    .search(csvSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await CSVQuery.countTotal();
  const result = await CSVQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getAllCompanyCSVsFromDB = async (
  companyId: string,
  query: Record<string, unknown>
) => {
  const { fromDate, toDate, searchTerm, ...otherQueryParams } = query;

  // Initialize base query with companyId
  const baseQuery: any = {
    companyId: new mongoose.Types.ObjectId(companyId),
  };

  // Apply date filters to createdAt
  if (fromDate && toDate) {
    baseQuery.createdAt = {
      $gte: moment(fromDate as string).startOf("day").toDate(),
      $lte: moment(toDate as string).endOf("day").toDate(),
    };
  } else if (fromDate) {
    baseQuery.createdAt = {
      $gte: moment(fromDate as string).startOf("day").toDate(),
    };
  } else if (toDate) {
    baseQuery.createdAt = {
      $lte: moment(toDate as string).endOf("day").toDate(),
    };
  }

  // Initialize QueryBuilder
  const CSVQuery = new QueryBuilder(
    CSV.find(baseQuery).populate("companyId", "name email"),
    otherQueryParams
  );

  // Handle search term (searching nested array fields)
  if (searchTerm) {
    const searchTermStr = searchTerm.toString();
    const searchRegex = { $regex: searchTermStr, $options: "i" };

    CSVQuery.modelQuery = CSVQuery.modelQuery.or([
      { "attendances.name": searchRegex },
      { "attendances.email": searchRegex },
      { "attendances.phone": searchRegex },
      { "attendances.note": searchRegex },
    ]);
  }

  const finalQuery = CSVQuery.filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await finalQuery.countTotal();
  const result = await finalQuery.modelQuery;

  return {
    meta,
    result,
  };
};

// Retrieves a single CSV
const getOneCSVFromDB = async (id: string) => {
  const result = await CSV.findById(id).populate("companyId");
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "CSV not found!");
  }
  return result;
};

export const CSVServices = {
  createCSVIntoDB,
  deleteCSVFromDB,
  removeAttendanceFromCSV,
  getAllCSVsFromDB,
  getOneCSVFromDB,
  getAllCompanyCSVsFromDB,
};