import httpStatus from "http-status";

import { Holiday } from "./holiday.model";
import { THoliday } from "./holiday.interface";
import { HolidaySearchableFields } from "./holiday.constant";
import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";
import { User } from "../../user/user.model";
import moment from '../../../utils/moment-setup';
import { Attendance } from "../../attendance/attendance.model";
import { Types } from "mongoose";
import { Leave } from "../leave/leave.model";

const HOURS_PER_DAY = 8;


const calculateHolidayHours = async (userId: any) => {
  // 1. Define the Time Range (Formatting to match your DB's ISO format)
  const startOfYear = moment().startOf('year').toISOString();
  const endOfYear = moment().endOf('year').toISOString();

  // 2. Fetch Records 
  const attendances = await Attendance.find({
    userId,
    isApproved: true, // <-- NEW: Only calculate for approved shifts
    clockInDate: { $gte: startOfYear, $lte: endOfYear },
    clockOut: { $exists: true, $ne: null } // Ensure they actually clocked out
  });

  let totalDurationMs = 0;

  // 3. Calculate Duration using the EXACT TIME fields
  attendances.forEach(attendance => {
    // We use clockIn and clockOut here because they contain the actual hours/minutes
    const clockInTime = moment(attendance.clockIn);
    const clockOutTime = moment(attendance.clockOut);

    if (clockInTime.isValid() && clockOutTime.isValid()) {
      const diff = clockOutTime.diff(clockInTime);
      
      // Add to total, ensuring we don't accidentally add negative time if data is messy
      totalDurationMs += diff > 0 ? diff : 0; 
    }
  });

  // 4. Convert and Accrue
  const totalHoursWorked = totalDurationMs / (1000 * 60 * 60);
  
  // The 12.07% multiplier, rounded to 2 decimal places
  const holidayHours = Number((totalHoursWorked * 0.1207).toFixed(2));

  // 5. Update User Record
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

// const getAllHolidayFromDB = async (query: Record<string, unknown>) => {
//   const userQuery = new QueryBuilder(Holiday.find(), query)
//     .search(HolidaySearchableFields)
//     .filter(query)
//     .sort()
//     .paginate()
//     .fields();

//   const meta = await userQuery.countTotal();
//   let result = await userQuery.modelQuery;

//   const userId = query.userId as string | undefined;
//   const year = (query.year as string) || getHolidayYearRange();

//   if (userId) {
//     try {
//       // Step 1: Find the user
//       const user = await User.findById(userId);
//       if (!user) {
//         throw new Error(`User with ID ${userId} not found`);
//       }

//       // Step 2: Get or create holiday record
//       let holidayRecord = await Holiday.findOne({ userId, year });

//       if (!holidayRecord) {
//         const contractHours = Number(user.contractHours) || 0;
//         const holidayAllowance = contractHours * 5.6;

//         holidayRecord = await Holiday.create({
//           userId: user._id,
//           year,
//           holidayAllowance,
//           holidayAccured: 0,
//           usedHours: 0,
//           requestedHours: 0,
//           remainingHours: holidayAllowance,
//           unpaidLeaveTaken: 0,
//           unpaidLeaveRequest: 0,
//           hoursPerDay: 8,
//         });

//       }

//       // Step 3: Recalculate holidayAccured (your custom logic)
//       const calculatedAccruedHours = await calculateHolidayHours(userId);
//       const contractHours = Number(user.contractHours) || 0;
//       const holidayAllowance = contractHours * 5.6;

//       // ✅ Step 4: Calculate usedHours from approved paid leaves

//       const approvedLeaves = await Leave.find({
//         userId: new Types.ObjectId(userId),
//         holidayYear: { $regex: new RegExp(year.split('-').join('|'), 'i') }, // Flexible year match
//         status: { $in: ['approved', 'Approved', 'APPROVED'] }, // Case-tolerant
//         leaveType: { $in: ['paid', null, ''] }, // Include if not set or paid
//       });


//       let usedHours = 0;
//       approvedLeaves.forEach((leave, idx) => {
//         const hours = leave.totalHours || 0;
//         usedHours += hours;
//       });

//       // ✅ Step 5: Calculate requestedHours from pending paid leaves
//       const pendingLeaves = await Leave.find({
//         userId: new Types.ObjectId(userId),
//         holidayYear: { $regex: new RegExp(year.split('-').join('|'), 'i') },
//         status: 'pending',
//         leaveType: { $in: ['paid', null, ''] },
//       });

//       const requestedHours = pendingLeaves.reduce((sum, l) => sum + (l.totalHours || 0), 0);


//       // ✅ Step 6: Update Holiday record
//       const updatedHoliday = await Holiday.findOneAndUpdate(
//         { userId, year },
//         {
//           $set: {
//             holidayAllowance,
//             holidayAccured: calculatedAccruedHours,
//             usedHours,
//             requestedHours,
//             remainingHours: holidayAllowance - usedHours,
//           },
//         },
//         { new: true, upsert: false }
//       );


//       // Step 7: Refetch result
//       result = await Holiday.find({ userId, year });
//     } catch (error) {
//       console.error('❌ Error in getAllHolidayFromDB:', error);
//     }
//   }

//   return { meta, result };
// };



const getAllHolidayFromDB = async (query: Record<string, unknown>) => {
  // 1. Setup the standard QueryBuilder for listing holidays
  const userQuery = new QueryBuilder(Holiday.find(), query)
    .search(HolidaySearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await userQuery.countTotal();
  let result = await userQuery.modelQuery;

  const userId = query.userId as string | undefined;
  const year = (query.year as string) || getHolidayYearRange();

  // 2. If a specific userId is queried, recalculate their exact balances
  if (userId) {
    try {
      // Step A: Find the user
      const user = await User.findById(userId);
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      // Step B: Get or create the initial holiday record
      let holidayRecord = await Holiday.findOne({ userId, year });
      
      if (!holidayRecord) {
        // Only calculate allowance if the record DOES NOT exist
        const contractHours = Number(user.contractHours) || 0;
        const initialHolidayAllowance = Math.floor(contractHours * 5.6);        
        holidayRecord = await Holiday.create({
          userId: user._id,
          year,
          holidayAllowance: initialHolidayAllowance,
          holidayAccured: 0,
          usedHours: 0,
          bookedHours: 0,
          requestedHours: 0,
          remainingHours: initialHolidayAllowance,
          unpaidLeaveTaken: 0,
          unpaidBookedHours: 0,
          unpaidLeaveRequest: 0,
          hoursPerDay: 8,
        });
      }

      // Step C: Recalculate holidayAccured based on actual attendance
      const calculatedAccruedHours = await calculateHolidayHours(userId);

      // Step D: Fetch ALL leaves for this user in this holiday year
      const allLeaves = await Leave.find({
        userId: new Types.ObjectId(userId),
        holidayYear: { $regex: new RegExp(year.split('-').join('|'), 'i') } // Flexible year match
      });

      // Step E: Initialize fresh counters
      let usedHours = 0;
      let bookedHours = 0;
      let requestedHours = 0;
      
      let unpaidLeaveTaken = 0;
      let unpaidBookedHours = 0;
      let unpaidLeaveRequest = 0;

      const now = moment();

      // Step F: Iterate through every leave directly using totalHours
      allLeaves.forEach(leave => {
        const isApproved = leave.status.toLowerCase() === 'approved';
        const isPending = leave.status.toLowerCase() === 'pending';
        
        const finalHours = leave.totalHours || 0;
        const isPaid = leave.holidayType === 'holiday';
        
        // UPDATE: A leave is considered fully "taken" (used) when its end date has passed.
        const isPast = moment(leave.endDate).isBefore(now, 'day');

        if (finalHours <= 0) return;

        if (isPending) {
          if (isPaid) requestedHours += finalHours;
          else unpaidLeaveRequest += finalHours;
        } 
        else if (isApproved) {
          if (isPaid) {
            // If Paid leave:
            // Past (completed) goes to usedHours. Future/Ongoing goes to bookedHours.
            if (isPast) usedHours += finalHours;
            else bookedHours += finalHours;
          } else {
            // If Unpaid leave:
            // Past (completed) goes to unpaidLeaveTaken. Future/Ongoing goes to unpaidBookedHours.
            if (isPast) unpaidLeaveTaken += finalHours;
            else unpaidBookedHours += finalHours;
          }
        }
      });

      // Step G: Update the Holiday record with the perfectly calculated totals
      await Holiday.findOneAndUpdate(
        { userId, year },
        {
          $set: {
            holidayAccured: calculatedAccruedHours - (usedHours + bookedHours),
            usedHours,
            bookedHours,
            requestedHours,
            unpaidLeaveTaken,
            unpaidBookedHours,
            unpaidLeaveRequest,
            remainingHours: calculatedAccruedHours - (usedHours + bookedHours),
          },
        },
        { new: true, upsert: false }
      );

      // Step H: Refetch the single user's record so the API returns the freshest data
      result = await Holiday.find({ userId, year });
      
    } catch (error) {
      console.error('Error recalculating holiday stats in getAllHolidayFromDB:', error);
    }
  }

  return { meta, result };
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
