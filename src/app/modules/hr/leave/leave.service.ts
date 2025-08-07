import httpStatus from "http-status";

import { Leave } from "./leave.model";
import { TLeave } from "./leave.interface";
import { LeaveSearchableFields } from "./leave.constant";
import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";
import { User } from "../../user/user.model";
import { Holiday } from "../holidays/holiday.model";
import moment from "moment";

const getAllLeaveFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(
    Leave.find().populate("userId", "name title firstName initial lastName"),
    query
  )
    .search(LeaveSearchableFields)
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

const getSingleLeaveFromDB = async (id: string) => {
  const result = await Leave.findById(id);
  return result;
};

const createLeaveIntoDB = async (payload: TLeave) => {
  try {
    const result = await Leave.create(payload);

    // Calculate leave duration using moment
    const start = moment(payload.startDate);
    const end = moment(payload.endDate);
    const leaveDuration = end.diff(start, "days") + 1; // Include both start & end days

    const totalHours = leaveDuration * 8; // You can also make this dynamic using userHoliday.hoursPerDay later

    // Update requestedHours in Holiday model (correct year)
    const userHoliday = await Holiday.findOne({
      userId: payload.userId,
      year: payload.holidayYear, // ensure year matches
    });

    if (userHoliday) {
      userHoliday.requestedHours += totalHours;
      await userHoliday.save();
    }

    return result;
  } catch (error: any) {
    console.error("Error in createLeaveIntoDB:", error);
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message || "Failed to create Leave");
  }
};


const updateLeaveIntoDB = async (id: string, payload: Partial<TLeave>) => {
  const leave = await Leave.findById(id);

  if (!leave) {
    throw new AppError(httpStatus.NOT_FOUND, "Leave not found");
  }

  const updatedLeave = await Leave.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!updatedLeave) {
    throw new AppError(httpStatus.NOT_FOUND, "Leave not found after update");
  }

  // Only update holiday record if leave status changes to 'approved' from 'pending'
  if (leave.status === 'pending' && updatedLeave.status === 'approved') {
    const userHoliday = await Holiday.findOne({
      userId: updatedLeave.userId,
      year: updatedLeave.holidayYear, // must match same year
    });

    if (!userHoliday) {
      throw new AppError(httpStatus.NOT_FOUND, "Holiday record not found for the year");
    }

     const start = moment(updatedLeave.startDate);
    const end = moment(updatedLeave.endDate);
    const leaveDuration = end.diff(start, 'days') + 1;
    const totalHours = leaveDuration * userHoliday.hoursPerDay;
    
    // Transfer from requested to used
    userHoliday.requestedHours -= totalHours;
    userHoliday.usedHours += totalHours;
    userHoliday.remainingHours = userHoliday.holidayAccured - userHoliday.usedHours;

    await userHoliday.save();
  }

  return updatedLeave;
};



export const LeaveServices = {
  getAllLeaveFromDB,
  getSingleLeaveFromDB,
  updateLeaveIntoDB,
  createLeaveIntoDB,
};
