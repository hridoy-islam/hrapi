import httpStatus from "http-status";

import { Leave } from "./leave.model";
import { TLeave } from "./leave.interface";
import { LeaveSearchableFields } from "./leave.constant";
import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";
import { User } from "../../user/user.model";
import { Holiday } from "../holidays/holiday.model";
import moment from "../../../utils/moment-setup";
import { Types } from "mongoose";
import { HolidayServices } from "../holidays/holiday.service";
import { Rota } from "../../rota/rota.model";
import { Attendance } from "../../attendance/attendance.model";
import { SickNote } from "../sickNote/sickNote.model";


// const getAllLeaveFromDB = async (query: Record<string, unknown>) => {
//   const { fromDate, toDate, companyId, limit, ...restQuery } = query;

//   const andConditions: any[] = [];

//   // ✅ Company filter (important)
//   if (companyId) {
//     andConditions.push({
//       companyId: new Types.ObjectId(companyId as string),
//     });
//   }

//   // ✅ Date overlap logic
//   if (fromDate && toDate) {
//     andConditions.push({
//       $and: [
//         { endDate: { $gte: new Date(fromDate as string) } },
//         { startDate: { $lte: new Date(toDate as string) } },
//       ],
//     });
//   } else if (fromDate) {
//     andConditions.push({
//       endDate: { $gte: new Date(fromDate as string) },
//     });
//   } else if (toDate) {
//     andConditions.push({
//       startDate: { $lte: new Date(toDate as string) },
//     });
//   }

//   // ✅ Merge all filters safely
//   const finalQuery = {
//     ...restQuery,
//     ...(andConditions.length > 0 && { $and: andConditions }),
//   };

//   // ✅ Handle limit = "all"
//   let modifiedQuery = { ...query };
//   if (limit === "all") {
//     delete modifiedQuery.limit;
//     delete modifiedQuery.page;
//   }

//   // ✅ Build query
//   const userQuery = new QueryBuilder(
//     Leave.find().populate(
//       "userId",
//       "name title firstName initial lastName"
//     ),
//     finalQuery
//   )
//     .search(LeaveSearchableFields)
//     .filter(modifiedQuery)
//     .sort()
//     .paginate()
//     .fields();

//   // ✅ Debug (optional)
//   // console.log(JSON.stringify(finalQuery, null, 2));

//   const meta = await userQuery.countTotal();
//   const result = await userQuery.modelQuery;

//   return {
//     meta,
//     result,
//   };
// };



const getAllLeaveFromDB = async (query: Record<string, unknown>) => {
  const { fromDate, toDate, companyId, ...restQuery } = query;

  const andConditions: any[] = [];

  // ✅ Company filter (important)
  if (companyId) {
    andConditions.push({
      companyId: new Types.ObjectId(companyId as string),
    });
  }

  // ✅ Date overlap logic
  if (fromDate && toDate) {
    andConditions.push({
      $and: [
        { endDate: { $gte: new Date(fromDate as string) } },
        { startDate: { $lte: new Date(toDate as string) } },
      ],
    });
  } else if (fromDate) {
    andConditions.push({
      endDate: { $gte: new Date(fromDate as string) },
    });
  } else if (toDate) {
    andConditions.push({
      startDate: { $lte: new Date(toDate as string) },
    });
  }

  // ✅ Merge all filters safely
  const finalQuery = {
    ...restQuery, // This already contains page and limit
    ...(andConditions.length > 0 && { $and: andConditions }),
  };

  // ✅ Build query - let paginate() handle limit/page
  const userQuery = new QueryBuilder(
    Leave.find().populate(
      "userId",
      "name title firstName initial lastName"
    ),
    finalQuery  // Pass finalQuery which includes page and limit
  )
    .search(LeaveSearchableFields)
    .filter(finalQuery)
    .sort()
    .paginate()  // This should read limit and page from finalQuery
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
    let leaveDays =
      payload.leaveDays && payload.leaveDays.length > 0
        ? payload.leaveDays
        : [];

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
      error.message || "Failed to create Leave",
    );
  }
};

const toIdString = (val: any): string => {
  if (!val) return "";
  if (val._id) return val._id.toString();
  return val.toString();
};

// ============================================================
// HELPER: Build start/end times for a leave shift
// ============================================================
const buildShiftTimes = (
  shiftType: string,
  durationHours: number,
): { startTime: string; endTime: string } => {
  // Added "S" (Sick Leave) to generate standard shift times similarly to Annual Leave
  if ((shiftType === "AL" || shiftType === "S") && durationHours > 0) {
    const startTime = "09:00";
    const endTime = moment(startTime, "HH:mm")
      .add(durationHours, "hours")
      .format("HH:mm");
    return { startTime, endTime };
  }
  return { startTime: "", endTime: "" };
};

// ============================================================
// HELPER: Build the common rota document shape
// ============================================================
const buildRotaDoc = (
  base: {
    companyId: any;
    employeeId: any;
    departmentId: any;
    dateStr: string;
    shiftType: string;
    startTime: string;
    endTime: string;
    actionUserId: string;
  },
  historyMessage: string,
) => ({
  companyId: base.companyId,
  employeeId: base.employeeId,
  departmentId: base.departmentId,
  startDate: base.dateStr,
  endDate: base.dateStr,
  leaveType: base.shiftType,
  shiftName: base.shiftType,
  startTime: base.startTime,
  endTime: base.endTime,
  status: "publish" as const,
  history: [
    {
      message: historyMessage,
      userId: base.actionUserId,
      createdAt: new Date(),
    },
  ],
});

// ============================================================
// HELPER: Deduplicate rotas for a department — keep the most
// recent one, delete the rest. Returns the surviving rota doc.
// ============================================================
const deduplicateRotasForDept = async (
  rotas: any[],
): Promise<any | null> => {
  if (rotas.length === 0) return null;
  if (rotas.length === 1) return rotas[0];
 
  // Sort descending by _id (most recently inserted first)
  const sorted = [...rotas].sort((a, b) =>
    b._id.toString().localeCompare(a._id.toString()),
  );
 
  const [keep, ...duplicates] = sorted;
  const duplicateIds = duplicates.map((r) => r._id);
 
  await Rota.deleteMany({ _id: { $in: duplicateIds } });
 
  return keep;
};
 
// ============================================================
// HELPER: Process rota entries for a single leave day
// ============================================================
const processRotaForLeaveDay = async (
  day: { leaveDate: Date | string; duration?: number },
  opts: {
    companyId: any;
    employeeId: any;
    allDeptRawIds: any[];
    primaryShiftType: string;
    actionUserId: string;
  },
): Promise<void> => {
  const {
    companyId,
    employeeId,
    allDeptRawIds,
    primaryShiftType,
    actionUserId,
  } = opts;
 
  const dateStr = moment(day.leaveDate).format("YYYY-MM-DD");
 
  const durationHours = day.duration ?? 0;
  const { startTime: newStartTime, endTime: newEndTime } = buildShiftTimes(
    primaryShiftType,
    durationHours,
  );
 
  const allDeptIdStrings = allDeptRawIds.map(toIdString);
 
  // ── Fetch ALL existing rotas for this employee on this day ───────────────
  const allExistingRotas = await Rota.find({
    employeeId,
    companyId,
    startDate: dateStr,
  });
 
  // ── Deduplicate per department ───────────────────────────────────────────
  // Group rotas by departmentId, delete extras, keep the newest one per dept
  const rotasByDept = new Map<string, any[]>();
  for (const rota of allExistingRotas) {
    const deptStr = toIdString(rota.departmentId);
    if (!rotasByDept.has(deptStr)) rotasByDept.set(deptStr, []);
    rotasByDept.get(deptStr)!.push(rota);
  }
 
  const survivingRotaByDept = new Map<string, any>();
  for (const [deptStr, rotas] of rotasByDept.entries()) {
    const survivor = await deduplicateRotasForDept(rotas);
    if (survivor) survivingRotaByDept.set(deptStr, survivor);
  }
 
  const isSingleDept = allDeptIdStrings.length === 1;
 
  // ── CASE 1: Single department ────────────────────────────────────────────
  if (isSingleDept) {
    const targetDeptRaw = allDeptRawIds[0];
    const targetDeptIdStr = allDeptIdStrings[0];
    const existingRota = survivingRotaByDept.get(targetDeptIdStr);
 
    if (existingRota) {
      // Rota exists → update to leaveType, clear times
      await Rota.findByIdAndUpdate(existingRota._id, {
        $set: {
          leaveType: primaryShiftType,
          shiftName: primaryShiftType,
          startTime: "",
          endTime: "",
          status: "publish",
        },
        $push: {
          history: {
            message: `System updated rota to ${primaryShiftType} from approved leave request`,
            userId: actionUserId,
            createdAt: new Date(),
          },
        },
      });
    } else {
      // No rota → create new one
      await Rota.create(
        buildRotaDoc(
          {
            companyId,
            employeeId,
            departmentId: targetDeptRaw._id ?? targetDeptRaw,
            dateStr,
            shiftType: primaryShiftType,
            startTime: newStartTime,
            endTime: newEndTime,
            actionUserId,
          },
          `System generated rota from approved leave request`,
        ),
      );
    }
    return;
  }
 
  // ── CASE 2: Multiple departments ─────────────────────────────────────────
  //
  // RULE (index-based, simple):
  //   dept[0]   → always AL / DO / S  (the primary leave shift)
  //   dept[1..n] → always NT          (no-task, regardless of existing rota)
  //
  // For each dept:
  //   - If a rota survived dedup → update it to the correct shiftType, times = ""
  //   - If no rota existed       → insert a new one with shiftType, times = ""
  //
  // Example (leave = AL):
  //   Dept A (index 0): had 3 rotas → dedup keeps 1 → update to AL ✅
  //   Dept B (index 1): had 2 rotas → dedup keeps 1 → update to NT ✅
  //   Dept C (index 2): had 1 rota  → kept as-is   → update to NT ✅
  //   Dept D (index 3): had 0 rotas → no rota       → insert NT   ✅
 
  for (let i = 0; i < allDeptRawIds.length; i++) {
    const rawId = allDeptRawIds[i];
    const deptIdStr = toIdString(rawId);
    const shiftType = i === 0 ? primaryShiftType : "NT";
    const existingRota = survivingRotaByDept.get(deptIdStr);
 
    if (existingRota) {
      // Rota exists (after dedup) → update to correct shiftType, clear times
      await Rota.findByIdAndUpdate(existingRota._id, {
        $set: {
          leaveType: shiftType,
          shiftName: shiftType,
          startTime: "",
          endTime: "",
          status: "publish",
        },
        $push: {
          history: {
            message: `System updated rota to ${shiftType} from approved leave request`,
            userId: actionUserId,
            createdAt: new Date(),
          },
        },
      });
    } else {
      // No rota → insert new one with shiftType, times always ""
      await Rota.create(
        buildRotaDoc(
          {
            companyId,
            employeeId,
            departmentId: rawId._id ?? rawId,
            dateStr,
            shiftType,
            startTime: "",
            endTime: "",
            actionUserId,
          },
          `System generated rota from approved leave request`,
        ),
      );
    }
  }
};

// ============================================================
// HELPER: Generate rotas and attendance for all leave days
// ============================================================
const generateRotaAndAttendanceForLeave = async (
  updatedLeave: any,
  actionUserId: string,
): Promise<void> => {
  let primaryShiftType = "";

  if (updatedLeave.holidayType === "holiday") {
    primaryShiftType = "AL";
  } else if (updatedLeave.holidayType === "absence") {
    primaryShiftType = "DO";
  } else if (updatedLeave.holidayType === "sick") {
    primaryShiftType = "S"; // 🚀 Added logic for Sick leave mapping to "S"
  }

  if (!primaryShiftType) return;

  const employee:any = await User.findById(updatedLeave.userId);

  if (!Array.isArray(employee?.departmentId) || employee.departmentId.length === 0 || !updatedLeave.leaveDays?.length) {
    return;
  }

  // Process each leave day independently
  for (const day of updatedLeave.leaveDays) {
    await processRotaForLeaveDay(day, {
      companyId: updatedLeave.companyId,
      employeeId: updatedLeave.userId,
      allDeptRawIds: employee.departmentId as unknown as any[],
      primaryShiftType,
      actionUserId,
    });
  }
};

// ============================================================
// MAIN SERVICE: Update leave and trigger rota/attendance logic
// ============================================================
export const updateLeaveIntoDB = async (
  id: string,
  payload: Partial<TLeave>,
  actionUserId: string,
) => {
  const leave = await Leave.findById(id);

  if (!leave) {
    throw new AppError(httpStatus.NOT_FOUND, "Leave not found");
  }

  const actionUser = await User.findById(actionUserId);

  if (!actionUser) {
    throw new AppError(httpStatus.NOT_FOUND, "Action user not found");
  }

  const userName =
    actionUser.name ||
    `${actionUser.firstName} ${actionUser.lastName}`.trim();

  // Build a meaningful history message based on what changed
  let actionMessage = `${userName} updated the leave request`;

  if (payload.status && payload.status !== leave.status) {
    if (payload.status === "approved") {
      actionMessage = `${userName} approved the leave request`;
    } else if (payload.status === "rejected") {
      actionMessage = `${userName} rejected the leave request`;
    } else {
      actionMessage
    }
  }

  const updateQuery = {
    $set: payload,
    $push: {
      history: {
        message: `${actionMessage} at`,
        userId: actionUserId,
        createdAt: new Date(),
      },
    },
  };

  const updatedLeave = await Leave.findByIdAndUpdate(id, updateQuery, {
    new: true,
    runValidators: true,
  });

  if (!updatedLeave) {
    throw new AppError(httpStatus.NOT_FOUND, "Leave not found after update");
  }

  // Only run holiday counters and rota/attendance logic when
  // status transitions from "pending" → "approved"
  if (leave.status === "pending" && updatedLeave.status === "approved") {

    // ── Update Holiday Allowances ─────────────────────────────────────────
    const userHoliday = await Holiday.findOne({
      userId: updatedLeave.userId,
      year: updatedLeave.holidayYear,
    });

    if (!userHoliday) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Holiday record not found for the year",
      );
    }

    const finalTotalHours = updatedLeave.totalHours || 0;
    const isPaid = updatedLeave.holidayType === "holiday";

    const paidHours = isPaid ? finalTotalHours : 0;
    const unpaidHours = !isPaid ? finalTotalHours : 0;

    userHoliday.requestedHours -= paidHours;
    userHoliday.bookedHours += paidHours;

    userHoliday.unpaidLeaveRequest -= unpaidHours;
    userHoliday.unpaidBookedHours += unpaidHours;

    userHoliday.remainingHours =
      userHoliday.holidayAccured -
      (userHoliday.usedHours + userHoliday.bookedHours);

    await userHoliday.save();

    // ── Generate Rota & Attendance Entries ────────────────────────────────
    await generateRotaAndAttendanceForLeave(updatedLeave, actionUserId);

    // ── 🚀 Generate Sick Note Document if holidayType is 'sick' ───────────
    if (updatedLeave.holidayType === "sick") {
      await SickNote.create({
        note: updatedLeave.reason || "",
        startDate: updatedLeave.startDate,
        endDate: updatedLeave.endDate,
        employeeId: updatedLeave.userId,
        companyId: updatedLeave.companyId,
        documents: updatedLeave.documents || [],
      });
    }
  }

  return updatedLeave;
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
    const isApproved = leave.status.toLowerCase() === "approved";
    const isPending = leave.status.toLowerCase() === "pending";
    const finalHours = leave.totalHours || 0;
    const isPaid = leave.holidayType === "holiday";
    const isPast = moment(leave.endDate).isBefore(now, "day");

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

const getHolidaySummaryByDateRange = async (query: Record<string, unknown>) => {
  const { holidayYear, startDate, endDate, companyId, userId } = query;

  if (!holidayYear) {
    throw new AppError(httpStatus.BAD_REQUEST, "holidayYear is required");
  }
  if (!startDate || !endDate) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "startDate and endDate are required",
    );
  }

  const start = new Date(startDate as string);
  const end = new Date(endDate as string);

  // ── Build the leave filter ──────────────────────────────────────────────
  const leaveFilter: Record<string, unknown> = {
    holidayYear,
    startDate: { $lte: end },
    endDate: { $gte: start }, // overlaps the requested window
  };

  if (companyId)
    leaveFilter.companyId = new Types.ObjectId(companyId as string);
  if (userId) leaveFilter.userId = new Types.ObjectId(userId as string);

  // ── Fetch leaves that fall (even partially) within the window ───────────
  const leaves = await Leave.find(leaveFilter).populate(
    "userId",
    "firstName lastName name email",
  );

  // ── Pull matching Holiday records ───────────────────────────────────────
  const holidayFilter: Record<string, unknown> = { year: holidayYear };
  if (userId) holidayFilter.userId = new Types.ObjectId(userId as string);
  if (companyId) {
    const employees = await User.find({
      company: new Types.ObjectId(companyId as string),
      role: "employee",
      status: "active",
    }).select("_id");
    holidayFilter.userId = { $in: employees.map((e) => e._id) };
  }

  let holidayRecords = await Holiday.find(holidayFilter).populate(
    "userId",
    "firstName lastName name email",
  );

  // ── FALLBACK: Trigger Creation if No Data Found ─────────────────────────
  if (holidayRecords.length === 0 && (companyId || userId)) {
    console.log(
      `No holiday records found for year ${holidayYear}. Triggering generation...`,
    );

    // Call the generation service with the requested params
    await HolidayServices.getAllHolidayFromDB({
      companyId: companyId as string,
      year: holidayYear as string,
      limit: "all",
    });

    // Re-fetch the newly generated records from the database
    holidayRecords = await Holiday.find(holidayFilter).populate(
      "userId",
      "firstName lastName name email",
    );
  }

  // ── Attach per-employee leave breakdown & OVERRIDE Data ─────────────────
  const result = holidayRecords.map((record) => {
    // Safety check in case the generated record's userId isn't populated
    const recordUserId = record.userId?._id
      ? record.userId._id.toString()
      : record.userId.toString();

    const empLeaves = leaves.filter((l:any) => {
      const leaveUserId = l.userId?._id
        ? l.userId._id.toString()
        : l.userId.toString();
      return leaveUserId === recordUserId;
    });

    // 1. Calculate Date-Range Specific Hours
    const empBucketed = bucketLeaveHours(empLeaves);

    // 2. Recalculate Dynamic Remaining Hours
    // Formula: Allowance (CarryForward + Accrued) - (Date Range Used + Date Range Booked)
    const allowance = (record.carryForward || 0) + (record.holidayAccured || 0);
    const dynamicRemaining =
      allowance - (empBucketed.usedHours + empBucketed.bookedHours);

    // 3. Override the original DB record with the date-range calculated values
    const dynamicHolidayRecord = {
      ...record.toObject(),
      usedHours: empBucketed.usedHours,
      bookedHours: empBucketed.bookedHours,
      requestedHours: empBucketed.requestedHours,
      unpaidLeaveTaken: empBucketed.unpaidLeaveTaken,
      unpaidBookedHours: empBucketed.unpaidBookedHours,
      unpaidLeaveRequest: empBucketed.unpaidLeaveRequest,
      remainingHours: Number(dynamicRemaining.toFixed(2)),
    };

    return {
      holidayRecord: dynamicHolidayRecord,
      dateRangeSummary: {
        period: { startDate: start, endDate: end },
        year: holidayYear,
        ...empBucketed,
        totalLeaveCount: empLeaves.length,
        leaveBreakdown: {
          approved: empLeaves.filter((l) => l.status === "approved").length,
          pending: empLeaves.filter((l) => l.status === "pending").length,
          rejected: empLeaves.filter((l) => l.status === "rejected").length,
        },
      },
    };
  });

  // ── Company-wide aggregate (only when querying by company) ──────────────
  const bucketed = bucketLeaveHours(leaves);
  const aggregate = companyId
    ? {
        totalEmployees: result.length,
        ...bucketed,
        totalLeaveCount: leaves.length,
        leaveBreakdown: {
          approved: leaves.filter((l) => l.status === "approved").length,
          pending: leaves.filter((l) => l.status === "pending").length,
          rejected: leaves.filter((l) => l.status === "rejected").length,
        },
      }
    : null;

  return { aggregate, result };
};

const deleteLeaveFromDB = async (id: string) => {
  const leave = await Leave.findById(id);
  if(!leave){
     throw new AppError(httpStatus.BAD_REQUEST, "No Leave found");
  }

  const result = await Leave.findByIdAndDelete(id)
  return result;
};

export const LeaveServices = {
  getAllLeaveFromDB,
  getSingleLeaveFromDB,
  updateLeaveIntoDB,
  createLeaveIntoDB,
  getHolidaySummaryByDateRange,
  deleteLeaveFromDB
};
