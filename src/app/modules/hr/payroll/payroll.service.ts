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


/** Calculate the overlapping (payable) minutes between attendance and rota */
const calculateOverlapMinutes = (
  rotaStart: string,
  rotaEnd: string,
  clockIn: string | Date,
  clockOut: string | Date,
): number => {
  if (!clockIn || !clockOut) return 0;

  let rStart = timeToMinutes(rotaStart);
  let rEnd = timeToMinutes(rotaEnd);
  if (rEnd < rStart) rEnd += 24 * 60;

  const mIn = moment(clockIn);
  const mOut = moment(clockOut);

  const clockInMins = mIn.hours() * 60 + mIn.minutes() + (mIn.seconds() / 60);
  const clockOutMins = mOut.hours() * 60 + mOut.minutes() + (mOut.seconds() / 60);

  let aStart = clockInMins;
  let aEnd = clockOutMins;
  if (aEnd < aStart) aEnd += 24 * 60;

  const scenarios: [number, number][] = [
    [aStart, aEnd], 
    [aStart + 24 * 60, aEnd + 24 * 60], 
    [aStart - 24 * 60, aEnd - 24 * 60], 
  ];

  let bestOverlap = 0;
  for (const [s, e] of scenarios) {
    const overlapStart = Math.max(s, rStart);
    const overlapEnd = Math.min(e, rEnd);
    const overlap = Math.max(0, overlapEnd - overlapStart);
    if (overlap > bestOverlap) bestOverlap = overlap;
  }

  return Math.floor(bestOverlap);
};

/** Helper to find the correct pay rate */
const getPayRateForShift = (
  employeeRates: any[],
  targetStartMins: number,
  dayOfWeek: string
): number => {
  if (!employeeRates.length) return 0;

  let bestRateDoc: any = null;

  if (employeeRates.length === 1) {
    bestRateDoc = employeeRates[0];
  } else {
    let minDiff = Infinity;
    for (const rateDoc of employeeRates) {
      if (!rateDoc.shiftId || !Array.isArray(rateDoc.shiftId)) continue;
      
      for (const shift of rateDoc.shiftId) {
        if (!shift || typeof shift !== 'object' || !('startTime' in shift) || !shift.startTime) continue;
        
        const shiftStartMins = timeToMinutes(String(shift.startTime));
        const rawDiff = Math.abs(shiftStartMins - targetStartMins);
        const diff = Math.min(rawDiff, 24 * 60 - rawDiff);
        
        if (diff < minDiff) {
          minDiff = diff;
          bestRateDoc = rateDoc;
        }
      }
    }
  }

  if (bestRateDoc?.rates?.has(dayOfWeek)) {
    return bestRateDoc.rates.get(dayOfWeek)?.rate ?? 0;
  }
  return 0;
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

  // 1. Fetch approved standard attendance records 
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

  // 2. Fetch AL (Annual Leave) Rotas directly
  const alRotas = await Rota.find({
    employeeId: userId,
    companyId,
    leaveType: "AL",
    startDate: { $gte: fromStr, $lte: toStr }
  });

  if (!attendanceRecords.length && !alRotas.length) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "No approved attendance records or AL leaves found for this period",
    );
  }

  // 3. Fetch EmployeeRates
  const employeeRates = await EmployeeRate.find({ employeeId: userId })
    .populate({
      path: "shiftId",
      select: "name startTime endTime", 
    })
    .sort({ createdAt: -1 });

  // Array perfectly matches your schema rules now
  const attendanceList: {
    attendanceId?: string;
    rotaId?: string;
    payRate: number;
    duration: number; 
  }[] = [];

  let totalDurationMinutes = 0;
  let totalAmount = 0;

  const rotaCache = new Map<string, any>();

  // ─── Process Regular Attendance ───
  for (const record of attendanceRecords) {
    const rec = record as any;
    const mClockIn = moment(rec.clockIn);
    const dayOfWeek = mClockIn.format("dddd"); 
    
    if (!rec.rotaId) {
      attendanceList.push({ 
        attendanceId: rec._id.toString(), 
        payRate: 0, 
        duration: 0 
      });
      continue;
    }

    let rota = rotaCache.get(rec.rotaId.toString());
    if (!rota) {
      rota = await Rota.findById(rec.rotaId);
      if (rota) rotaCache.set(rec.rotaId.toString(), rota);
    }

    if (!rota || !(rota as any).startTime || !(rota as any).endTime) {
      attendanceList.push({ 
        attendanceId: rec._id.toString(), 
        payRate: 0, 
        duration: 0 
      });
      continue;
    }

    const rotaStartMins = timeToMinutes((rota as any).startTime);
    const rateKey = (rota as any).leaveType === "AL" ? "Holiday" : dayOfWeek;
    const currentPayRate = getPayRateForShift(employeeRates, rotaStartMins, rateKey);
    
    const overlapMins = calculateOverlapMinutes(
      (rota as any).startTime,
      (rota as any).endTime,
      rec.clockIn,
      rec.clockOut,
    );

    totalDurationMinutes += overlapMins;
    totalAmount += (overlapMins / 60) * currentPayRate;

    // 🚀 ONLY pushes attendanceId. rotaId is entirely omitted.
    attendanceList.push({
      attendanceId: rec._id.toString(),
      payRate: currentPayRate,
      duration: overlapMins,
    });
  }

  // ─── Process AL (Annual Leave) Rotas ───
  for (const alRota of alRotas) {
    let durationMins = 0;
    let currentPayRate = 0;

    const rateKey = "Holiday";

    if (alRota.startTime && alRota.endTime) {
      let rStart = timeToMinutes(alRota.startTime);
      let rEnd = timeToMinutes(alRota.endTime);
      
      if (rEnd < rStart) rEnd += 24 * 60;
      
      durationMins = rEnd - rStart;
      currentPayRate = getPayRateForShift(employeeRates, rStart, rateKey);
    }

    totalDurationMinutes += durationMins;
    totalAmount += (durationMins / 60) * currentPayRate;

    // 🚀 ONLY pushes rotaId. attendanceId is entirely omitted.
    attendanceList.push({
      rotaId: alRota._id.toString(), 
      payRate: currentPayRate,
      duration: durationMins,
    });
  }

  return {
    totalHour: parseFloat((totalDurationMinutes / 60).toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    attendanceList,
  };
};


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
    }).populate({
      path: "attendanceList.rotaId",
      select:"startDate endDate leaveType shiftName",
     
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