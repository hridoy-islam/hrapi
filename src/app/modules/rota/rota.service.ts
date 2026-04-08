import httpStatus from "http-status";

import AppError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { Rota } from "./rota.model";
import { TRota } from "./rota.interface";
import { RotaSearchableFields } from "./rota.constant";
import { EmployeeRate } from "../hr/employeeRate/employeeRate.model";
import { User } from "../user/user.model";
import moment from "moment-timezone";
import { Notice } from "../hr/notice/notice.model";
import { sendEmailRota } from "../../utils/sendEmailRota";

moment.tz.setDefault("Europe/London");

const getAllRotaFromDB = async (query: Record<string, unknown>) => {
  const { startDate, endDate, attendanceDate, ...restQuery } = query;

  const dateFilter: Record<string, any> = {};

  // ✅ PRIORITY: attendanceDate exact match
  if (attendanceDate) {
    dateFilter.startDate = attendanceDate;
  }
  // ✅ Otherwise fallback to range filter
  else if (startDate || endDate) {
    dateFilter.startDate = {};
    if (startDate) dateFilter.startDate.$gte = startDate;
    if (endDate) dateFilter.startDate.$lte = endDate;
  }

  const userQuery = new QueryBuilder(
    Rota.find(dateFilter).populate("departmentId"),
    restQuery,
  )
    .search(RotaSearchableFields)
    .filter(restQuery)
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

const getSingleRotaFromDB = async (id: string) => {
  const result = await Rota.findById(id);
  return result;
};

const createRotaIntoDB = async (payload: TRota) => {
  try {
    const result = await Rota.create(payload);
    return result;
  } catch (error: any) {
    console.error("Error in createRotaIntoDB:", error);

    // Throw the original error or wrap it with additional context
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to create Rota",
    );
  }
};

// const updateRotaIntoDB = async (id: string, payload: Partial<TRota>) => {
//   const rota = await Rota.findById(id);

//   if (!rota) {
//     throw new AppError(httpStatus.NOT_FOUND, "Rota not found");
//   }

//   // Update only the selected user
//   const result = await Rota.findByIdAndUpdate(id, payload, {
//     new: true,
//     runValidators: true,
//   });

//   return result;
// };

// Key: `${companyId}-${employeeId}-${departmentId}`
const pendingRotaUpdates: Map<
  string,
  {
    rotas: TRota[];
    timer: ReturnType<typeof setTimeout>;
    byNotice: boolean;
    byEmail: boolean;
    employeeId: string;
    companyId: string;
    departmentId: string;
    actionUserId: string;
  }
> = new Map();

/**
 * Processes batched rota updates and creates a notice/email.
 */
const SHIFT_FIELDS = [
  "startTime",
  "endTime",
  "startDate",
  "endDate",
  "leaveType",
] as const;

// Check if payload has any real shift field change (ignores byEmail/byNotice-only updates)
const hasShiftChanges = (payload: Partial<TRota>, rota: TRota): boolean => {
  return (
    (payload.startTime !== undefined && payload.startTime !== rota.startTime) ||
    (payload.endTime !== undefined && payload.endTime !== rota.endTime) ||
    (payload.startDate !== undefined && payload.startDate !== rota.startDate) ||
    (payload.endDate !== undefined && payload.endDate !== rota.endDate) ||
    (payload.leaveType !== undefined && payload.leaveType !== rota.leaveType)
  );
};

// ─────────────────────────────────────────────
const processBatchedRotaUpdates = async (batchKey: string) => {
  const batch = pendingRotaUpdates.get(batchKey);
  if (!batch) return;

  pendingRotaUpdates.delete(batchKey);

  const {
    rotas,
    byNotice,
    byEmail,
    employeeId,
    companyId,
    departmentId,
    actionUserId,
  } = batch;

  // Fetch employee
  const employee = await User.findById(employeeId);
  if (!employee) return;

  const employeeName =
    employee.name || `${employee.firstName} ${employee.lastName}`.trim();

  // Fetch company (from User model using companyId)
  const company = await User.findById(companyId);
  if (!company) return;

  const companyName =
    company.name || `${company.firstName} ${company.lastName}`.trim();
  const companyImage = company.image || "";
  const companyAddress = company.address || "";
  const cityOrTown = company.cityOrTown || "";
  const stateOrProvince = company.stateOrProvince || "";
  const country = company.country || "";
  const postCode = company.postCode || "";

  // ── Build notice description ──
  const byDate: Record<string, TRota[]> = {};
  for (const rota of rotas) {
    const dateKey = rota.startDate;
    if (!byDate[dateKey]) byDate[dateKey] = [];
    byDate[dateKey].push(rota);
  }

  const shiftLines = Object.entries(byDate).map(([date, dateRotas]) => {
    const formattedDate = moment(date).format("ddd, MMM DD, YYYY");

    const shiftSummaries = [
      ...new Set(
        dateRotas.map((r) =>
          r.leaveType && r.leaveType.trim() !== ""
            ? r.leaveType
            : `${r.startTime} - ${r.endTime}`
        ),
      ),
    ];

    // Join with " and " so it says "09:00 - 12:00 and 14:00 - 17:00"
    const times = shiftSummaries.join(" and ");

    // Build the exact sentence you requested
    return `Your shift(s) on ${formattedDate} has been updated to ${times}.`;
  });

  // ── Descriptions ──
  // .join(" ") puts a space between sentences if there are multiple dates updated.
  const noticeDescription = `${shiftLines.join(" ")} Please check your rota.`;

  // .join("<br>") puts each date's sentence on a new line in the email.
  const emailDescription = `${shiftLines.join("<br>")}`;
  
  const today = moment().format("ddd, MMM DD, YYYY");
  const subject = `${companyName} – Shift Change Notification`;

  // ── Create Notice ──
  if (byNotice) {
    await Notice.create({
      noticeType: "general",
      noticeDescription,
      noticeSetting: "individual",
      users: [employeeId],
      department: [departmentId],
      noticeBy: actionUserId,
      companyId,
      status: "active",
      noticeDate: new Date(),
    });
  }

  // ── Send Email ──
  if (byEmail && employee.email) {
    await sendEmailRota({
      to: employee.email,
      subject,
      companyName,
      companyImage,
      username: employeeName,
      description: emailDescription,
      date: today,
      address: companyAddress,
      cityOrTown,
      stateOrProvince,
      country,
      postCode,
    });
  }
};

// ─────────────────────────────────────────────
export const updateRotaIntoDB = async (
  id: string,
  payload: Partial<TRota>,
  actionUserId: string,
) => {
  // 1. Fetch existing rota
  const rota = await Rota.findById(id);
  if (!rota) throw new AppError(httpStatus.NOT_FOUND, "Rota not found");

  // 2. Fetch action user
  const actionUser = await User.findById(actionUserId);
  if (!actionUser)
    throw new AppError(httpStatus.NOT_FOUND, "Action user not found");

  const userName =
    actionUser.name || `${actionUser.firstName} ${actionUser.lastName}`.trim();

  // 3. Build history entries
  const newHistoryEntries = [];

  if (payload.status === "publish" && rota.status !== "publish") {
    newHistoryEntries.push({
      message: `${userName} Published the rota at`,
      userId: actionUserId,
    });
  }

  const isShiftUpdated =
    (payload.startTime !== undefined && payload.startTime !== rota.startTime) ||
    (payload.endTime !== undefined && payload.endTime !== rota.endTime) ||
    (payload.startDate !== undefined && payload.startDate !== rota.startDate) ||
    (payload.endDate !== undefined && payload.endDate !== rota.endDate) ||
    (payload.shiftName !== undefined && payload.shiftName !== rota.shiftName) ||
    (payload.leaveType !== undefined && payload.leaveType !== rota.leaveType) ||
    (payload.color !== undefined && payload.color !== rota.color) ||
    (payload.employeeId !== undefined &&
      payload.employeeId.toString() !== rota.employeeId.toString());

  if (isShiftUpdated) {
    newHistoryEntries.push({
      message: `${userName} updated the rota details at`,
      userId: actionUserId,
    });
  }

  // 4. Execute DB update
  const updateQuery: any = { $set: payload };
  if (newHistoryEntries.length > 0) {
    updateQuery.$push = { history: { $each: newHistoryEntries } };
  }

  const result = await Rota.findByIdAndUpdate(id, updateQuery, {
    new: true,
    runValidators: true,
  });

  // 5. Batching logic — only trigger if actual shift fields changed
  //    Ignore if payload only updated byEmail / byNotice flags
  const shiftChanged = hasShiftChanges(payload, rota);

  const byNotice = result?.byNotice ?? false;
  const byEmail = result?.byEmail ?? false;

  if (shiftChanged && (byNotice || byEmail) && result) {
    const companyId = rota.companyId.toString();
    const employeeId = rota.employeeId.toString();
    const departmentId = rota.departmentId.toString();
    const batchKey = `${companyId}-${employeeId}-${departmentId}`;

    const existing = pendingRotaUpdates.get(batchKey);

    if (existing) {
      existing.rotas.push(result);
      existing.byNotice = existing.byNotice || byNotice;
      existing.byEmail = existing.byEmail || byEmail;

      clearTimeout(existing.timer);
      existing.timer = setTimeout(
        () => processBatchedRotaUpdates(batchKey),
        1000,
      );
    } else {
      const timer = setTimeout(() => processBatchedRotaUpdates(batchKey), 1000);

      pendingRotaUpdates.set(batchKey, {
        rotas: [result],
        timer,
        byNotice,
        byEmail,
        employeeId,
        companyId,
        departmentId,
        actionUserId,
      });
    }
  }

  return result;
};

const getUpcomingRotaFromDB = async (query: Record<string, unknown>) => {
  const { ...restQuery } = query;

  const today = moment().format("YYYY-MM-DD");
  const currentTime = moment().format("HH:mm");
  const employeeId = query.employeeId as string;

  // =========================================================================
  // Fetch Upcoming Rotas using QueryBuilder
  // =========================================================================
  const dateFilter = {
    startDate: { $gte: today },
    status: "publish",
  };

  const rotaQuery = new QueryBuilder(
    Rota.find(dateFilter).populate("departmentId").sort({ startDate: 1 }),
    restQuery,
  )
    .search(RotaSearchableFields) // Ensure this is imported
    .filter(restQuery)
    .sort()
    .paginate()
    .fields();

  const meta = await rotaQuery.countTotal();
  const result = await rotaQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const deleteRotaFromDB = async (id: string) => {
  const rota = await Rota.findById(id);

  if (!rota) {
    throw new AppError(httpStatus.NOT_FOUND, "Rota not found");
  }

  await Rota.findByIdAndDelete(id);

  return { message: "Rota deleted successfully" };
};

// const copyRotaIntoDB = async (payload: {
//   companyId: string,
//   type: 'week' | 'month',
//   sourceStart: string,
//   targetStart: string
// }) => {

//   const { companyId, type, sourceStart, targetStart } = payload;

//   const sourceStartMom = moment(sourceStart);
//   const targetStartMom = moment(targetStart);

//   let sourceEndMom;
//   let targetEndMom;

//   if (type === 'week') {
//     sourceEndMom = moment(sourceStart).endOf('week');
//     targetEndMom = moment(targetStart).endOf('week');
//   } else {
//     sourceEndMom = moment(sourceStart).endOf('month');
//     targetEndMom = moment(targetStart).endOf('month');
//   }

//   const sourceRotas = await Rota.find({
//     companyId,
//     startDate: {
//       $gte: sourceStartMom.format('YYYY-MM-DD'),
//       $lte: sourceEndMom.format('YYYY-MM-DD')
//     }
//   }).lean();

//   if (!sourceRotas.length) {
//     throw new AppError(httpStatus.NOT_FOUND, "No shifts found in the source period to copy.");
//   }

//   const targetRotas = await Rota.find({
//     companyId,
//     startDate: {
//       $gte: targetStartMom.format('YYYY-MM-DD'),
//       $lte: targetEndMom.format('YYYY-MM-DD')
//     }
//   }).lean();

//   // 🔹 Fetch employees for names
//   const employeeIds = [
//     ...new Set(sourceRotas.map(r => r.employeeId.toString()))
//   ];

//   const employees = await User.find({
//     _id: { $in: employeeIds }
//   }).select('firstName lastName').lean();

//   const employeeMap = new Map(
//     (employees as any).map((emp: any) => [
//       emp._id.toString(),
//       { firstName: emp.firstName, lastName: emp.lastName }
//     ])
//   );

//   const existingTargetMap = new Set(
//     targetRotas.map(r => `${r.employeeId.toString()}_${r.startDate}`)
//   );

//   const rotasToCreate = [];
//   const skippedRecords = [];

//   for (const rota of sourceRotas) {

//     let newStartDate, newEndDate;

//     if (type === 'week') {
//       const diffDays = targetStartMom.diff(sourceStartMom, 'days');
//       newStartDate = moment(rota.startDate).add(diffDays, 'days').format('YYYY-MM-DD');
//       newEndDate = moment(rota.endDate).add(diffDays, 'days').format('YYYY-MM-DD');
//     } else {
//       const diffMonths = targetStartMom.diff(sourceStartMom, 'months');
//       newStartDate = moment(rota.startDate).add(diffMonths, 'months').format('YYYY-MM-DD');
//       newEndDate = moment(rota.endDate).add(diffMonths, 'months').format('YYYY-MM-DD');
//     }

//     const conflictKey = `${rota.employeeId.toString()}_${newStartDate}`;

//     if (existingTargetMap.has(conflictKey)) {
//       const empInfo:any = employeeMap.get(rota.employeeId.toString());

//       skippedRecords.push({
//         employeeId: rota.employeeId,
//         firstName: empInfo?.firstName || '',
//         lastName: empInfo?.lastName || '',
//         date: newStartDate,
//         reason: 'Employee already has a shift assigned on the target date'
//       });

//       continue;
//     }

//     const { _id, createdAt, updatedAt, __v, ...restRotaData } = rota as any;

//     rotasToCreate.push({
//       ...restRotaData,
//       startDate: newStartDate,
//       endDate: newEndDate,
//     });
//   }

//   let result: any[] = [];
//   if (rotasToCreate.length > 0) {
//     result = await Rota.insertMany(rotasToCreate);
//   }

//   return {
//     meta: {
//       totalSourceShifts: sourceRotas.length,
//       copiedCount: rotasToCreate.length,
//       skippedCount: skippedRecords.length,
//       hasSkippedRecords: skippedRecords.length > 0,
//       skippedRecords
//     },
//     result
//   };
// };

const copyRotaIntoDB = async (payload: {
  companyId: string;
  type: "week" | "month" | "day";
  sourceStart: string;
  targetStart: string;
}) => {
  const { companyId, type, sourceStart, targetStart } = payload;

  // Determine the correct moment unit based on the type
  const timeUnit: moment.unitOfTime.StartOf =
    type === "week" ? "week" : type === "month" ? "month" : "day";

  const sourceStartMom = moment(sourceStart).startOf(timeUnit);
  const sourceEndMom = moment(sourceStart).endOf(timeUnit);

  const targetStartMom = moment(targetStart).startOf(timeUnit);
  const targetEndMom = moment(targetStart).endOf(timeUnit);

  // ✅ Get source rotas
  const sourceRotas = await Rota.find({
    companyId,
    startDate: {
      $gte: sourceStartMom.format("YYYY-MM-DD"),
      $lte: sourceEndMom.format("YYYY-MM-DD"),
    },
  }).lean();

  if (!sourceRotas.length) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "No shifts found in the source period to copy.",
    );
  }

  const leaveTypes = ["DO", "AL", "S", "ML", "NT"];

  // ✅ Get ALL target rotas (needed for leave + time conflict)
  const targetRotas = await Rota.find({
    companyId,
    startDate: {
      $gte: targetStartMom.format("YYYY-MM-DD"),
      $lte: targetEndMom.format("YYYY-MM-DD"),
    },
  }).lean();

  // 🔥 Leave conflict set
  const leaveConflictSet = new Set(
    targetRotas
      .filter((r) => leaveTypes.includes(r.leaveType))
      .map((r) => `${r.employeeId}_${r.startDate}_${r.departmentId}`),
  );

  // 🔥 Time conflict set
  const timeConflictSet = new Set(
    targetRotas
      .filter((r) => r.startTime && r.endTime)
      .map(
        (r) =>
          `${r.employeeId}_${r.startDate}_${r.departmentId}_${r.startTime}_${r.endTime}`,
      ),
  );

  // Fetch employee names
  const employeeIds = [
    ...new Set(sourceRotas.map((r) => r.employeeId.toString())),
  ];

  const employees = await User.find({
    _id: { $in: employeeIds },
  })
    .select("firstName lastName")
    .lean();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const employeeMap = new Map(
    employees.map((emp: any) => [
      emp._id.toString(),
      { firstName: emp.firstName, lastName: emp.lastName },
    ]),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rotasToCreate: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const skippedRecords: any[] = [];

  for (const rota of sourceRotas) {
    let newStartDate: string;
    let newEndDate: string;

    // Both "week" and "day" can be shifted accurately by mapping the exact difference in days
    if (type === "month") {
      const diffMonths = targetStartMom.diff(sourceStartMom, "months");

      newStartDate = moment(rota.startDate)
        .add(diffMonths, "months")
        .format("YYYY-MM-DD");

      newEndDate = moment(rota.endDate)
        .add(diffMonths, "months")
        .format("YYYY-MM-DD");
    } else {
      const diffDays = targetStartMom.diff(sourceStartMom, "days");

      newStartDate = moment(rota.startDate)
        .add(diffDays, "days")
        .format("YYYY-MM-DD");

      newEndDate = moment(rota.endDate)
        .add(diffDays, "days")
        .format("YYYY-MM-DD");
    }

    const leaveKey = `${rota.employeeId}_${newStartDate}_${rota.departmentId}`;

    const timeKey =
      rota.startTime && rota.endTime
        ? `${rota.employeeId}_${newStartDate}_${rota.departmentId}_${rota.startTime}_${rota.endTime}`
        : null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const empInfo: any = employeeMap.get(rota.employeeId.toString());

    // 🔥 1️⃣ Leave Conflict
    if (leaveConflictSet.has(leaveKey)) {
      skippedRecords.push({
        employeeId: rota.employeeId,
        firstName: empInfo?.firstName || "",
        lastName: empInfo?.lastName || "",
        departmentId: rota.departmentId,
        date: newStartDate,
        reason: "Leave exists in target date for this department",
      });
      continue;
    }

    // 🔥 2️⃣ Time Conflict
    if (timeKey && timeConflictSet.has(timeKey)) {
      skippedRecords.push({
        employeeId: rota.employeeId,
        firstName: empInfo?.firstName || "",
        lastName: empInfo?.lastName || "",
        departmentId: rota.departmentId,
        date: newStartDate,
        startTime: rota.startTime,
        endTime: rota.endTime,
        reason: "Shift with same time already exists in target department",
      });
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    const { _id, status, createdAt, history, updatedAt, __v, ...restRotaData } =
      rota as any;

    rotasToCreate.push({
      ...restRotaData,
      startDate: newStartDate,
      endDate: newEndDate,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any[] = [];

  if (rotasToCreate.length > 0) {
    result = await Rota.insertMany(rotasToCreate);
  }

  return {
    meta: {
      totalSourceShifts: sourceRotas.length,
      copiedCount: rotasToCreate.length,
      skippedCount: skippedRecords.length,
      hasSkippedRecords: skippedRecords.length > 0,
      skippedRecords,
    },
    result,
  };
};

const bulkAssignRotaIntoDB = async (payload: {
  companyId: string;
  departmentId: string;
  employeeIds: any[];
  startDate: string;
  endDate: string;
  shiftName?: string;
  leaveType?: string;
  startTime?: string;
  endTime?: string;
}) => {
  const {
    companyId,
    departmentId,
    employeeIds: rawEmployeeIds,
    startDate,
    endDate,
    shiftName,
    leaveType,
    startTime,
    endTime,
  } = payload;

  const leaveTypes = ["DO", "AL", "S", "ML", "NT"];
  const isStandardShift = !leaveType;

  // ✅ Normalize employeeIds
  const employeeIds = rawEmployeeIds
    .map((e: any) => (typeof e === "string" ? e : e._id?.toString()))
    .filter(Boolean);

  const startMom = moment(startDate);
  const endMom = moment(endDate);
  const totalDays = endMom.diff(startMom, "days");

  let crossesMidnight = false;
  if (isStandardShift && startTime && endTime) {
    crossesMidnight = endTime < startTime;
  }

  // ✅ Fetch employees WITH department filter
  const employees = await User.find({
    _id: { $in: employeeIds },
    departmentId: departmentId, // 🔥 must contain this department
  })
    .select("firstName lastName departmentId")
    .lean();

  const validEmployeeIds = employees.map((emp) => emp._id.toString());

  const employeeMap = new Map(
    employees.map((emp: any) => [
      emp._id.toString(),
      { firstName: emp.firstName, lastName: emp.lastName },
    ]),
  );

  // ✅ Fetch existing rotas for conflict detection
  const existingRotas = await Rota.find({
    companyId,
    employeeId: { $in: validEmployeeIds },
    startDate: { $gte: startDate, $lte: endDate },
    departmentId,
  }).lean();

  const leaveConflictSet = new Set(
    existingRotas
      .filter((r) => leaveTypes.includes(r.leaveType))
      .map((r) => `${r.employeeId}_${r.startDate}`),
  );

  const timeConflictSet = new Set(
    existingRotas
      .filter((r) => r.startTime && r.endTime)
      .map((r) => `${r.employeeId}_${r.startDate}_${r.startTime}_${r.endTime}`),
  );

  const rotasToCreate: any[] = [];
  const skippedRecords: any[] = [];

  for (let i = 0; i <= totalDays; i++) {
    const currentDateStr = startMom.clone().add(i, "days").format("YYYY-MM-DD");

    let shiftEndDateStr = currentDateStr;
    if (isStandardShift && crossesMidnight) {
      shiftEndDateStr = moment(currentDateStr)
        .add(1, "days")
        .format("YYYY-MM-DD");
    }

    for (const empId of validEmployeeIds) {
      const empInfo: any = employeeMap.get(empId);

      const leaveKey = `${empId}_${currentDateStr}`;
      const timeKey =
        isStandardShift && startTime && endTime
          ? `${empId}_${currentDateStr}_${startTime}_${endTime}`
          : null;

      // 🔥 1️⃣ Leave conflict
      if (leaveConflictSet.has(leaveKey)) {
        skippedRecords.push({
          employeeId: empId,
          firstName: empInfo?.firstName || "",
          lastName: empInfo?.lastName || "",
          departmentId,
          date: currentDateStr,
          reason: "Leave exists in this department on this date",
        });
        continue;
      }

      // 🔥 2️⃣ Exact time conflict
      if (timeKey && timeConflictSet.has(timeKey)) {
        skippedRecords.push({
          employeeId: empId,
          firstName: empInfo?.firstName || "",
          lastName: empInfo?.lastName || "",
          departmentId,
          date: currentDateStr,
          startTime,
          endTime,
          reason: "Same shift time already exists in this department",
        });
        continue;
      }

      const shiftObj: any = {
        companyId,
        departmentId,
        employeeId: empId,
        startDate: currentDateStr,
        endDate: shiftEndDateStr,
      };

      if (!isStandardShift) {
        shiftObj.leaveType = leaveType;
        shiftObj.shiftName = leaveType;
        shiftObj.startTime = "";
        shiftObj.endTime = "";
      } else {
        shiftObj.shiftName = shiftName;
        shiftObj.startTime = startTime;
        shiftObj.endTime = endTime;
      }

      rotasToCreate.push(shiftObj);
    }
  }

  let result: any[] = [];
  if (rotasToCreate.length > 0) {
    result = await Rota.insertMany(rotasToCreate);
  }

  return {
    meta: {
      requestedEmployeesCount: employeeIds.length,
      validDepartmentEmployeesCount: validEmployeeIds.length,
      totalDaysInRange: totalDays + 1,
      createdShiftsCount: rotasToCreate.length,
      skippedShiftsCount: skippedRecords.length,
      hasSkippedRecords: skippedRecords.length > 0,
      skippedRecords,
    },
    result,
  };
};

const createRotaAttendanceIntoDB = async (payload: { rotaId: string }) => {
  // 1. Find the current rota
  const currentRota = await Rota.findById(payload.rotaId);

  if (!currentRota) {
    throw new AppError(httpStatus.NOT_FOUND, "Rota not found");
  }

  const currentTime = moment().format("HH:mm");

  // 2. Validate previous unclosed shifts
  // Find all OTHER rotas for this employee on the exact same date
  const otherRotasToday = await Rota.find({
    employeeId: currentRota.employeeId,
    startDate: currentRota.startDate,
    _id: { $ne: currentRota._id }, // Exclude the current rota
  });

  // Check if any prior shift is still open
  if (otherRotasToday.length > 0) {
    for (const otherRota of otherRotasToday) {
      const isPrevious = moment(otherRota.startTime, "HH:mm").isBefore(
        moment(currentRota.startTime, "HH:mm"),
      );

      if (isPrevious) {
        const otherLogs = otherRota.attendanceLogs || [];
        if (otherLogs.length > 0) {
          const latestOtherLog = otherLogs[otherLogs.length - 1];

          // If the previous rota has a clockIn but NO clockOut, throw an error
          if (
            latestOtherLog.clockIn &&
            (!latestOtherLog.clockOut || latestOtherLog.clockOut === "")
          ) {
            throw new AppError(
              httpStatus.BAD_REQUEST,
              `Cannot clock in. Your previous shift (${
                otherRota.shiftName || "Standard"
              }) is not closed yet. Please clock out of it first.`,
            );
          }
        }
      }
    }
  }

  // 3. Process Attendance for the Current Rota
  const logs = currentRota.attendanceLogs || [];
  const latestLog = logs[logs.length - 1];

  let newStatus = currentRota.status;

  // If there is an active log (clocked in but not clocked out), we CLOCK OUT
  if (
    latestLog &&
    latestLog.clockIn &&
    (!latestLog.clockOut || latestLog.clockOut === "")
  ) {
    latestLog.clockOut = currentTime;
    newStatus = "clockout"; // Or "completed" based on your business logic
  }
  // Otherwise, we CLOCK IN
  else {
    logs.push({
      clockIn: currentTime,
      clockOut: "",
    });
    newStatus = "clockin";
  }

  // 4. Update and Save
  currentRota.attendanceLogs = logs;
  currentRota.status = newStatus as any; // Cast to bypass enum strictness if needed, or ensure it matches schema

  await currentRota.save();
  await currentRota.populate({
    path: "employeeId",
    select: "firstName lastName",
  });

  return currentRota;
};

export const RotaServices = {
  getAllRotaFromDB,
  getSingleRotaFromDB,
  updateRotaIntoDB,
  createRotaIntoDB,
  deleteRotaFromDB,
  copyRotaIntoDB,
  bulkAssignRotaIntoDB,
  getUpcomingRotaFromDB,
  createRotaAttendanceIntoDB,
};
