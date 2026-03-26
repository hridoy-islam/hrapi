import httpStatus from "http-status";

import { Leave } from "./leave.model";
import { TLeave } from "./leave.interface";
import { LeaveSearchableFields } from "./leave.constant";
import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";
import { User } from "../../user/user.model";
import { Holiday } from "../holidays/holiday.model";
import moment from '../../../utils/moment-setup';

const getAllLeaveFromDB = async (query: Record<string, unknown>) => {
  const { fromDate, toDate, ...restQuery } = query;

  const dateFilters: any[] = [];
  
  if (fromDate) {
    dateFilters.push({ endDate: { $gte: new Date(fromDate as string) } });
  }
  if (toDate) {
    dateFilters.push({ startDate: { $lte: new Date(toDate as string) } });
  }

  // Inject the date filters into the rest of the query object
  if (dateFilters.length > 0) {
    restQuery.$and = dateFilters;
  }

  const userQuery = new QueryBuilder(
    Leave.find().populate("userId", "name title firstName initial lastName"),
    restQuery
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

// const createLeaveIntoDB = async (payload: TLeave) => {
//   try {
//     const result = await Leave.create(payload);

//     // Calculate leave duration using moment
//     const start = moment(payload.startDate);
//     const end = moment(payload.endDate);
//     const leaveDuration = end.diff(start, "days") + 1; // Include both start & end days

//     const totalHours = leaveDuration * 8; // You can also make this dynamic using userHoliday.hoursPerDay later

//     // Update requestedHours in Holiday model (correct year)
//     const userHoliday = await Holiday.findOne({
//       userId: payload.userId,
//       year: payload.holidayYear, // ensure year matches
//     });

//     if (userHoliday) {
//       userHoliday.requestedHours += totalHours;
//       await userHoliday.save();
//     }

//     return result;
//   } catch (error: any) {
//     console.error("Error in createLeaveIntoDB:", error);
//     throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message || "Failed to create Leave");
//   }
// };


const createLeaveIntoDB = async (payload: TLeave) => {
  try {
    const userHoliday = await Holiday.findOne({
      userId: payload.userId,
      year: payload.holidayYear,
    });
    
    const start = moment(payload.startDate);
    const end = moment(payload.endDate);

    // 1. Generate leaveDays purely for logging/calendar display
    let leaveDays = payload.leaveDays && payload.leaveDays.length > 0 ? payload.leaveDays : [];
    
    if (leaveDays.length === 0) {
      let current = start.clone();
      while (current.isSameOrBefore(end, "day")) {
        leaveDays.push({
          leaveDate: current.toDate(),
          leaveType: payload.holidayType === "holiday" ? "paid" : "unpaid",
        });
        current.add(1, "day");
      }
    }
    payload.leaveDays = leaveDays;

    // 2. Use totalHours directly from the payload
    const finalTotalHours = payload.totalHours || 0;
    const isPaid = payload.holidayType === "holiday";

    const paidHours = isPaid ? finalTotalHours : 0;
    const unpaidHours = !isPaid ? finalTotalHours : 0;

    payload.totalHours = finalTotalHours;

    // 3. Save Leave
    const result = await Leave.create(payload);

    // 4. Update Holiday Request Counters
    if (userHoliday) {
      userHoliday.requestedHours += paidHours;
      userHoliday.unpaidLeaveRequest += unpaidHours;
      await userHoliday.save();
    }

    return result;
  } catch (error: any) {
    console.error("Error in createLeaveIntoDB:", error);
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to create Leave"
    );
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

  // Only update holiday counters if status changes to 'approved' from 'pending'
  if (leave.status === 'pending' && updatedLeave.status === 'approved') {
    const userHoliday = await Holiday.findOne({
      userId: updatedLeave.userId,
      year: updatedLeave.holidayYear, 
    });

    if (!userHoliday) {
      throw new AppError(httpStatus.NOT_FOUND, "Holiday record not found for the year");
    }

    const finalTotalHours = updatedLeave.totalHours || 0;
    const isPaid = updatedLeave.holidayType === 'holiday';

    const paidHours = isPaid ? finalTotalHours : 0;
    const unpaidHours = !isPaid ? finalTotalHours : 0;
    
    // Transfer Paid from Requested -> Booked
    userHoliday.requestedHours -= paidHours;
    userHoliday.bookedHours += paidHours;
    
    // Transfer Unpaid from Requested -> Booked
    userHoliday.unpaidLeaveRequest -= unpaidHours;
    userHoliday.unpaidBookedHours += unpaidHours;

    // Update remaining hours based on accrued vs used + booked
    userHoliday.remainingHours = userHoliday.holidayAccured - (userHoliday.usedHours + userHoliday.bookedHours);

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
