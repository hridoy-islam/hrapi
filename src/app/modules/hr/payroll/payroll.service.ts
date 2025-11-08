import httpStatus from "http-status";

import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";

import moment from "moment";
import { PayrollSearchableFields } from "./payroll.constant";
import { Payroll } from "./payroll.model";
import { TPayroll } from "./payroll.interface";

const getMonthStartAndEnd = (month: string, year: string) => {
  const startOfMonth = moment(`${year}-${month}-01`, "YYYY-MM-DD")
    .startOf("month")
    .toDate();
  const endOfMonth = moment(`${year}-${month}-01`, "YYYY-MM-DD")
    .endOf("month")
    .toDate();
  return { startOfMonth, endOfMonth };
};



const getPayrollFromDB = async (query: Record<string, unknown>) => {
  const { month, year, page = 1, limit = 10, search, ...otherQueryParams } = query;
  
  // Build the initial match query
  const matchQuery: any = { ...otherQueryParams };
  
  // Apply month/year filtering if provided
  if (month && year) {
    const startOfMonth = moment(`${year}-${month}-01`).startOf('month').toDate();
    const endOfMonth = moment(`${year}-${month}-01`).endOf('month').toDate();
    
    // More flexible date matching - payroll period that overlaps with the selected month
    matchQuery.$or = [
      // Payroll starts within the month
      {
        fromDate: { $gte: startOfMonth, $lte: endOfMonth }
      },
      // Payroll ends within the month
      {
        toDate: { $gte: startOfMonth, $lte: endOfMonth }
      },
      // Payroll spans the entire month
      {
        fromDate: { $lte: startOfMonth },
        toDate: { $gte: endOfMonth }
      }
    ];
  }

  // Start with the base query
  let baseQuery = Payroll.find(matchQuery)
    .populate("userId", "name firstName initial lastName email phone employeeId department designation")
    .populate({
      path: "userId",
      populate: { path: "departmentId", select: "departmentName" },
    })
    .populate({
      path: "userId",
      populate: { path: "designationId", select: "title" },
    });

  // Apply text search if provided
  if (search) {
    const searchRegex = new RegExp(search as any, 'i');
    baseQuery = baseQuery.where({
      $or: [
        { 'userId.firstName': searchRegex },
        { 'userId.lastName': searchRegex },
        { 'userId.employeeId': searchRegex },
        { 'userId.email': searchRegex }
      ]
    });
  }

  // Apply sorting
  baseQuery = baseQuery.sort({ createdAt: -1 });

  // Count total documents for pagination
  const totalQuery = Payroll.find(matchQuery);
  if (search) {
    const searchRegex = new RegExp(search as any, 'i');
    totalQuery.where({
      $or: [
        { 'userId.firstName': searchRegex },
        { 'userId.lastName': searchRegex },
        { 'userId.employeeId': searchRegex },
        { 'userId.email': searchRegex }
      ]
    });
  }
  const total = await totalQuery.countDocuments();

  // Apply pagination
  const skip = (Number(page) - 1) * Number(limit);
  const result = await baseQuery.skip(skip).limit(Number(limit));

  // Build pagination metadata
  const meta = {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / Number(limit))
  };

  return { meta, result };
};

const getSinglePayrollFromDB = async (id: string) => {
  const result = await Payroll.findById(id);
  return result;
};

const createPayrollIntoDB = async (payload: TPayroll) => {
  try {
    const result = await Payroll.create(payload);
    return result;
  } catch (error: any) {
    console.error("Error in create PayrollIntoDB:", error);

    // Throw the original error or wrap it with additional context
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to create Payroll"
    );
  }
};

const updatePayrollIntoDB = async (id: string, payload: Partial<TPayroll>) => {
  const payroll = await Payroll.findById(id);

  if (!payroll) {
    throw new AppError(httpStatus.NOT_FOUND, "Payroll not found");
  }

  const result = await Payroll.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};

export const PayrollServices = {
  getPayrollFromDB,
  getSinglePayrollFromDB,
  createPayrollIntoDB,
  updatePayrollIntoDB,
};
