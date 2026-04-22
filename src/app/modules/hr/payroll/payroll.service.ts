import httpStatus from "http-status";
import AppError from "../../../errors/AppError";
import moment from "../../../utils/moment-setup";
import { Payroll } from "./payroll.model";
import { TPayroll } from "./payroll.interface";
import { Attendance } from "../../attendance/attendance.model";
import { User } from "../../user/user.model";
import { Rota } from "../../rota/rota.model";
import { Types } from "mongoose";

// ─── Helpers ────────────────────────────────────────────────────────────────
const generatePayrollRefId = (): string => {
  const datePart = moment().format("YYYYMMDD");
  // Generates a 4-character random alphanumeric string
  const randomPart = Math.random().toString(36).substring(2, 6);
  return `pay-${datePart}${randomPart}`;
};


/** Convert "HH:MM" → total minutes from midnight */
const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

/**
 * Calculate the overlapping (payable) minutes between a rota window and an
 * actual clock-in / clock-out window.
 *
 * Rules
 * ──────
 * • If the rota's endTime < startTime  → the rota crosses midnight
 *   (e.g. 22:00 → 06:00 means the shift ends the next calendar day).
 * • The employee is only paid for the portion of their clock-in/out that
 *   falls WITHIN the rota window.
 *   - Arrives early  → cap start at rota start
 *   - Leaves late    → cap end   at rota end
 *   - Arrives late / leaves early → use their actual times
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
  // moment-setup sets Europe/London as default tz, so .hours()/.minutes()
  // automatically reflect the correct local time.
  const mIn = moment(clockIn);
  const mOut = moment(clockOut);

  const clockInMins = mIn.hours() * 60 + mIn.minutes();
  const clockOutMins = mOut.hours() * 60 + mOut.minutes();

  let aStart = clockInMins;
  let aEnd = clockOutMins;

  // Overnight attendance
  if (aEnd < aStart) aEnd += 24 * 60;

  // ── Try ±24 h offsets to handle edge cases where attendance and rota ───────
  // fall on different sides of midnight relative to each other.
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

  return bestOverlap; // minutes
};

// ─── Core calculation per employee ──────────────────────────────────────────

const calculatePayrollForEmployee = async (
  userId: string,
  companyId: string,
  fromDate: Date,
  toDate: Date,
) => {
  // moment-setup default tz (Europe/London) is used for all formatting
  const fromStr = moment(fromDate).format("YYYY-MM-DD");
  const toStr = moment(toDate).format("YYYY-MM-DD");

  // 1. Fetch approved attendance records in the date range.
  //    clockIn is stored as an ISO string — compare the first 10 chars (YYYY-MM-DD).
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

  // 2. Get employee's payRate from User.payroll.payRate (default 0)
  const employee = await User.findById(userId).select("payroll");
  const payRate: number = (employee as any)?.payroll?.payRate ?? 0;

  // 3. Build attendance list
  const attendanceList: {
    attendanceId: string;
    payRate: number;
    duration: number; // minutes
  }[] = [];

  let totalDurationMinutes = 0;
  let totalAmount = 0;

  for (const record of attendanceRecords) {
    const rec = record as any;

    // 4. No rota linked — record with 0 duration
    if (!rec.rotaId) {
      attendanceList.push({
        attendanceId: rec._id.toString(),
        payRate,
        duration: 0,
      });
      continue;
    }

    const rota = await Rota.findById(rec.rotaId);

    if (!rota || !(rota as any).startTime || !(rota as any).endTime) {
      attendanceList.push({
        attendanceId: rec._id.toString(),
        payRate,
        duration: 0,
      });
      continue;
    }

    // 5. Payable minutes = overlap between rota window and actual clock-in/out
    const overlapMins = calculateOverlapMinutes(
      (rota as any).startTime,
      (rota as any).endTime,
      rec.clockIn,
      rec.clockOut,
    );

    totalDurationMinutes += overlapMins;
    totalAmount += (overlapMins / 60) * payRate;

    attendanceList.push({
      attendanceId: rec._id.toString(),
      payRate,
      duration: overlapMins,
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
    month,
    year,
    page = 1,
    limit = 10,
    search,
    companyId, // Add companyId to the query params
    ...otherQueryParams
  } = query;

  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const matchStage: any = { ...otherQueryParams };

  // ✅ Add companyId filter if provided
  if (companyId) {
    matchStage.companyId = new Types.ObjectId(companyId as string);
  }

  // ✅ Month filter
  if (month && year) {
    const startOfMonth = moment(`${year}-${String(month).padStart(2, "0")}-01`)
      .startOf("month")
      .toDate();

    const endOfMonth = moment(`${year}-${String(month).padStart(2, "0")}-01`)
      .endOf("month")
      .toDate();

    matchStage.$or = [
      { fromDate: { $gte: startOfMonth, $lte: endOfMonth } },
      { toDate: { $gte: startOfMonth, $lte: endOfMonth } },
      { fromDate: { $lte: startOfMonth }, toDate: { $gte: endOfMonth } },
    ];
  }

  const searchRegex = search ? new RegExp(search as string, "i") : null;

  // ✅ BASE PIPELINE
  const basePipeline: any[] = [
    { $match: matchStage },

    // 🔹 USER lookup
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true,
      },
    },

    // 🔹 Filter to ensure user is an employee of this company
    {
      $match: {
        $or: [
          { "user.role": "employee" },
        ],
        // Ensure the user belongs to the company
        ...(companyId
          ? {
              $expr: {
                $or: [
                  {
                    $eq: ["$user.company", new Types.ObjectId(companyId as string)],
                  },
                  { $eq: ["$user._id", new Types.ObjectId(companyId as string)] }, // For company admin
                ],
              },
            }
          : {}),
      },
    },

    // 🔹 DEPARTMENTS lookup - departmentId is an array in User schema
    {
      $lookup: {
        from: "departments",
        let: { deptIds: "$user.departmentId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $ne: ["$$deptIds", null] },
                  { $in: ["$_id", { $ifNull: ["$$deptIds", []] }] },
                ],
              },
            },
          },
        ],
        as: "departments",
      },
    },

    // 🔹 DESIGNATIONS lookup - designationId is an array in User schema
    {
      $lookup: {
        from: "designations",
        let: { desigIds: "$user.designationId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $ne: ["$$desigIds", null] },
                  { $in: ["$_id", { $ifNull: ["$$desigIds", []] }] },
                ],
              },
            },
          },
        ],
        as: "designations",
      },
    },
  ];

  // ✅ SEARCH
  if (searchRegex) {
    basePipeline.push({
      $match: {
        $or: [
          { "user.firstName": searchRegex },
          { "user.lastName": searchRegex },
          { "user.email": searchRegex },
          { refId: searchRegex }, // Search by payroll reference ID
          {
            $expr: {
              $regexMatch: {
                input: { $concat: ["$user.firstName", " ", "$user.lastName"] },
                regex: search as string,
                options: "i",
              },
            },
          },
        ],
      },
    });
  }

  // ✅ TOTAL COUNT
  const totalResult = await Payroll.aggregate([
    ...basePipeline,
    { $count: "total" },
  ]);

  const total = totalResult[0]?.total || 0;

  // ✅ FINAL PIPELINE
  const aggregationPipeline = [
    ...basePipeline,

    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limitNumber },

    {
      $project: {
        _id: 1,
        refId: 1,
        fromDate: 1,
        toDate: 1,
        status: 1,
        attendanceList: 1,
        createdAt: 1,
        updatedAt: 1,
        companyId: 1,

        // Calculate total hours
        totalHours: {
          $round: [{ $divide: [{ $sum: "$attendanceList.duration" }, 60] }, 2],
        },

        // Calculate total duration in minutes
        totalDuration: {
          $sum: "$attendanceList.duration",
        },

        // Count of attendance records
        attendanceCount: {
          $size: "$attendanceList",
        },

        // User object
        user: {
          $cond: {
            if: { $eq: ["$user", null] },
            then: null,
            else: {
              _id: "$user._id",
              firstName: "$user.firstName",
              lastName: "$user.lastName",
              name: "$user.name",
              email: "$user.email",
              phone: "$user.phone",
              role: "$user.role",
              status: "$user.status",
              payroll: "$user.payroll",
              designations: { $ifNull: ["$designations", []] },
              departments: { $ifNull: ["$departments", []] },
            },
          },
        },
      },
    },
  ];

  const result = await Payroll.aggregate(aggregationPipeline);

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
    .populate("userId")
    .populate({ path: "attendanceList.attendanceId" });

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

  // 1. Get all active, non-deleted employees of this company
  const employees = await User.find({
    company: payload.companyId,
    role: "employee",
    isDeleted: false,
    status: "active",
  }).select("_id");

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

    try {
      // 2. Prevent duplicate payroll for overlapping date range
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

      // 3. Calculate payroll for this employee
      const calculations = await calculatePayrollForEmployee(
        userId,
        payload.companyId,
        moment(payload.fromDate).toDate(),
        moment(payload.toDate).toDate(),
      );

      // 4. Persist
      const created = await Payroll.create({
        userId,
        companyId: payload.companyId,
        fromDate: payload.fromDate,
        refId: generatePayrollRefId(),
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

  return Payroll.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};

export const PayrollServices = {
  getPayrollFromDB,
  getSinglePayrollFromDB,
  createPayrollIntoDB,
  updatePayrollIntoDB,
};
