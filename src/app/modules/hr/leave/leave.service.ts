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
import { PlannedRota } from "../../plannedRota/plannedRota.model";

const getAllLeaveFromDB = async (query: Record<string, unknown>) => {
  const { fromDate, toDate, companyId, ...restQuery } = query;

  const andConditions: any[] = [];

  if (companyId) {
    andConditions.push({
      companyId: new Types.ObjectId(companyId as string),
    });
  }

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

  const finalQuery = {
    ...restQuery,
    ...(andConditions.length > 0 && { $and: andConditions }),
  };

  const userQuery = new QueryBuilder(
    Leave.find().populate("userId", "name title firstName initial lastName"),
    finalQuery,
  )
    .search(LeaveSearchableFields)
    .filter(finalQuery)
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

const createLeaveIntoDB = async (payload: TLeave) => {
  try {
    const userHoliday = await Holiday.findOne({
      userId: payload.userId,
      year: payload.holidayYear,
    });

    const start = moment(payload.startDate);
    const end = moment(payload.endDate);

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

    // Keep leaveDays strictly inside the requested date range
    const rangeStart = start.format("YYYY-MM-DD");
    const rangeEnd = end.format("YYYY-MM-DD");
    payload.leaveDays = payload.leaveDays.filter((day: any) => {
      const dayStr = moment(day.leaveDate).format("YYYY-MM-DD");
      return dayStr >= rangeStart && dayStr <= rangeEnd;
    });

    const isPaidType = payload.holidayType === "holiday";
    if (isPaidType && payload.leaveDays.length > 0) {
      const daySum = payload.leaveDays.reduce(
        (acc: number, day: any) => acc + (Number(day.duration) || 0),
        0,
      );
      if (daySum > 0) payload.totalHours = daySum;
    }

    const finalTotalHours = payload.totalHours || 0;
    const isPaid = payload.holidayType === "holiday";

    const paidHours = isPaid ? finalTotalHours : 0;
    const unpaidHours = !isPaid ? finalTotalHours : 0;

    payload.totalHours = finalTotalHours;

    const result = await Leave.create(payload);

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
const deduplicateRotasForDept = async (rotas: any[]): Promise<any | null> => {
  if (rotas.length === 0) return null;
  if (rotas.length === 1) return rotas[0];

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
// (unchanged — this is your existing generation logic, reused
// for both first-time approval AND regeneration after a date change)
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

  const allExistingRotas = await Rota.find({
    employeeId,
    companyId,
    startDate: dateStr,
  });

  const allExistingPlannedRotas = await PlannedRota.find({
    employeeId,
    companyId,
    startDate: dateStr,
  });

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

  const plannedRotasByDept = new Map<string, any[]>();
  for (const plannedRota of allExistingPlannedRotas) {
    const deptStr = toIdString(plannedRota.departmentId);
    if (!plannedRotasByDept.has(deptStr)) plannedRotasByDept.set(deptStr, []);
    plannedRotasByDept.get(deptStr)!.push(plannedRota);
  }

  const survivingPlannedRotaByDept = new Map<string, any>();
  for (const [deptStr, plannedRotas] of plannedRotasByDept.entries()) {
    const sorted = plannedRotas.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const [survivor, ...duplicates] = sorted;
    if (duplicates.length > 0) {
      await PlannedRota.deleteMany({
        _id: { $in: duplicates.map((r) => r._id) },
      });
    }
    if (survivor) survivingPlannedRotaByDept.set(deptStr, survivor);
  }

  const upsertPlannedRota = async (
    departmentId: any,
    deptIdStr: string,
    shiftType: string,
  ) => {
    const existingPlanned = survivingPlannedRotaByDept.get(deptIdStr);

    if (existingPlanned) {
      await PlannedRota.findByIdAndUpdate(existingPlanned._id, {
        $set: {
          leaveType: shiftType,
          shiftName: shiftType,
          startTime: newStartTime,
          endTime: newEndTime,
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
      await PlannedRota.create(
        buildRotaDoc(
          {
            companyId,
            employeeId,
            departmentId: departmentId._id ?? departmentId,
            dateStr,
            shiftType,
            startTime: newStartTime,
            endTime: newEndTime,
            actionUserId,
          },
          `System generated rota from approved leave request`,
        ),
      );
    }
  };

  const isSingleDept = allDeptIdStrings.length === 1;

  if (isSingleDept) {
    const targetDeptRaw = allDeptRawIds[0];
    const targetDeptIdStr = allDeptIdStrings[0];
    const existingRota = survivingRotaByDept.get(targetDeptIdStr);

    if (existingRota) {
      await Rota.findByIdAndUpdate(existingRota._id, {
        $set: {
          leaveType: primaryShiftType,
          shiftName: primaryShiftType,
          startTime: newStartTime,
          endTime: newEndTime,
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

    await upsertPlannedRota(targetDeptRaw, targetDeptIdStr, primaryShiftType);

    return;
  }

  for (let i = 0; i < allDeptRawIds.length; i++) {
    const rawId = allDeptRawIds[i];
    const deptIdStr = toIdString(rawId);
    const shiftType = i === 0 ? primaryShiftType : "NT";
    const existingRota = survivingRotaByDept.get(deptIdStr);

    if (existingRota) {
      await Rota.findByIdAndUpdate(existingRota._id, {
        $set: {
          leaveType: shiftType,
          shiftName: shiftType,
          startTime: newStartTime,
          endTime: newEndTime,
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
      await Rota.create(
        buildRotaDoc(
          {
            companyId,
            employeeId,
            departmentId: rawId._id ?? rawId,
            dateStr,
            startTime: newStartTime,
            endTime: newEndTime,
            shiftType,
            actionUserId,
          },
          `System generated rota from approved leave request`,
        ),
      );
    }

    await upsertPlannedRota(rawId, deptIdStr, shiftType);
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
  } else if (updatedLeave.holidayType === "absence" || updatedLeave.holidayType === "family") {
  primaryShiftType = "DO";
} else if (updatedLeave.holidayType === "sick") {
    primaryShiftType = "S";
  }

  if (!primaryShiftType) return;

  const employee: any = await User.findById(updatedLeave.userId);

  if (
    !Array.isArray(employee?.departmentId) ||
    employee.departmentId.length === 0 ||
    !updatedLeave.leaveDays?.length
  ) {
    return;
  }

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
// NEW HELPER: Delete Rota + PlannedRota entries that were
// generated for a leave's OLD date range (used when an approved
// leave's dates change, or when it gets rejected after approval)
//
// CAVEAT: Rota/PlannedRota docs don't carry a reference back to the
// Leave that generated them, so this matches purely on
// employeeId + companyId + startDate (one of the leave's old
// leaveDays). If someone manually adds an unrelated Rota entry for
// this employee on the same date, it will also be deleted. If that
// risk matters, consider adding a `sourceLeaveId` field to the Rota
// / PlannedRota schemas so deletion can target exactly the entries
// this leave created.
// ============================================================
const deleteRotaForLeaveDays = async (oldLeave: any): Promise<void> => {
  const dateStrs = (oldLeave.leaveDays || []).map((d: any) =>
    moment(d.leaveDate).format("YYYY-MM-DD"),
  );

  if (dateStrs.length === 0) return;

  const filter = {
    companyId: oldLeave.companyId,
    employeeId: oldLeave.userId,
    startDate: { $in: dateStrs },
  };

  await Rota.deleteMany(filter);
  await PlannedRota.deleteMany(filter);
};

// ============================================================
// NEW HELPER: Reverse the holiday hours that were applied when
// this leave was originally approved (used for the OLD dates
// before a date-change, or on approved → rejected)
// ============================================================
const reverseHolidayHoursForLeave = async (oldLeave: any): Promise<void> => {
  const userHoliday = await Holiday.findOne({
    userId: oldLeave.userId,
    year: oldLeave.holidayYear,
  });

  if (!userHoliday) return;

  const finalTotalHours = oldLeave.totalHours || 0;
  const isPaid = oldLeave.holidayType === "holiday";

  const paidHours = isPaid ? finalTotalHours : 0;
  const unpaidHours = !isPaid ? finalTotalHours : 0;

  userHoliday.bookedHours -= paidHours;
  userHoliday.unpaidBookedHours -= unpaidHours;

  userHoliday.remainingHours =
    userHoliday.holidayAccured -
    (userHoliday.usedHours + userHoliday.bookedHours);

  await userHoliday.save();
};

// ============================================================
// NEW HELPER: Apply holiday hours for the NEW dates of an
// already-approved leave whose dates just changed
// ============================================================
const applyHolidayHoursForLeave = async (newLeave: any): Promise<void> => {
  const userHoliday = await Holiday.findOne({
    userId: newLeave.userId,
    year: newLeave.holidayYear,
  });

  if (!userHoliday) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Holiday record not found for the year",
    );
  }

  const finalTotalHours = newLeave.totalHours || 0;
  const isPaid = newLeave.holidayType === "holiday";

  const paidHours = isPaid ? finalTotalHours : 0;
  const unpaidHours = !isPaid ? finalTotalHours : 0;

  userHoliday.bookedHours += paidHours;
  userHoliday.unpaidBookedHours += unpaidHours;

  userHoliday.remainingHours =
    userHoliday.holidayAccured -
    (userHoliday.usedHours + userHoliday.bookedHours);

  await userHoliday.save();
};

// ============================================================
// NEW HELPER: Remove the SickNote generated for a leave's old
// date range (only relevant when holidayType === "sick")
// ============================================================
const removeSickNoteForLeave = async (oldLeave: any): Promise<void> => {
  if (oldLeave.holidayType !== "sick") return;

  await SickNote.deleteMany({
    employeeId: oldLeave.userId,
    companyId: oldLeave.companyId,
    startDate: oldLeave.startDate,
    endDate: oldLeave.endDate,
  });
};

// ============================================================
// MAIN SERVICE: Update leave and trigger rota/holiday logic
// ============================================================
// export const updateLeaveIntoDB = async (
//   id: string,
//   payload: Partial<TLeave>,
//   actionUserId: string,
// ) => {
//   const leave = await Leave.findById(id);

//   if (!leave) {
//     throw new AppError(httpStatus.NOT_FOUND, "Leave not found");
//   }

//   const actionUser = await User.findById(actionUserId);

//   if (!actionUser) {
//     throw new AppError(httpStatus.NOT_FOUND, "Action user not found");
//   }

//   const userName =
//     actionUser.name || `${actionUser.firstName} ${actionUser.lastName}`.trim();

//   const wasApproved = leave.status === "approved";

//   const datesChanged =
//     !!(
//       payload.startDate &&
//       moment(payload.startDate).format("YYYY-MM-DD") !==
//         moment(leave.startDate).format("YYYY-MM-DD")
//     ) ||
//     !!(
//       payload.endDate &&
//       moment(payload.endDate).format("YYYY-MM-DD") !==
//         moment(leave.endDate).format("YYYY-MM-DD")
//     );

//   // If the dates changed and the caller didn't already send a new
//   // leaveDays breakdown, regenerate it the same way createLeaveIntoDB does
//   if (datesChanged && !payload.leaveDays) {
//     const start = moment(payload.startDate || leave.startDate);
//     const end = moment(payload.endDate || leave.endDate);
//     const holidayType = payload.holidayType || leave.holidayType;

//     const newLeaveDays: any[] = [];
//     let current = start.clone();
//     while (current.isSameOrBefore(end, "day")) {
//       newLeaveDays.push({
//         leaveDate: current.toDate(),
//         leaveType: holidayType === "holiday" ? "paid" : "unpaid",
//       });
//       current.add(1, "day");
//     }
//     payload.leaveDays = newLeaveDays;
//   }

//   // Build a meaningful history message based on what changed
//   let actionMessage = `${userName} updated the leave request`;

//   if (payload.status && payload.status !== leave.status) {
//     if (payload.status === "approved") {
//       actionMessage = `${userName} approved the leave request`;
//     } else if (payload.status === "rejected") {
//       actionMessage = `${userName} rejected the leave request`;
//     }
//   } else if (wasApproved && datesChanged) {
//     actionMessage = `${userName} changed the dates of an approved leave request`;
//   }

//   const updateQuery = {
//     $set: payload,
//     $push: {
//       history: {
//         message: `${actionMessage} at`,
//         userId: actionUserId,
//         createdAt: new Date(),
//       },
//     },
//   };

//   const updatedLeave = await Leave.findByIdAndUpdate(id, updateQuery, {
//     new: true,
//     runValidators: true,
//   });

//   if (!updatedLeave) {
//     throw new AppError(httpStatus.NOT_FOUND, "Leave not found after update");
//   }

//   // ══════════════════════════════════════════════════════════════════
//   // CASE 1: pending → approved  (first-time approval)
//   // ══════════════════════════════════════════════════════════════════
//   if (leave.status === "pending" && updatedLeave.status === "approved") {
//     const userHoliday = await Holiday.findOne({
//       userId: updatedLeave.userId,
//       year: updatedLeave.holidayYear,
//     });

//     if (!userHoliday) {
//       throw new AppError(
//         httpStatus.NOT_FOUND,
//         "Holiday record not found for the year",
//       );
//     }

//     const finalTotalHours = updatedLeave.totalHours || 0;
//     const isPaid = updatedLeave.holidayType === "holiday";

//     const paidHours = isPaid ? finalTotalHours : 0;
//     const unpaidHours = !isPaid ? finalTotalHours : 0;

//     userHoliday.requestedHours -= paidHours;
//     userHoliday.bookedHours += paidHours;

//     userHoliday.unpaidLeaveRequest -= unpaidHours;
//     userHoliday.unpaidBookedHours += unpaidHours;

//     userHoliday.remainingHours =
//       userHoliday.holidayAccured -
//       (userHoliday.usedHours + userHoliday.bookedHours);

//     await userHoliday.save();

//     await generateRotaAndAttendanceForLeave(updatedLeave, actionUserId);

//     if (updatedLeave.holidayType === "sick") {
//       await SickNote.create({
//         note: updatedLeave.reason || "",
//         startDate: updatedLeave.startDate,
//         endDate: updatedLeave.endDate,
//         employeeId: updatedLeave.userId,
//         companyId: updatedLeave.companyId,
//         documents: updatedLeave.documents || [],
//       });
//     }
//   }

//   // ══════════════════════════════════════════════════════════════════
//   // CASE 2: approved → approved, but the dates changed
//   //   e.g. 1–5 Aug was approved, now moved to 10–13 Aug:
//   //   undo the 1–5 Aug rota + holiday hours, then create 10–13 Aug
//   // ══════════════════════════════════════════════════════════════════
//   else if (
//     wasApproved &&
//     updatedLeave.status === "approved" &&
//     datesChanged
//   ) {
//     // Undo everything tied to the OLD dates
//     await deleteRotaForLeaveDays(leave);
//     await reverseHolidayHoursForLeave(leave);
//     await removeSickNoteForLeave(leave);

//     // Re-apply everything for the NEW dates
//     await applyHolidayHoursForLeave(updatedLeave);
//     await generateRotaAndAttendanceForLeave(updatedLeave, actionUserId);

//     if (updatedLeave.holidayType === "sick") {
//       await SickNote.create({
//         note: updatedLeave.reason || "",
//         startDate: updatedLeave.startDate,
//         endDate: updatedLeave.endDate,
//         employeeId: updatedLeave.userId,
//         companyId: updatedLeave.companyId,
//         documents: updatedLeave.documents || [],
//       });
//     }
//   }

//   // ══════════════════════════════════════════════════════════════════
//   // CASE 3: approved → rejected
//   //   Undo the rota + holiday hours that were applied at approval time
//   // ══════════════════════════════════════════════════════════════════
//   else if (wasApproved && updatedLeave.status === "rejected") {
//     await deleteRotaForLeaveDays(leave);
//     await reverseHolidayHoursForLeave(leave);
//     await removeSickNoteForLeave(leave);
//   }

//   return updatedLeave;
// };


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
    actionUser.name || `${actionUser.firstName} ${actionUser.lastName}`.trim();

  const wasApproved = leave.status === "approved";

  const datesChanged =
    !!(
      payload.startDate &&
      moment(payload.startDate).format("YYYY-MM-DD") !==
        moment(leave.startDate).format("YYYY-MM-DD")
    ) ||
    !!(
      payload.endDate &&
      moment(payload.endDate).format("YYYY-MM-DD") !==
        moment(leave.endDate).format("YYYY-MM-DD")
    );

  if (datesChanged && !payload.leaveDays) {
    const start = moment(payload.startDate || leave.startDate);
    const end = moment(payload.endDate || leave.endDate);
    const holidayType = payload.holidayType || leave.holidayType;

    const newLeaveDays: any[] = [];
    let current = start.clone();
    while (current.isSameOrBefore(end, "day")) {
      newLeaveDays.push({
        leaveDate: current.toDate(),
        leaveType: holidayType === "holiday" ? "paid" : "unpaid",
      });
      current.add(1, "day");
    }
    payload.leaveDays = newLeaveDays;
  }

  // Reconcile leaveDays with the effective date range: any day outside
  // startDate/endDate must be dropped (otherwise a stale day persists in
  // the DB and keeps counting toward totals)
  if (payload.leaveDays && Array.isArray(payload.leaveDays) && payload.leaveDays.length > 0) {
    const effectiveStart = payload.startDate || leave.startDate;
    const effectiveEnd = payload.endDate || leave.endDate;
    const rangeStart = moment(effectiveStart).format("YYYY-MM-DD");
    const rangeEnd = moment(effectiveEnd).format("YYYY-MM-DD");

    payload.leaveDays = payload.leaveDays.filter((day: any) => {
      const dayStr = moment(day.leaveDate).format("YYYY-MM-DD");
      return dayStr >= rangeStart && dayStr <= rangeEnd;
    });

    const isHoliday = (payload.holidayType || leave.holidayType) === "holiday";
    if (isHoliday && payload.leaveDays.length > 0) {
      const daySum = payload.leaveDays.reduce(
        (acc: number, day: any) => acc + (Number(day.duration) || 0),
        0,
      );
      if (daySum > 0) payload.totalHours = daySum;
    }
  }

  let actionMessage = `${userName} updated the leave request`;

  if (payload.status && payload.status !== leave.status) {
    if (payload.status === "approved") {
      actionMessage = `${userName} approved the leave request`;
    } else if (payload.status === "rejected") {
      actionMessage = `${userName} rejected the leave request`;
    }
  } else if (wasApproved && datesChanged) {
    actionMessage = `${userName} changed the dates of an approved leave request`;
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

  // 1. Update the leave in the DB first
  const updatedLeave = await Leave.findByIdAndUpdate(id, updateQuery, {
    new: true,
    runValidators: true,
  });

  if (!updatedLeave) {
    throw new AppError(httpStatus.NOT_FOUND, "Leave not found after update");
  }

  // ══════════════════════════════════════════════════════════════════
  // CASE 1: pending → approved  (first-time approval)
  // ══════════════════════════════════════════════════════════════════
  if (leave.status === "pending" && updatedLeave.status === "approved") {
    await generateRotaAndAttendanceForLeave(updatedLeave, actionUserId);

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

  // ══════════════════════════════════════════════════════════════════
  // CASE 2: approved → approved, but the dates changed
  // ══════════════════════════════════════════════════════════════════
  else if (wasApproved && updatedLeave.status === "approved" && datesChanged) {
    // Undo rotas tied to the OLD dates
    await deleteRotaForLeaveDays(leave);
    await removeSickNoteForLeave(leave);

    // Re-apply rotas for the NEW dates
    await generateRotaAndAttendanceForLeave(updatedLeave, actionUserId);

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

  // ══════════════════════════════════════════════════════════════════
  // CASE 3: approved → rejected
  // ══════════════════════════════════════════════════════════════════
  else if (wasApproved && updatedLeave.status === "rejected") {
    // Undo rotas tied to the OLD dates
    await deleteRotaForLeaveDays(leave);
    await removeSickNoteForLeave(leave);
  }

  // ✅ FINALLY: Fix the holiday issue by letting the HolidayService recalculate 
  // exactly what is in the DB now, handling all hours, allowances, and formulas accurately.
  await HolidayServices.recalculateUserHoliday(updatedLeave.userId, updatedLeave.holidayYear);

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

  const leaveFilter: Record<string, unknown> = {
    holidayYear,
    startDate: { $lte: end },
    endDate: { $gte: start },
  };

  if (companyId)
    leaveFilter.companyId = new Types.ObjectId(companyId as string);
  if (userId) leaveFilter.userId = new Types.ObjectId(userId as string);

  const leaves = await Leave.find(leaveFilter).populate(
    "userId",
    "firstName lastName name email",
  );

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

  if (holidayRecords.length === 0 && (companyId || userId)) {
    console.log(
      `No holiday records found for year ${holidayYear}. Triggering generation...`,
    );

    await HolidayServices.getAllHolidayFromDB({
      companyId: companyId as string,
      year: holidayYear as string,
      limit: "all",
    });

    holidayRecords = await Holiday.find(holidayFilter).populate(
      "userId",
      "firstName lastName name email",
    );
  }

  const result = holidayRecords.map((record) => {
    const recordUserId = record.userId?._id
      ? record.userId._id.toString()
      : record.userId.toString();

    const empLeaves = leaves.filter((l: any) => {
      const leaveUserId = l.userId?._id
        ? l.userId._id.toString()
        : l.userId.toString();
      return leaveUserId === recordUserId;
    });

    const empBucketed = bucketLeaveHours(empLeaves);

    const allowance = (record.carryForward || 0) + (record.holidayAccured || 0);
    const dynamicRemaining =
      allowance - (empBucketed.usedHours + empBucketed.bookedHours);

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
  if (!leave) {
    throw new AppError(httpStatus.BAD_REQUEST, "No Leave found");
  }

  const result = await Leave.findByIdAndDelete(id);
  return result;
};

export const LeaveServices = {
  getAllLeaveFromDB,
  getSingleLeaveFromDB,
  updateLeaveIntoDB,
  createLeaveIntoDB,
  getHolidaySummaryByDateRange,
  deleteLeaveFromDB,
};