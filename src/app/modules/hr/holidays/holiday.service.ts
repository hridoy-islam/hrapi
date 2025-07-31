import httpStatus from "http-status";

import { Holiday } from "./holiday.model";
import { THoliday } from "./holiday.interface";
import { HolidaySearchableFields } from "./holiday.constant";
import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";
import { User } from "../../user/user.model";



const HOURS_PER_YEAR = 224;
const HOURS_PER_DAY = 8;

function getHolidayYearRange(): string {
  const now = new Date();
  const currentYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${currentYear}-${currentYear + 1}`;
}



export const generateAnnualHolidayForAllUsers = async () => {
  const year = getHolidayYearRange();

  const users = await User.find(); // Fetch all users

  for (const user of users) {
    // Check if this user already has a record for this year
    const exists = await Holiday.findOne({ userId: user._id, year });

    if (!exists) {
      await Holiday.create({
        userId: user._id,
        year,
        totalHours: HOURS_PER_YEAR,
        usedHours: 0,
        remainingHours: HOURS_PER_YEAR,
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
  const result = await userQuery.modelQuery;

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
  
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message || "Failed to create Holiday");
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
    createHolidayIntoDB
  
};



  