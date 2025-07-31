import httpStatus from "http-status";

import { Leave } from "./leave.model";
import { TLeave } from "./leave.interface";
import { LeaveSearchableFields } from "./leave.constant";
import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";
import { User } from "../../user/user.model";
import { Holiday } from "../holidays/holiday.model";





const getAllLeaveFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(Leave.find().populate("userId", "name title firstName initial lastName"), query)
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
      return result;
    } catch (error: any) {
      console.error("Error in createLeaveIntoDB:", error);
  
      // Throw the original error or wrap it with additional context
      if (error instanceof AppError) {
        throw error;
      }
  
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message || "Failed to create Leave");
    }
  };


const updateLeaveIntoDB = async (id: string, payload: Partial<TLeave>) => {
  const leave = await Leave.findById(id);

  if (!leave) {
    throw new AppError(httpStatus.NOT_FOUND, "Leave not found");
  }

  // Update the leave record
  const updatedLeave = await Leave.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!updatedLeave) {
    throw new AppError(httpStatus.NOT_FOUND, "Leave not found after update");
  }
  // If the leave is approved, update the Holiday record
  if (updatedLeave.status === 'approved') {
    const userHoliday = await Holiday.findOne({ userId: updatedLeave.userId, year: updatedLeave.holidayYear });

    if (!userHoliday) {
      throw new AppError(httpStatus.NOT_FOUND, "Holiday record not found");
    }

    // Calculate total days and hours for the leave
    const leaveDuration = (new Date(updatedLeave.endDate).getTime() - new Date(updatedLeave.startDate).getTime()) / (1000 * 3600 * 24);
    const totalHours = leaveDuration * 8; // Assuming 8 hours per day

    // Update the user's holiday record
    userHoliday.holidaysTaken.push({
      startDate: updatedLeave.startDate,
      endDate: updatedLeave.endDate,
      totalDays: leaveDuration,
      totalHours: totalHours,
    reason: updatedLeave.reason ?? undefined,
      status: updatedLeave.status,
    });

    userHoliday.usedHours += totalHours;
    userHoliday.remainingHours -= totalHours;

    // Save the updated Holiday record
    await userHoliday.save();
  }

  return updatedLeave;
};


export const LeaveServices = {
    getAllLeaveFromDB,
    getSingleLeaveFromDB,
    updateLeaveIntoDB,
    createLeaveIntoDB
  
};



  