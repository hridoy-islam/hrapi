import { Schema, model, Types } from "mongoose";
import httpStatus from "http-status";
import AppError from "../../../errors/AppError";
import moment from "../../../utils/moment-setup";
import { Payroll } from "./payroll.model";
import { TPayroll } from "./payroll.interface";
import { Attendance } from "../../attendance/attendance.model";
import { User } from "../../user/user.model";
import { Rota } from "../../rota/rota.model";
import { EmployeeRate } from "../employeeRate/employeeRate.model";

/** Convert "HH:MM" → total minutes from midnight */
const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

/**
 * Calculate the overlapping (payable) minutes between a rota window and an
 * actual clock-in / clock-out window.
 */
const calculateOverlapMinutes = (
  rotaStart: string,
  rotaEnd: string,
  clockIn: string | Date,
  clockOut: string | Date,
): number => {
  if (!clockIn || !clockOut) return 0;

  // ── rota window ────────────────────────────────────────────────────────────
  let rStart = timeToMinutes(rotaStart);
  let rEnd = timeToMinutes(rotaEnd);

  // Overnight rota (e.g. 22:00 → 06:00)
  if (rEnd < rStart) rEnd += 24 * 60;

  // ── attendance window ──────────────────────────────────────────────────────
  const mIn = moment(clockIn);
  const mOut = moment(clockOut);

  // ---> THE FIX: Include seconds as fractional minutes to prevent rounding inflation
  const clockInMins = mIn.hours() * 60 + mIn.minutes() + (mIn.seconds() / 60);
  const clockOutMins = mOut.hours() * 60 + mOut.minutes() + (mOut.seconds() / 60);

  let aStart = clockInMins;
  let aEnd = clockOutMins;

  // Overnight attendance
  if (aEnd < aStart) aEnd += 24 * 60;

  const scenarios: [number, number][] = [
    [aStart, aEnd], // same day
    [aStart + 24 * 60, aEnd + 24 * 60], // attendance +24 h
    [aStart - 24 * 60, aEnd - 24 * 60], // attendance -24 h
  ];

  let bestOverlap = 0;

  for (const [s, e] of scenarios) {
    const overlapStart = Math.max(s, rStart);
    const overlapEnd = Math.min(e, rEnd);
    const overlap = Math.max(0, overlapEnd - overlapStart);
    if (overlap > bestOverlap) bestOverlap = overlap;
  }

  // Floors 473.71 to 473 perfectly!
  return Math.floor(bestOverlap);
};

// ─── Core calculation per employee ──────────────────────────────────────────

const calculatePayrollForEmployee = async (
  userId: string,
  companyId: string,
  fromDate: Date,
  toDate: Date,
) => {
  const fromStr = moment(fromDate).format("YYYY-MM-DD");
  const toStr = moment(toDate).format("YYYY-MM-DD");

  // 1. Fetch approved attendance records in the date range.
  const attendanceRecords = await Attendance.find({
    userId,
    companyId,
    isApproved: true,
    $expr: {
      $and: [
        { $gte: [{ $substr: ["$clockIn", 0, 10] }, fromStr] },
        { $lte: [{ $substr: ["$clockIn", 0, 10] }, toStr] },
      ],
    },
  });

  if (!attendanceRecords.length) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "No approved attendance records found for this period",
    );
  }

  // 2. Fetch EmployeeRates and POPULATE the shiftId array
  const employeeRates = await EmployeeRate.find({ employeeId: userId })
    .populate({
      path: "shiftId",
      select: "name startTime endTime", 
    })
    .sort({ createdAt: -1 });

  const attendanceList: {
    attendanceId: string;
    payRate: number;
    duration: number; // minutes
  }[] = [];

  let totalDurationMinutes = 0;
  let totalAmount = 0;

  const rotaCache = new Map<string, any>();

  for (const record of attendanceRecords) {
    const rec = record as any;
    const mClockIn = moment(rec.clockIn);
    const dayOfWeek = mClockIn.format("dddd"); // E.g., "Monday"
    
    let currentPayRate = 0; // Defaults to 0

    // 3. No rota linked — record with 0 duration
    if (!rec.rotaId) {
      attendanceList.push({
        attendanceId: rec._id.toString(),
        payRate: 0,
        duration: 0,
      });
      continue;
    }

    // Fetch or get cached Rota
    let rota = rotaCache.get(rec.rotaId.toString());
    if (!rota) {
      rota = await Rota.findById(rec.rotaId);
      if (rota) rotaCache.set(rec.rotaId.toString(), rota);
    }

    if (!rota || !(rota as any).startTime || !(rota as any).endTime) {
      attendanceList.push({
        attendanceId: rec._id.toString(),
        payRate: 0,
        duration: 0,
      });
      continue;
    }

    const rotaStartTime = (rota as any).startTime;
    const rotaStartMins = timeToMinutes(rotaStartTime);

    // 4. FIND THE PAY RATE based on the number of EmployeeRate records
    let bestRateDoc: any = null;

    if (employeeRates.length === 1) {
      // ✅ If there's only one rate, use it immediately
      bestRateDoc = employeeRates[0];
    } else if (employeeRates.length > 1) {
      // ✅ If there are multiple rates, find the one with the closest shift.startTime
      let minDiff = Infinity;

      for (const rateDoc of employeeRates) {
        if (!rateDoc.shiftId || !Array.isArray(rateDoc.shiftId)) continue;
        
        for (const shift of rateDoc.shiftId) {
          if (!shift || typeof shift !== 'object' || !('startTime' in shift) || !shift.startTime) continue;
          
          const shiftStartMins = timeToMinutes(String(shift.startTime));
          
          const rawDiff = Math.abs(shiftStartMins - rotaStartMins);
          const diff = Math.min(rawDiff, 24 * 60 - rawDiff);
          
          if (diff < minDiff) {
            minDiff = diff;
            bestRateDoc = rateDoc;
          }
        }
      }
    }

    // Extract the rate for the specific day from the matched doc.
    if (bestRateDoc?.rates?.has(dayOfWeek)) {
      currentPayRate = bestRateDoc.rates.get(dayOfWeek)?.rate ?? 0;
    }

    // 5. FIND THE DURATION: Calculate payable minutes capping at the Rota limits
    const overlapMins = calculateOverlapMinutes(
      (rota as any).startTime,
      (rota as any).endTime,
      rec.clockIn,
      rec.clockOut,
    );

    totalDurationMinutes += overlapMins;
    totalAmount += (overlapMins / 60) * currentPayRate;

    attendanceList.push({
      attendanceId: rec._id.toString(),
      payRate: currentPayRate,
      duration: overlapMins,
    });
  }

  return {
    totalHour: parseFloat((totalDurationMinutes / 60).toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    attendanceList,
  };
};

// const getPayrollFromDB = async (query: Record<string, unknown>) => {
//   const {
//     month,
//     year,
//     fromDate, 
//     toDate,  
//     page = 1,
//     limit = 10,
//     search,
//     companyId,
//     ...otherQueryParams
//   } = query;

//   const pageNumber = Number(page);
//   const limitNumber = Number(limit);
//   const skip = (pageNumber - 1) * limitNumber;

//   const matchStage: any = { ...otherQueryParams };

//   if (companyId) {
//     matchStage.companyId = new Types.ObjectId(companyId as string);
//   }

//   if (fromDate && toDate) {
//     const queryStart = new Date(fromDate as string);
//     const queryEnd = new Date(toDate as string);
//     queryEnd.setUTCHours(23, 59, 59, 999);

//     matchStage.fromDate = { $lte: queryEnd };
//     matchStage.toDate = { $gte: queryStart };
//   } else if (month && year) {
//     const startOfMonth = moment(`${year}-${String(month).padStart(2, "0")}-01`)
//       .startOf("month")
//       .toDate();

//     const endOfMonth = moment(`${year}-${String(month).padStart(2, "0")}-01`)
//       .endOf("month")
//       .toDate();

//     matchStage.$or = [
//       { fromDate: { $gte: startOfMonth, $lte: endOfMonth } },
//       { toDate: { $gte: startOfMonth, $lte: endOfMonth } },
//       { fromDate: { $lte: startOfMonth }, toDate: { $gte: endOfMonth } },
//     ];
//   }

//   const searchRegex = search ? new RegExp(search as string, "i") : null;

//   const basePipeline: any[] = [
//     { $match: matchStage },
//     {
//       $lookup: {
//         from: "users",
//         localField: "userId",
//         foreignField: "_id",
//         as: "user",
//       },
//     },
//     {
//       $unwind: {
//         path: "$user",
//         preserveNullAndEmptyArrays: true,
//       },
//     },
//     {
//       $match: {
//         $or: [{ "user.role": "employee" }],
//         ...(companyId
//           ? {
//               $expr: {
//                 $or: [
//                   { $eq: ["$user.company", new Types.ObjectId(companyId as string)] },
//                   { $eq: ["$user._id", new Types.ObjectId(companyId as string)] }, 
//                 ],
//               },
//             }
//           : {}),
//       },
//     },
//     {
//       $lookup: {
//         from: "departments",
//         let: { deptIds: "$user.departmentId" },
//         pipeline: [
//           {
//             $match: {
//               $expr: {
//                 $and: [
//                   { $ne: ["$$deptIds", null] },
//                   { $in: ["$_id", { $ifNull: ["$$deptIds", []] }] },
//                 ],
//               },
//             },
//           },
//           { $project: { departmentName: 1 } }
//         ],
//         as: "departments",
//       },
//     },
//     {
//       $lookup: {
//         from: "designations",
//         let: { desigIds: "$user.designationId" },
//         pipeline: [
//           {
//             $match: {
//               $expr: {
//                 $and: [
//                   { $ne: ["$$desigIds", null] },
//                   { $in: ["$_id", { $ifNull: ["$$desigIds", []] }] },
//                 ],
//               },
//             },
//           },
//           { $project: { title: 1 } }
//         ],
//         as: "designations",
//       },
//     },
//   ];

//   // ✅ SEARCH (Updated refId to payrollNo)
//   if (searchRegex) {
//     basePipeline.push({
//       $match: {
//         $or: [
//           { "user.firstName": searchRegex },
//           { "user.lastName": searchRegex },
//           { "user.email": searchRegex },
//           { payrollNo: searchRegex }, // Extracted from payrollNumber
//           {
//             $expr: {
//               $regexMatch: {
//                 input: { $concat: ["$user.firstName", " ", "$user.lastName"] },
//                 regex: search as string,
//                 options: "i",
//               },
//             },
//           },
//         ],
//       },
//     });
//   }

//   const totalResult = await Payroll.aggregate([
//     ...basePipeline,
//     { $count: "total" },
//   ]);

//   const total = totalResult[0]?.total || 0;

//   const aggregationPipeline = [
//     ...basePipeline,
//     { $sort: { createdAt: -1 } },
//     { $skip: skip },
//     { $limit: limitNumber },
//     {
//       $project: {
//         _id: 1,
//         payrollNo: 1, // Updated Projection
//         fromDate: 1,
//         toDate: 1,
//         status: 1,
//         attendanceList: 1,
//         createdAt: 1,
//         updatedAt: 1,
//         companyId: 1,
//         totalHours: {
//           $round: [{ $divide: [{ $sum: "$attendanceList.duration" }, 60] }, 2],
//         },
//         totalDuration: { $sum: "$attendanceList.duration" },
//         attendanceCount: { $size: "$attendanceList" },
//         user: {
//           $cond: {
//             if: { $eq: ["$user", null] },
//             then: null,
//             else: {
//               _id: "$user._id",
//               firstName: "$user.firstName",
//               lastName: "$user.lastName",
//               name: "$user.name",
//               email: "$user.email",
//               phone: "$user.phone",
//               role: "$user.role",
//               status: "$user.status",
//               payroll: "$user.payroll",
//               designations: { $ifNull: ["$designations", []] },
//               departments: { $ifNull: ["$departments", []] },
//             },
//           },
//         },
//       },
//     },
//   ];

//   const result = await Payroll.aggregate(aggregationPipeline);

//   return {
//     meta: {
//       page: pageNumber,
//       limit: limitNumber,
//       total,
//       totalPages: Math.ceil(total / limitNumber),
//     },
//     result,
//   };
// };


const getPayrollFromDB = async (query: Record<string, unknown>) => {
  const {
    fromDate,
    toDate,
    page = 1,
    limit = 10,
    companyId,
  } = query;

  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const matchStage: any = {};

  if (companyId) {
    matchStage.companyId = new Types.ObjectId(companyId as string);
  }

  // Date filtering
  if (fromDate && toDate) {
    const queryStart = new Date(fromDate as string);
    const queryEnd = new Date(toDate as string);
    queryEnd.setUTCHours(23, 59, 59, 999);

    matchStage.fromDate = { $lte: queryEnd };
    matchStage.toDate = { $gte: queryStart };
  }

  // Count total
  const total = await Payroll.countDocuments(matchStage);

  // Fetch data
  const result = await Payroll.aggregate([
    { $match: matchStage },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limitNumber },
    {
      $project: {
        _id: 1,
        payrollNo: 1,
        fromDate: 1,
        toDate: 1,
      },
    },
  ]);

  return {
    meta: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    },
    result,
  };
};


const getSinglePayrollFromDB = async (id: string) => {
  const result = await Payroll.findById(id)
    .populate({
      path: "userId",
      select: "firstName lastName email payroll designationId", 
      populate: {
        path: "designationId",
        select: "title",
      },
    }).populate({
      path: "companyId",
      select: "name", 
    })
    .populate({
      path: "attendanceList.attendanceId",
      select:"clockInDate clockOutDate clockIn clockOut",
      populate: {
        path: "rotaId",
        select: "shiftName startTime endTime startDate endDate ",
      },
    });

  if (!result) throw new AppError(httpStatus.NOT_FOUND, "Payroll not found");
  
  return result;
};

const createPayrollIntoDB = async (payload: {
  companyId: string;
  fromDate: string | Date;
  toDate: string | Date;
  note?: string;
}) => {
  if (!payload.companyId) {
    throw new AppError(httpStatus.BAD_REQUEST, "companyId is required");
  }

  // Fetch users with their payroll nested object so we can map payrollNo
  const employees = await User.find({
    company: payload.companyId,
    role: "employee",
    isDeleted: false,
    status: "active",
  }).select("_id payroll"); 

  if (!employees.length) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "No employees found for this company",
    );
  }

  const createdPayrolls: any[] = [];
  const errors: { userId: string; message: string }[] = [];

  for (const emp of employees) {
    const userId = (emp._id as any).toString();
    const payrollNo = (emp as any).payroll?.payrollNumber || "N/A";

    try {
      const existing = await Payroll.findOne({
        userId,
        $or: [
          { fromDate: { $gte: payload.fromDate, $lte: payload.toDate } },
          { toDate: { $gte: payload.fromDate, $lte: payload.toDate } },
          {
            fromDate: { $lte: payload.fromDate },
            toDate: { $gte: payload.toDate },
          },
        ],
      });

      if (existing) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Payroll already exists for this period",
        );
      }

      const calculations = await calculatePayrollForEmployee(
        userId,
        payload.companyId,
        moment(payload.fromDate).toDate(),
        moment(payload.toDate).toDate(),
      );

      const created = await Payroll.create({
        userId,
        companyId: payload.companyId,
        payrollNo, // Insert dynamically extracted payrollNo
        fromDate: payload.fromDate,
        toDate: payload.toDate,
        note: payload.note,
        status: "pending",
        totalHour: calculations.totalHour,
        totalAmount: calculations.totalAmount,
        attendanceList: calculations.attendanceList,
      });

      createdPayrolls.push(created);
    } catch (err: any) {
      errors.push({
        userId,
        message: err.message || "Failed to calculate payroll",
      });
    }
  }

 if (createdPayrolls.length === 0 && errors.length > 0) {
   throw new AppError(httpStatus.BAD_REQUEST, errors[0].message);
 }

  return {
    successCount: createdPayrolls.length,
    errorCount: errors.length,
    createdPayrolls,
    errors,
  };
};

const updatePayrollIntoDB = async (id: string, payload: Partial<TPayroll>) => {
  const payroll = await Payroll.findById(id);
  if (!payroll) throw new AppError(httpStatus.NOT_FOUND, "Payroll not found");

  // Determine if it's a contract (check payload first, fallback to existing payroll data)
  const isContract = payload.isContract !== undefined ? payload.isContract : payroll.isContract;

  if (isContract) {
    // Fetch the user to get the contract amount
    const user = await User.findById(payroll.userId);
    
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    // Set the contractAmount in the payload, default to 0 if undefined/null
    payload.contractAmount = user.contractAmount?.valueOf() ?? 0;
  }

  // Update the payroll with the modified payload
  return Payroll.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};


const deletePayrollIntoDB = async (id: string) => {
  const payroll = await Payroll.findById(id);
  if (!payroll) throw new AppError(httpStatus.NOT_FOUND, "Payroll not found");

  return Payroll.findByIdAndDelete(id);
};



const regeneratePayrollIntoDB = async (payload: { payrollIds: string[] }) => {
  const { payrollIds } = payload;

  if (!payrollIds || !Array.isArray(payrollIds) || payrollIds.length === 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Please provide an array of payroll IDs to regenerate"
    );
  }

  // 1. Fetch the first payroll to get the batch parameters (companyId, dates)
  const firstPayroll = await Payroll.findById(payrollIds[0]);
  
  if (!firstPayroll) {
    throw new AppError(httpStatus.NOT_FOUND, "Payroll records not found to regenerate");
  }

  const { companyId, fromDate, toDate } = firstPayroll;

  // 2. Delete all provided payroll IDs so they can be recreated cleanly
  await Payroll.deleteMany({ _id: { $in: payrollIds } });

  // 3. Run the exact creation logic for this company and date range
  // Note: createPayrollIntoDB handles all active employees, and will just skip 
  // employees that already have payrolls (the ones you didn't delete)
  return await createPayrollIntoDB({
    companyId: companyId.toString(),
    fromDate,
    toDate,
  });
};


const getCompanyPayrollByBatchFromDB = async (query: Record<string, unknown>) => {
  const {
    fromDate,
    toDate,
    page = 1,
    limit = 10,
    companyId,
  } = query;

  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const matchStage: any = {};

  if (companyId) {
    matchStage.companyId = new Types.ObjectId(companyId as string);
  }

  if (fromDate && toDate) {
    const queryStart = new Date(fromDate as string);
    const queryEnd = new Date(toDate as string);
    queryEnd.setUTCHours(23, 59, 59, 999);
    matchStage.fromDate = { $lte: queryEnd };
    matchStage.toDate = { $gte: queryStart };
  }

  const result = await Payroll.aggregate([
    { $match: matchStage },
    { $sort: { createdAt: -1 } },

    {
      $group: {
        _id: {
          fromDate: "$fromDate",
          toDate: "$toDate",
        },
        ids: { $push: "$_id" },
        companyId: { $first: "$companyId" },
        fromDate: { $first: "$fromDate" },
        toDate: { $first: "$toDate" },
        createdAt: { $first: "$createdAt" },
      },
    },

    { $sort: { fromDate: -1 } },

    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limitNumber },
          {
            $project: {
              _id: 0,
              ids: 1,
              companyId: 1,
              fromDate: 1,
              toDate: 1,
              createdAt: 1,
            },
          },
        ],
        totalCount: [
          { $count: "count" },
        ],
      },
    },
  ]);

  const data = result[0]?.data ?? [];
  const total = result[0]?.totalCount[0]?.count ?? 0;

  return {
   
    result: {data, meta: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    }},
  };
};

export const PayrollServices = {
  getPayrollFromDB,
  getSinglePayrollFromDB,
  createPayrollIntoDB,
  updatePayrollIntoDB,
  regeneratePayrollIntoDB,
  getCompanyPayrollByBatchFromDB,
  deletePayrollIntoDB
};