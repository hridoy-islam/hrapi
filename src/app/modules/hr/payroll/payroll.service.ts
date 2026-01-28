// import httpStatus from "http-status";
// import AppError from "../../../errors/AppError";
// import moment from "moment";
// import { Payroll } from "./payroll.model";
// import { TPayroll } from "./payroll.interface";
// import { BankHoliday } from "../bank-holiday/bank-holiday.model";
// import { EmployeeRate } from "../employeeRate/employeeRate.model";
// import { Attendance } from "../../attendance/attendance.model";

// // --- Helper Functions ---

// const timeToMinutes = (timeStr: string) => {
//   if (!timeStr) return 0;
//   const [hours, minutes] = timeStr.split(':').map(Number);
//   return hours * 60 + minutes;
// };

// const calculatePayrollData = async (userId: string, companyId: string, fromDate: Date, toDate: Date) => {
//   const fromDateStr = moment(fromDate).format('YYYY-MM-DD');
//   const toDateStr = moment(toDate).format('YYYY-MM-DD');

//   // 1. Fetch Attendance
//   const attendanceRecords = await Attendance.find({
//     userId,
//     startDate: { $gte: fromDateStr, $lte: toDateStr },
//   });

//   if (!attendanceRecords || attendanceRecords.length === 0) {
//     throw new AppError(httpStatus.NOT_FOUND, 'No attendance records found for this period');
//   }

//   // 2. Fetch ALL Employee Rates (User may have multiple profiles/contracts)
//   const employeeRates = await EmployeeRate.find({ employeeId: userId }).populate('shiftId');

//   if (!employeeRates || employeeRates.length === 0) {
//     throw new AppError(httpStatus.NOT_FOUND, 'Employee rates not configured.');
//   }

//   let totalAmount = 0;
//   let totalHour = 0;
//   const attendanceList = [];

//   for (const record of attendanceRecords) {
//     const recordDate = record.startDate;
//     const dayOfWeek = moment(recordDate).format('dddd');

//     // --- Shift Matching Logic ---
//     // We search across ALL employee rate documents and ALL their shifts 
//     // to find the closest start time match.
//     let matchedShift = null;
//     let matchedRateDoc = null;
//     let minDiff = Infinity;
    
//     if (record.startTime) {
//       const attendanceStartMins = timeToMinutes(record.startTime);

//       // Loop through all Rate Profiles
//       for (const rateDoc of employeeRates) {
//         const shifts = rateDoc.shiftId as unknown as any[];
//         if (shifts && shifts.length > 0) {
//            // Loop through Shifts in this Profile
//            for (const shift of shifts) {
//               const shiftStartMins = timeToMinutes(shift.startTime);
//               const diff = Math.abs(shiftStartMins - attendanceStartMins);
              
//               if (diff < minDiff) {
//                  minDiff = diff;
//                  matchedShift = shift;
//                  matchedRateDoc = rateDoc;
//               }
//            }
//         }
//       }
//     }

//     // Fallback: If no match found (unlikely), use the first available doc
//     const currentRateDoc = matchedRateDoc || employeeRates[0];
//     const currentShiftId = matchedShift ? matchedShift._id : null;

//     // --- Rate Logic ---
//     // Use the rate map from the SPECIFIC matched document
//     const rateConfig = currentRateDoc.rates.get(dayOfWeek);
//     const payRate = rateConfig ? rateConfig.rate : 0;

//     // --- Time Logic ---
//     let hoursWorked = record.duration || 0;
//     if (!hoursWorked && record.startTime && record.endTime) {
//        const start = timeToMinutes(record.startTime);
//        const end = timeToMinutes(record.endTime);
       
//        let diff = end - start;
//        // Handle overnight (e.g. 23:00 to 06:00 is negative diff, add 24h)
//        if (diff < 0) diff += (24 * 60);
       
//        hoursWorked = diff / 60;
//     }

//     const dailyTotal = (hoursWorked/60) * payRate;

//     totalHour += hoursWorked;
//     totalAmount += dailyTotal;

//     attendanceList.push({
//       employementRateId: currentRateDoc._id, // Link to the correct Rate Profile
//       shiftId: currentShiftId,
//       startDate: record.startDate,
//       startTime: record.startTime,
//       endDate: record.endDate,
//       endTime: record.endTime,
//       payRate: payRate,
//       note:  '',
//       bankHoliday: false, // Default to false as requested
//       bankHolidayId: undefined // Default to undefined as requested
//     });
//   }

//   return {
//     totalHour: parseFloat(totalHour.toFixed(2)),
//     totalAmount: parseFloat(totalAmount.toFixed(2)),
//     attendanceList
//   };
// };

// // --- Services ---

// const getPayrollFromDB = async (query: Record<string, unknown>) => {
//   const { month, year, page = 1, limit = 10, search, ...otherQueryParams } = query;

//   const pageNumber = Number(page);
//   const limitNumber = Number(limit);
//   const skip = (pageNumber - 1) * limitNumber;

//   const matchStage: any = { ...otherQueryParams };

//   // 📅 Month filter
//   if (month && year) {
//     const startOfMonth = moment(`${year}-${month}-01`).startOf("month").toDate();
//     const endOfMonth = moment(`${year}-${month}-01`).endOf("month").toDate();

//     matchStage.$or = [
//       { fromDate: { $gte: startOfMonth, $lte: endOfMonth } },
//       { toDate: { $gte: startOfMonth, $lte: endOfMonth } },
//       { fromDate: { $lte: startOfMonth }, toDate: { $gte: endOfMonth } }
//     ];
//   }

//   const searchRegex = search ? new RegExp(search as string, "i") : null;

//   const aggregationPipeline: any[] = [
//     { $match: matchStage },

//     // 🔗 Join User
//     {
//       $lookup: {
//         from: "users",
//         localField: "userId",
//         foreignField: "_id",
//         as: "user"
//       }
//     },
//     { $unwind: "$user" },

//     // 🔗 Join Department
//     {
//       $lookup: {
//         from: "departments",
//         localField: "user.departmentId",
//         foreignField: "_id",
//         as: "user.departmentId"
//       }
//     },
//     { $unwind: { path: "$user.departmentId", preserveNullAndEmptyArrays: true } },

//     // 🔗 Join Designation
//     {
//       $lookup: {
//         from: "designations",
//         localField: "user.designationId",
//         foreignField: "_id",
//         as: "user.designationId"
//       }
//     },
//     { $unwind: { path: "$user.designationId", preserveNullAndEmptyArrays: true } },
//   ];

//   // 🔎 Search filter on USER fields
//   if (searchRegex) {
//     aggregationPipeline.push({
//       $match: {
//         $or: [
//           { "user.firstName": searchRegex },
//           { "user.lastName": searchRegex },
//           { "user.employeeId": searchRegex },
//           { "user.email": searchRegex }
//         ]
//       }
//     });
//   }

//   // 📊 Get total count BEFORE pagination
//   const totalResult = await Payroll.aggregate([...aggregationPipeline, { $count: "total" }]);
//   const total = totalResult[0]?.total || 0;

//   // 📦 Data query with projection + pagination
//   aggregationPipeline.push(
//     { $sort: { createdAt: -1 } },
//     { $skip: skip },
//     { $limit: limitNumber },

//     // ✂️ Return ONLY needed user fields
//     {
//       $project: {
//         fromDate: 1,
//         toDate: 1,
//         status: 1,
//         totalHour: 1,
//         totalAmount: 1,
//         attendanceList: 1,
//         createdAt: 1,

//         userId: {
//           _id: "$user._id",
//           firstName: "$user.firstName",
//           lastName: "$user.lastName",
//           email: "$user.email",
//           phone: "$user.phone",
//           employeeId: "$user.employeeId",
//           designationId: {
//             title: "$user.designationId.title"
//           },
//           departmentId: {
//             departmentName: "$user.departmentId.departmentName"
//           }
//         }
//       }
//     }
//   );

//   const result = await Payroll.aggregate(aggregationPipeline);

//   return {
//     meta: {
//       page: pageNumber,
//       limit: limitNumber,
//       total,
//       totalPages: Math.ceil(total / limitNumber)
//     },
//     result
//   };
// };

// const getSinglePayrollFromDB = async (id: string) => {
//   const result = await Payroll.findById(id)
//     .populate("userId")
//     .populate({
//       path: "attendanceList.bankHolidayId", 
//       select: "title",                      
//     });

//   if (!result) {
//     throw new AppError(httpStatus.NOT_FOUND, "Payroll not found");
//   }

//   return result;
// };


// const createPayrollIntoDB = async (payload: TPayroll) => {
//   try {
//     const calculations = await calculatePayrollData(
//       payload.userId as unknown as string,
//       payload.companyId as unknown as string,
//       payload.fromDate as Date,
//       payload.toDate as Date
//     );

//     const result = await Payroll.create({
//       ...payload,
//       ...calculations,
//       status: 'pending' 
//     });

//     return result;
//   } catch (error: any) {
//     if (error instanceof AppError) throw error;
//     throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message || "Failed to create Payroll");
//   }
// };

// const updatePayrollIntoDB = async (id: string, payload: Partial<TPayroll>) => {
//   const payroll = await Payroll.findById(id);

//   if (!payroll) {
//     throw new AppError(httpStatus.NOT_FOUND, "Payroll not found");
//   }

//   const result = await Payroll.findByIdAndUpdate(id, payload, {
//     new: true,
//     runValidators: true,
//   });

//   return result;
// };

// export const PayrollServices = {
//   getPayrollFromDB,
//   getSinglePayrollFromDB,
//   createPayrollIntoDB,
//   updatePayrollIntoDB,
// };




import httpStatus from "http-status";
import AppError from "../../../errors/AppError";
import moment from "moment";
import { Payroll } from "./payroll.model";
import { TPayroll } from "./payroll.interface";
import { BankHoliday } from "../bank-holiday/bank-holiday.model";
import { EmployeeRate } from "../employeeRate/employeeRate.model";
import { Attendance } from "../../attendance/attendance.model";

// --- Helper Functions ---

const timeToMinutes = (timeStr: string) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const calculatePayrollData = async (userId: string, companyId: string, fromDate: Date, toDate: Date) => {
  const fromDateStr = moment(fromDate).format('YYYY-MM-DD');
  const toDateStr = moment(toDate).format('YYYY-MM-DD');

  // 1. Fetch Attendance
  const attendanceRecords = await Attendance.find({
    userId,
    startDate: { $gte: fromDateStr, $lte: toDateStr },
  });

  if (!attendanceRecords || attendanceRecords.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, 'No attendance records found for this period');
  }

  // 2. Fetch ALL Employee Rates (User may have multiple profiles/contracts)
  const employeeRates = await EmployeeRate.find({ employeeId: userId }).populate('shiftId');

  if (!employeeRates || employeeRates.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, 'Employee rates not configured.');
  }

  let totalAmount = 0;
  let totalHour = 0;
  const attendanceList = [];

  for (const record of attendanceRecords) {
    const recordDate = record.startDate;
    const dayOfWeek = moment(recordDate).format('dddd');

    // --- Shift Matching Logic ---
    let matchedShift = null;
    let matchedRateDoc = null;
    let minDiff = Infinity;
    
    if (record.startTime) {
      const attendanceStartMins = timeToMinutes(record.startTime);

      // Loop through all Rate Profiles
      for (const rateDoc of employeeRates) {
        const shifts = rateDoc.shiftId as unknown as any[];
        if (shifts && shifts.length > 0) {
           // Loop through Shifts in this Profile
           for (const shift of shifts) {
              const shiftStartMins = timeToMinutes(shift.startTime);
              const diff = Math.abs(shiftStartMins - attendanceStartMins);
              
              if (diff < minDiff) {
                 minDiff = diff;
                 matchedShift = shift;
                 matchedRateDoc = rateDoc;
              }
           }
        }
      }
    }

    // If no match found, throw error
    if (!matchedRateDoc || !matchedShift) {
      throw new AppError(
        httpStatus.BAD_REQUEST, 
        `No matching shift found for attendance on ${recordDate} at ${record.startTime}. Please ensure employee rate is configured with appropriate shifts.`
      );
    }

    // --- Rate Logic ---
    const rateConfig = matchedRateDoc.rates.get(dayOfWeek);
    
    if (!rateConfig) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `No rate configured for ${dayOfWeek} in the matched employee rate profile.`
      );
    }
    
    const payRate = rateConfig.rate || 0;

    // --- Time Logic: Calculate overlap between shift and attendance ---
    let hoursWorked = 0;
    
    if (record.startTime && record.endTime) {
       let attendanceStart = timeToMinutes(record.startTime);
       let attendanceEnd = timeToMinutes(record.endTime);
       let shiftStart = timeToMinutes(matchedShift.startTime);
       let shiftEnd = timeToMinutes(matchedShift.endTime);
       
       // Normalize times to handle overnight scenarios
       // If attendance crosses midnight (end < start), add 24 hours to end
       if (attendanceEnd < attendanceStart) {
         attendanceEnd += (24 * 60);
       }
       
       // If shift crosses midnight (end < start), add 24 hours to end
       if (shiftEnd < shiftStart) {
         shiftEnd += (24 * 60);
       }
       
       // Now we need to check if attendance times need to be shifted to align with shift
       // Case 1: Attendance is in the "next day" relative to shift
       // Example: Shift 01:00-12:20, Attendance 20:32-23:20
       // We need to try both interpretations:
       // a) Attendance as-is: 20:32-23:20 (1232-1400 mins)
       // b) Attendance shifted back 24h: would be negative, not valid
       // c) Shift shifted forward 24h: 01:00+24h to 12:20+24h (1500-1940 mins)
       
       // Try to find overlap in multiple scenarios
       let overlapMinutes = 0;
       
       // Scenario 1: Both on same day (no adjustment needed)
       const overlap1Start = Math.max(attendanceStart, shiftStart);
       const overlap1End = Math.min(attendanceEnd, shiftEnd);
       const overlap1 = Math.max(0, overlap1End - overlap1Start);
       overlapMinutes = Math.max(overlapMinutes, overlap1);
       
       // Scenario 2: Shift is 24 hours ahead (for overnight shifts that start late previous day)
       const shiftStart24 = shiftStart + (24 * 60);
       const shiftEnd24 = shiftEnd + (24 * 60);
       const overlap2Start = Math.max(attendanceStart, shiftStart24);
       const overlap2End = Math.min(attendanceEnd, shiftEnd24);
       const overlap2 = Math.max(0, overlap2End - overlap2Start);
       overlapMinutes = Math.max(overlapMinutes, overlap2);
       
       // Scenario 3: Attendance is 24 hours ahead
       const attendanceStart24 = attendanceStart + (24 * 60);
       const attendanceEnd24 = attendanceEnd + (24 * 60);
       const overlap3Start = Math.max(attendanceStart24, shiftStart);
       const overlap3End = Math.min(attendanceEnd24, shiftEnd);
       const overlap3 = Math.max(0, overlap3End - overlap3Start);
       overlapMinutes = Math.max(overlapMinutes, overlap3);
       
       // Convert to hours
       hoursWorked = overlapMinutes / 60;
    }

    const dailyTotal = hoursWorked * payRate;

    totalHour += hoursWorked;
    totalAmount += dailyTotal;

    attendanceList.push({
      employementRateId: matchedRateDoc._id,
      shiftId: matchedShift._id,
      startDate: record.startDate,
      startTime: record.startTime,
      endDate: record.endDate,
      endTime: record.endTime,
      payRate: payRate,
      note: '',
      bankHoliday: false,
      bankHolidayId: undefined
    });
  }

  return {
    totalHour: parseFloat(totalHour.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    attendanceList
  };
};



const getPayrollFromDB = async (query: Record<string, unknown>) => {
  const { month, year, page = 1, limit = 10, search, ...otherQueryParams } = query;
  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const matchStage: any = { ...otherQueryParams };

  if (month && year) {
    const startOfMonth = moment(`${year}-${month}-01`).startOf("month").toDate();
    const endOfMonth = moment(`${year}-${month}-01`).endOf("month").toDate();
    matchStage.$or = [
      { fromDate: { $gte: startOfMonth, $lte: endOfMonth } },
      { toDate: { $gte: startOfMonth, $lte: endOfMonth } },
      { fromDate: { $lte: startOfMonth }, toDate: { $gte: endOfMonth } }
    ];
  }

  const searchRegex = search ? new RegExp(search as string, "i") : null;

  const aggregationPipeline: any[] = [
    { $match: matchStage },
    { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
    { $lookup: { from: "departments", localField: "user.departmentId", foreignField: "_id", as: "user.departmentId" } },
    { $unwind: { path: "$user.departmentId", preserveNullAndEmptyArrays: true } },
    { $lookup: { from: "designations", localField: "user.designationId", foreignField: "_id", as: "user.designationId" } },
    { $unwind: { path: "$user.designationId", preserveNullAndEmptyArrays: true } },
  ];

  if (searchRegex) {
    aggregationPipeline.push({
      $match: {
        $or: [
          { "user.firstName": searchRegex },
          { "user.lastName": searchRegex },
          { "user.employeeId": searchRegex },
          { "user.email": searchRegex }
        ]
      }
    });
  }

  const totalResult = await Payroll.aggregate([...aggregationPipeline, { $count: "total" }]);
  const total = totalResult[0]?.total || 0;

  aggregationPipeline.push(
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limitNumber },
    {
      $project: {
        fromDate: 1, toDate: 1, status: 1, totalHour: 1, totalAmount: 1, attendanceList: 1, createdAt: 1,
        userId: {
          _id: "$user._id", firstName: "$user.firstName", lastName: "$user.lastName", email: "$user.email",
          phone: "$user.phone", employeeId: "$user.employeeId",
          designationId: { title: "$user.designationId.title" },
          departmentId: { departmentName: "$user.departmentId.departmentName" }
        }
      }
    }
  );

  const result = await Payroll.aggregate(aggregationPipeline);

  return {
    meta: { page: pageNumber, limit: limitNumber, total, totalPages: Math.ceil(total / limitNumber) },
    result
  };
};

const getSinglePayrollFromDB = async (id: string) => {
  const result = await Payroll.findById(id)
    .populate("userId")
    .populate({
      path: "attendanceList.bankHolidayId", 
      select: "title",                      
    });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Payroll not found");
  }

  return result;
};


const createPayrollIntoDB = async (payload: { userIds: string[], companyId: string, fromDate: string | Date, toDate: string | Date, note?: string }) => {
  const createdPayrolls = [];
  const errors = [];


  if (!payload.userIds || !Array.isArray(payload.userIds) || payload.userIds.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, "userIds array is required");
  }


  for (const userId of payload.userIds) {
    try {
      // 1. Check for existing payroll in this date range to prevent duplicates (Optional but recommended)
      const existingPayroll = await Payroll.findOne({
        userId: userId,
        $or: [
            { fromDate: { $gte: payload.fromDate, $lte: payload.toDate } },
            { toDate: { $gte: payload.fromDate, $lte: payload.toDate } }
        ]
      });

      if (existingPayroll) {
         throw new AppError(httpStatus.BAD_REQUEST,`Payroll already exists for this period`);
      }

      // 2. Perform Calculations
      const calculations = await calculatePayrollData(
        userId,
        payload.companyId,
        new Date(payload.fromDate),
        new Date(payload.toDate)
      );

      // 3. Create Payroll Record
      const result = await Payroll.create({
        userId,
        companyId: payload.companyId,
        fromDate: payload.fromDate,
        toDate: payload.toDate,
        note: payload.note,
        status: 'pending',
        ...calculations
      });

      createdPayrolls.push(result);

    } catch (error: any) {
      // Collect errors instead of stopping the whole process
      errors.push({
        userId,
        message: error.message || "Failed to calculate payroll"
      });
    }
  }

  // If NO payrolls were created and we have errors, throw an error
  if (createdPayrolls.length === 0 && errors.length > 0) {
    throw new AppError(
  httpStatus.BAD_REQUEST,
  `Failed to create payrolls. Details: ${errors.map(e => e.message).join(", ")}`
);

  }

  return {
    successCount: createdPayrolls.length,
    errorCount: errors.length,
    createdPayrolls,
    errors
  };
};


const regeneratePayrollById = async (id: string) => {
  // 1. Find existing payroll
  const existingPayroll = await Payroll.findById(id);

  if (!existingPayroll) {
    throw new AppError(httpStatus.NOT_FOUND, "Payroll record not found");
  }

 
  const calculations = await calculatePayrollData(
    existingPayroll.userId.toString(),
    existingPayroll.companyId.toString(),
    existingPayroll.fromDate,
    existingPayroll.toDate
  );

  // 3. Update the document with fresh values
  const updatedPayroll = await Payroll.findByIdAndUpdate(
    id,
    {
      totalHour: calculations.totalHour,
      totalAmount: calculations.totalAmount,
      attendanceList: calculations.attendanceList,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  return updatedPayroll;
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
  regeneratePayrollById, 
};