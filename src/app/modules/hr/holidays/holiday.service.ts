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


const getHolidayYearDateRange = (year: string) => {
  // year = "2025-2026" → use the START year: Jan 1, 2025 → Dec 31, 2025
  const [startYear] = year.split('-').map(Number);

  const startDate = moment({ year: startYear, month: 0, day: 1 })
    .startOf('day')
    .toISOString(); // Jan 1, 2025

  const endDate = moment({ year: startYear, month: 11, day: 31 })
    .endOf('day')
    .toISOString(); // Dec 31, 2025

  return { startDate, endDate };
};



const calculateHolidayHours = async (userId: any, year: string) => {
  const { startDate, endDate } = getHolidayYearDateRange(year);

  // ✅ Fetch approved attendances and populate the associated Rota
  const attendances = await Attendance.find({
    userId,
    isApproved: true,
    clockInDate: { $gte: startDate, $lte: endDate }, // Scoped to holiday year
  }).populate('rotaId');

  let totalDurationMs = 0;

  attendances.forEach((attendance) => {
    const rota = attendance.rotaId as any;

    // ✅ Crucial Check: Ensure rota exists AND leaveType is empty or non-existent
    const isWorkingShift = rota && (!rota.leaveType || rota.leaveType.trim() === '');

    if (isWorkingShift && rota.startDate && rota.startTime && rota.endDate && rota.endTime) {
      // ✅ Parse the Rota's exact start and end dates/times
      const startDateTime = moment(
        `${moment(rota.startDate).format('YYYY-MM-DD')} ${rota.startTime}`,
        'YYYY-MM-DD HH:mm'
      );

      const endDateTime = moment(
        `${moment(rota.endDate).format('YYYY-MM-DD')} ${rota.endTime}`,
        'YYYY-MM-DD HH:mm'
      );

      if (startDateTime.isValid() && endDateTime.isValid()) {
        const diff = endDateTime.diff(startDateTime);
        totalDurationMs += diff > 0 ? diff : 0;
      }
    }
  });

  // Calculate total hours worked based on valid working Rota durations
  const totalHoursWorked = totalDurationMs / (1000 * 60 * 60);

  // ✅ Calculate Accrued Holiday (Hours * 0.1207)
  const holidayAccrued = Number((totalHoursWorked * 0.1207).toFixed(2));

  // Keep your existing User update if you still need it on the User schema
  await User.findByIdAndUpdate(userId, {
    $set: { 'holiday.totalHours': holidayAccrued },
  });

  return holidayAccrued;
};

const getLeavesForHolidayYear = async (
  userId: Types.ObjectId | string,
  year: string
) => {
  // Use exact holidayYear string match instead of loose regex
  return await Leave.find({
    userId: new Types.ObjectId(userId.toString()),
    holidayYear: year, // exact match — e.g., "2025-2026"
  });
};
const bucketLeaveHours = (allLeaves: any[]) => {
  let usedHours = 0;
  let bookedHours = 0;
  let requestedHours = 0;
  let unpaidLeaveTaken = 0;
  let unpaidBookedHours = 0;
  let unpaidLeaveRequest = 0;

  const now = moment();

  allLeaves.forEach((leave) => {
    const isApproved = leave.status.toLowerCase() === 'approved';
    const isPending = leave.status.toLowerCase() === 'pending';
    const finalHours = leave.totalHours || 0;
    const isPaid = leave.holidayType === 'holiday';
    const isPast = moment(leave.endDate).isBefore(now, 'day');

    if (finalHours <= 0) return;

    if (isPending) {
      if (isPaid) requestedHours += finalHours;
      else unpaidLeaveRequest += finalHours;
    } else if (isApproved) {
      if (isPaid) {
        if (isPast) usedHours += finalHours;
        else bookedHours += finalHours;
      } else {
        if (isPast) unpaidLeaveTaken += finalHours;
        else unpaidBookedHours += finalHours;
      }
    }
  });

  return {
    usedHours,
    bookedHours,
    requestedHours,
    unpaidLeaveTaken,
    unpaidBookedHours,
    unpaidLeaveRequest,
  };
};

const recalculateUserHoliday = async (
  employeeId: Types.ObjectId | string,
  year: string
) => {
  const empId = employeeId.toString();

  // 1. Attendance accrual calculated strictly from Working Rotas
  const calculatedAccruedHours = await calculateHolidayHours(empId, year);

  // 2. Leaves — exact year match, not regex
  const allLeaves = await getLeavesForHolidayYear(empId, year);

  // 3. Bucket into categories
  const {
    usedHours,
    bookedHours,
    requestedHours,
    unpaidLeaveTaken,
    unpaidBookedHours,
    unpaidLeaveRequest,
  } = bucketLeaveHours(allLeaves);

  // 4. Get current entitlement + carry forward for allowance
  const holidayRecord = await Holiday.findOne({ userId: empId, year });
  const currentEntitlement = holidayRecord?.holidayEntitlement || 210;
  const currentCarryForward = holidayRecord?.carryForward || 0;
  const recalculatedAllowance = Number(( calculatedAccruedHours + currentCarryForward).toFixed(2));

  // ✅ 5. New Remaining Hours Formula: Allowance + Accrued - Taken - Booked
  const remainingHours = Number(
    (recalculatedAllowance - (usedHours + bookedHours)).toFixed(2)
  );

  // 6. Persist
  const updated = await Holiday.findOneAndUpdate(
    { userId: empId, year },
    {
      $set: {
        holidayAllowance: recalculatedAllowance,
        holidayAccured: calculatedAccruedHours,
        usedHours,
        bookedHours,
        requestedHours,
        unpaidLeaveTaken,
        unpaidBookedHours,
        unpaidLeaveRequest,
        remainingHours, // ✅ Uses the updated formula
      },
    },
    { new: true, upsert: false }
  );

  return updated;
};

function getHolidayYearRange(): string {
  const now = new Date();
  const currentYear =
    now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${currentYear}-${currentYear + 1}`;
}






// const getAllHolidayFromDB = async (query: Record<string, unknown>) => {
//   const userQuery = new QueryBuilder(Holiday.find().populate({
//     path: "userId",
//     select: "firstName lastName email name",
//   }), query)
//     .search(HolidaySearchableFields)
//     .filter(query)
//     .sort()
//     .paginate()
//     .fields();

//   const meta = await userQuery.countTotal();
//   let result = await userQuery.modelQuery;

//   const userId = query.userId as string | undefined;
//   const companyId = query.companyId as string | undefined;
//   const year = (query.year as string) || getHolidayYearRange();

//   // ── CASE A: Company-wide ──────────────────────────────────────────────────
//   if (companyId) {
//     try {
//       const employees = await User.find({
//         company: new Types.ObjectId(companyId),
//         role: 'employee',
//         status: 'active',
//       }).select('_id contractHours name firstName lastName email image');

//       if (!employees.length) return { meta, result: [] };

//       // 1. Map the employee IDs for filtering later
//       const employeeIds = employees.map(emp => emp._id);

//       const recalculatedResults = await Promise.all(
//         employees.map(async (employee) => {
//           // Ensure holiday record exists for this year
//           const exists = await Holiday.findOne({ userId: employee._id, year });
//           if (!exists) {
//             const initialEntitlement = 210;
//             const initialCarryForward = 0;
//             await Holiday.create({
//               userId: employee._id,
//               year,
//               holidayEntitlement: initialEntitlement,
//               carryForward: initialCarryForward,
//               holidayAllowance: Math.floor(initialEntitlement + initialCarryForward),
//               holidayAccured: 0,
//               usedHours: 0,
//               bookedHours: 0,
//               requestedHours: 0,
//               remainingHours: 0,
//               unpaidLeaveTaken: 0,
//               unpaidBookedHours: 0,
//               unpaidLeaveRequest: 0,
//               hoursPerDay: 8,
//             });
//           }

//           // ✅ Recalculate scoped to THIS year only
//           return await recalculateUserHoliday(employee._id, year);
//         })
//       );

//       // 🔥 FIX: Add userId: { $in: employeeIds } to scope it to ONLY this company
//       result = await Holiday.find({ 
//         year, 
//         userId: { $in: employeeIds } 
//       }).populate("userId", "firstName lastName email name");

//     } catch (error) {
//       console.error('Error recalculating holiday stats for company:', error);
//     }

//     return { meta, result };
//   }

//   // ── CASE B: Single user ───────────────────────────────────────────────────
//   if (userId) {
//     try {
//       const user = await User.findById(userId);
//       if (!user) throw new Error(`User with ID ${userId} not found`);

//       // Ensure holiday record exists
//       const exists = await Holiday.findOne({ userId, year });
//       if (!exists) {
//         const initialEntitlement = 210;
//         const initialCarryForward = 0;
//         await Holiday.create({
//           userId: user._id,
//           year,
//           holidayEntitlement: initialEntitlement,
//           carryForward: initialCarryForward,
//           holidayAllowance: Math.floor(initialEntitlement + initialCarryForward),
//           holidayAccured: 0,
//           usedHours: 0,
//           bookedHours: 0,
//           requestedHours: 0,
//           remainingHours: 0,
//           unpaidLeaveTaken: 0,
//           unpaidBookedHours: 0,
//           unpaidLeaveRequest: 0,
//           hoursPerDay: 8,
//         });
//       }

//       // ✅ Recalculate scoped to THIS year only
//       await recalculateUserHoliday(userId, year);

//       result = await Holiday.find({ userId, year })
//         .populate("userId", "firstName lastName email name"); 
//     } catch (error) {
//       console.error('Error recalculating holiday stats for user:', error);
//     }
//   }

//   return { meta, result };
// };


const getAllHolidayFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(Holiday.find().populate({
    path: "userId",
    select: "firstName lastName email name",
  }), query)
    .search(HolidaySearchableFields) // Ensure this is defined in your environment
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await userQuery.countTotal();
  let result = await userQuery.modelQuery;

  const userId = query.userId as string | undefined;
  const companyId = query.companyId as string | undefined;
  const year = (query.year as string) || getHolidayYearRange();

  // ── CASE A: Company-wide ──────────────────────────────────────────────────
  if (companyId) {
    try {
      const employees = await User.find({
        company: new Types.ObjectId(companyId),
        role: 'employee',
        status: 'active',
      }).select('_id contractHours name firstName lastName email image');

      if (!employees.length) return { meta, result: [] };

      const employeeIds = employees.map(emp => emp._id);

      await Promise.all(
        employees.map(async (employee) => {
          // Ensure holiday record exists for this year
          const exists = await Holiday.findOne({ userId: employee._id, year });
          if (!exists) {
            const initialEntitlement = 210;
            const initialCarryForward = 0;
            await Holiday.create({
              userId: employee._id,
              year,
              holidayEntitlement: initialEntitlement,
              carryForward: initialCarryForward,
              holidayAllowance: Math.floor( initialCarryForward),
              holidayAccured: 0,
              usedHours: 0,
              bookedHours: 0,
              requestedHours: 0,
              remainingHours: 0,
              unpaidLeaveTaken: 0,
              unpaidBookedHours: 0,
              unpaidLeaveRequest: 0,
              hoursPerDay: 8,
            });
          }

          // Recalculate scoped to THIS year only
          return await recalculateUserHoliday(employee._id, year);
        })
      );

      result = await Holiday.find({ 
        year, 
        userId: { $in: employeeIds } 
      }).populate("userId", "firstName lastName email name");

    } catch (error) {
      console.error('Error recalculating holiday stats for company:', error);
    }

    return { meta, result };
  }

  // ── CASE B: Single user ───────────────────────────────────────────────────
  if (userId) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error(`User with ID ${userId} not found`);

      // Ensure holiday record exists
      const exists = await Holiday.findOne({ userId, year });
      if (!exists) {
        const initialEntitlement = 210;
        const initialCarryForward = 0;
        await Holiday.create({
          userId: user._id,
          year,
          holidayEntitlement: initialEntitlement,
          carryForward: initialCarryForward,
          holidayAllowance: Math.floor( initialCarryForward),
          holidayAccured: 0,
          usedHours: 0,
          bookedHours: 0,
          requestedHours: 0,
          remainingHours: 0,
          unpaidLeaveTaken: 0,
          unpaidBookedHours: 0,
          unpaidLeaveRequest: 0,
          hoursPerDay: 8,
        });
      }

      // Recalculate scoped to THIS year only
      await recalculateUserHoliday(userId, year);

      result = await Holiday.find({ userId, year })
        .populate("userId", "firstName lastName email name"); 
    } catch (error) {
      console.error('Error recalculating holiday stats for user:', error);
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
