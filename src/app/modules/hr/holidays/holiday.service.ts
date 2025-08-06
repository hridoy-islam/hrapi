import httpStatus from "http-status";

import { Holiday } from "./holiday.model";
import { THoliday } from "./holiday.interface";
import { HolidaySearchableFields } from "./holiday.constant";
import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";
import { User } from "../../user/user.model";
import moment from "moment";
import { Attendance } from "../attendance/attendance.model";
import { Types } from "mongoose";

const HOURS_PER_DAY = 8;


const calculateHolidayHours = async (userId:any) => {
  // Get the current year using Moment
  const currentYear = moment().year();
  const startOfYear = moment().startOf('year').toDate();
  const endOfYear = moment().endOf('year').toDate();

  // Get all attendance records for the user in the current year
  const attendances = await Attendance.find({
    userId,
    clockIn: { $gte: startOfYear, $lte: endOfYear },
    clockOut: { $exists: true, $ne: null } // Only records with clockOut
  });

  // Calculate total worked hours in milliseconds
  let totalDurationMs = 0;
  
  attendances.forEach(attendance => {
    const clockIn = moment(attendance.clockIn);
    const clockOut = moment(attendance.clockOut);
    totalDurationMs += clockOut.diff(clockIn); // Difference in milliseconds
  });

  // Convert milliseconds to hours
  const totalHoursWorked = totalDurationMs / (1000 * 60 * 60);
  
  // Calculate holiday hours (11.2% of total hours worked)
  const holidayHours = totalHoursWorked * 0.112;

  // Update user's holiday totalHours field
  await User.findByIdAndUpdate(userId, { 
    $set: { 'holiday.totalHours': holidayHours } 
  });

  return holidayHours;
};




function getHolidayYearRange(): string {
  const now = new Date();
  const currentYear =
    now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${currentYear}-${currentYear + 1}`;
}

export const generateAnnualHolidayForAllUsers = async () => {
  const year = getHolidayYearRange();

  const users = await User.find(); // Fetch all users

  for (const user of users) {
    // Check if this user already has a record for this year
    const exists = await Holiday.findOne({ userId: user._id, year });

    if (!exists) {
      const contractHours = Number(user.contractHours) || 0;
      const totalHours = contractHours * 5.6;

      await Holiday.create({
        userId: user._id,
        year,
        holidayAllowance: totalHours,
        usedHours: 0,
        hoursPerDay: HOURS_PER_DAY,
        holidaysTaken: [],
      });
    }
  }

  console.log(`✅ Holiday records generated for year ${year}`);
};

const getAllHolidayFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(Holiday.find(), query)
    .search(HolidaySearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await userQuery.countTotal();
  let result = await userQuery.modelQuery;

  // Only proceed if userId is provided
  if (query.userId) {
    try {
      const userId = query.userId as string;
      const year = (query.year as string) || getHolidayYearRange(); // Fallback to current holiday year

      // Step 1: Calculate dynamic holiday entitlement based on attendance
      const holidayHours = await calculateHolidayHours(userId); // Returns calculated hours

      // Step 2: Find and update the specific Holiday document
      const updatedHoliday = await Holiday.findOneAndUpdate(
        { userId, year },
        { $set: { totalHours: holidayHours } },
        { new: true, upsert: false } // Don't create if doesn't exist
      );

      if (updatedHoliday) {
        console.log(`✅ Updated totalHours for user ${userId} in year ${year}: ${holidayHours}h`);
      } else {
        console.warn(`⚠️ No Holiday record found for userId: ${userId}, year: ${year}`);
      }

      // Optional: Refresh result to include updated data
      result = await Holiday.find({ userId, year }); // Re-fetch if needed
    } catch (error) {
      console.error('Error calculating or updating holiday hours:', error);
    }
  }

  return {
    meta,
    result,
  };
};
const getSingleHolidayFromDB = async (id: string) => {
  const result = await Holiday.findById(id);
  return result;
};

const createHolidayIntoDB = async (payload: THoliday) => {
  try {
    const result = await Holiday.create(payload);
    return result;
  } catch (error: any) {
    console.error("Error in createHolidayIntoDB:", error);

    // Throw the original error or wrap it with additional context
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to create Holiday"
    );
  }
};

const updateHolidayIntoDB = async (id: string, payload: Partial<THoliday>) => {
  const holiday = await Holiday.findById(id);

  if (!holiday) {
    throw new AppError(httpStatus.NOT_FOUND, "Holiday not found");
  }

  // Toggle `isDeleted` status for the selected user only
  // const newStatus = !user.isDeleted;

  // // Check if the user is a company, but only update the selected user
  // if (user.role === "company") {
  //   payload.isDeleted = newStatus;
  // }

  // Update only the selected user
  const result = await Holiday.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};

export const HolidayServices = {
  getAllHolidayFromDB,
  getSingleHolidayFromDB,
  updateHolidayIntoDB,
  createHolidayIntoDB,
};
