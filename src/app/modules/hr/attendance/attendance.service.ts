import httpStatus from "http-status";

import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";

import { Attendance } from "./attendance.model";
import { AttendanceSearchableFields } from "./attendance.constant";
import { TAttendance } from "./attendance.interface";
import { EmployeeRate } from "../employeeRate/employeeRate.model";
import { User } from "../../user/user.model";
import { Types } from "mongoose";
import moment from "moment-timezone";

const getMonthStartAndEnd = (month: string, year: string) => {
  const startOfMonth = moment(`${year}-${month}-01`, 'YYYY-MM-DD').startOf('month').toDate();
  const endOfMonth = moment(`${year}-${month}-01`, 'YYYY-MM-DD').endOf('month').toDate();
  return { startOfMonth, endOfMonth };
};


const UK_TIMEZONE = "Europe/London";

const formatUKTime = (date: Date | string) => {
  return moment(date).tz(UK_TIMEZONE).format("HH:mm");
};

const formatUKDate = (date: Date | string) => {
  return moment(date).tz(UK_TIMEZONE).toDate();
};

const getAttendanceFromDB = async (query: Record<string, unknown>) => {
  const {
    month,
    year,
    fromDate,
    toDate,
    designationId,
    companyId,
    userId,
    page,
    limit,
    sort,
    fields,
    searchTerm,
    ...filters
  } = query;

  const todayStart = moment().startOf("day").toDate();
  const todayEnd = moment().endOf("day").toDate();

  let companyUserIds: Types.ObjectId[] = [];

  if (companyId) {
    const companyUsers = await User.find({ company: new Types.ObjectId(companyId as string) }).select("_id");
    companyUserIds = companyUsers.map(u => u._id);
  } else {
    const allUsers = await User.find({ status: "active" }).select("_id");
    companyUserIds = allUsers.map(u => u._id);
  }

  const totalCompanyEmployees = companyUserIds.length;

  const statsMatchStage: any = {
    createdAt: { $gte: todayStart, $lte: todayEnd },
    userId: { $in: companyUserIds }
  };

  const todayStatsAggregation = await Attendance.aggregate([
    { $match: statsMatchStage },
    {
      $group: {
        _id: null,
        presentUsers: { $addToSet: "$userId" },
        pendingCount: {
          $sum: { $cond: [{ $eq: ["$approvalStatus", "pending"] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        present: { $size: "$presentUsers" },
        pending: "$pendingCount",
      },
    },
  ]);

  const statsResult = todayStatsAggregation[0] || { present: 0, pending: 0 };
  const absentCount = Math.max(0, totalCompanyEmployees - statsResult.present);

  const finalStats = {
    present: statsResult.present,
    pending: statsResult.pending,
    absent: absentCount,
  };

  let listTargetUserIds: Types.ObjectId[] = [];
  const listUserFilter: Record<string, unknown> = {};

  if (companyId) listUserFilter.company = new Types.ObjectId(companyId as string);
  if (designationId) listUserFilter.designationId = new Types.ObjectId(designationId as string);
  if (userId) listUserFilter._id = new Types.ObjectId(userId as string);

  if (companyId || designationId || userId) {
    const filteredUsers = await User.find(listUserFilter).select("_id");

    if (filteredUsers.length === 0) {
      return {
        meta: { page: 1, limit: 0, total: 0, totalPage: 1, stats: finalStats },
        result: []
      };
    }
    listTargetUserIds = filteredUsers.map(u => u._id);
    filters.userId = { $in: listTargetUserIds };
  }

  // Check if limit is 'all' or handle no limit
  const isUnlimited = limit === 'all' || !limit;
  const pageNumber = Number(page || 1);
  const limitNumber = isUnlimited ? 0 : Number(limit);

  const queryBuilderParams = {
    ...filters,
    searchTerm,
    page: isUnlimited ? 1 : pageNumber,
    limit: limitNumber,
    sort,
    fields
  };

  const attendanceQuery = new QueryBuilder(
    Attendance.find()
      .populate({
        path: "userId",
        select: "name firstName lastName email phone designationId employeeId",
        populate: [
    {
      path: "designationId",
      select: "title", 
    },
    {
      path: "departmentId",
      select: "departmentName", 
    },
  ],
      })
      .populate("shiftId"),
    queryBuilderParams
  )
    .search(["notes", "deviceId"])
    .filter(queryBuilderParams)
    .sort()
    .fields();

  // Only apply pagination if limit is not 'all'
  if (!isUnlimited) {
    attendanceQuery.paginate();
  }

  // Handle date filtering
  if (month && year) {
    // If explicit month and year are provided
    const startOfMonth = moment(`${year}-${month}-01`, "YYYY-MM-DD").startOf("month").toDate();
    const endOfMonth = moment(`${year}-${month}-01`, "YYYY-MM-DD").endOf("month").toDate();
    attendanceQuery.modelQuery.where("createdAt").gte(startOfMonth as any).lte(endOfMonth as any);
  } else if (fromDate && toDate) {
    const fromDateStr = fromDate as string;
    const toDateStr = toDate as string;
    
    // Check if dates are in YYYY-MM format (year-month only)
    const isMonthFormat = /^\d{4}-\d{2}$/.test(fromDateStr);
    
    // Check if fromDate and toDate are the same
    const isSameDate = fromDateStr === toDateStr;
    
    if (isMonthFormat || isSameDate) {
      // If format is YYYY-MM or dates are same, get the entire month
      const referenceDate = moment(fromDateStr, ["YYYY-MM", "YYYY-MM-DD"]);
      const startOfMonth = referenceDate.startOf("month").toDate();
      const endOfMonth = referenceDate.clone().endOf("month").toDate();
      attendanceQuery.modelQuery.where("createdAt").gte(startOfMonth as any).lte(endOfMonth as any);
    } else {
      // Standard date range (YYYY-MM-DD format with different dates)
      const start = moment(fromDateStr, "YYYY-MM-DD").startOf("day").toDate();
      const end = moment(toDateStr, "YYYY-MM-DD").endOf("day").toDate();
      attendanceQuery.modelQuery.where("createdAt").gte(start as any).lte(end as any);
    }
  }

  const result = await attendanceQuery.modelQuery;
  const total = result.length;

  return {
    meta: {
      page: pageNumber,
      limit: isUnlimited ? total : limitNumber,
      total: total,
      totalPage: isUnlimited ? 1 : Math.ceil(total / limitNumber),
      stats: finalStats,
    },
    result,
  };
};


const getSingleAttendanceFromDB = async (id: string) => {
  const result = await Attendance.findById(id);
  return result;
};

export const createAttendanceIntoDB = async (
  payload: Partial<TAttendance>
) => {
  const {
    userId,
    deviceId,
    timestamp,
    location,
    screenshots,
    notes,
    source,
    clockType,
  } = payload;

  if (!userId || !deviceId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "User ID and Device ID are required."
    );
  }

  // UK Time
  const actionDate = timestamp
    ? formatUKDate(timestamp)
    : formatUKDate(new Date());

  const actionTime = formatUKTime(actionDate); // HH:mm

  // =====================================================
  // MANUAL ENTRY
  // =====================================================
  if ((payload as any).eventType === "manual") {
    return await Attendance.create({
      ...payload,
      clockIn: actionTime,
      timestamp: actionDate,
      eventType: "manual",
      approvalRequired: true,
      approvalStatus: "pending",
    });
  }

  // =====================================================
  // ACTIVE SESSION CHECK
  // =====================================================
  const activeSession = await Attendance.findOne({
    userId,
    clockOut: { $exists: false },
  }).sort({ createdAt: -1 });

  // =====================================================
  // SCENARIO A: CLOCK OUT
  // =====================================================
  if (activeSession) {
    if (
      activeSession.clockIn &&
      actionTime < activeSession.clockIn
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Clock Out time cannot be earlier than Clock In time."
      );
    }

    const updateData: Partial<TAttendance> = {
      clockOut: actionTime,
      eventType: "clock_out",
    };

    if (notes) updateData.notes = notes;
    if (location) updateData.location = location;
    if (screenshots?.length) {
      updateData.screenshots = [
        ...(activeSession.screenshots || []),
        ...screenshots,
      ];
    }

    const result = await Attendance.findByIdAndUpdate(
      activeSession._id,
      updateData,
      { new: true }
    );

    return {
      action: "clock_out",
      message: "Successfully clocked out.",
      data: result,
    };
  }

  // =====================================================
  // SCENARIO B: CLOCK IN
  // =====================================================
  const employeeRates = await EmployeeRate.find({ userId });

  let assignedShiftId = null;
  let shiftAmbiguityIssue = false;
  let systemNote = "";

  if (employeeRates.length === 1 && employeeRates[0].shiftId) {
    assignedShiftId = Array.isArray(employeeRates[0].shiftId) ? employeeRates[0].shiftId[0] : employeeRates[0].shiftId;
  } else if (employeeRates.length === 0) {
    shiftAmbiguityIssue = true;
    systemNote = "System: No shift assignment found.";
  } else {
    shiftAmbiguityIssue = true;
    systemNote = "System: Multiple shifts found. Verification required.";
  }

  const sessionData: Partial<TAttendance> = {
    userId,
    deviceId,
    source: source || "mobileApp",
    clockType: clockType || "manual",
    eventType: "clock_in",
    clockIn: actionTime,        // HH:mm
    timestamp: actionDate,      // Full Date
    shiftId: assignedShiftId || undefined,
  };

  if (location) sessionData.location = location;
  if (screenshots) sessionData.screenshots = screenshots;

  if (notes) {
    sessionData.notes = shiftAmbiguityIssue
      ? `${notes} | ${systemNote}`
      : notes;
  } else if (shiftAmbiguityIssue) {
    sessionData.notes = systemNote;
  }

  // =====================================================
  // APPROVAL LOGIC
  // =====================================================
  if (shiftAmbiguityIssue || source === "mobileApp") {
    sessionData.approvalRequired = true;
    sessionData.approvalStatus = "pending";
  } else {
    sessionData.approvalRequired = false;
    sessionData.approvalStatus = "approved";
  }

  const result = await Attendance.create(sessionData);

  return {
    action: "clock_in",
    message: shiftAmbiguityIssue
      ? "Clocked in (Pending Approval: Shift verification needed)."
      : "Successfully clocked in.",
    data: result,
  };
};

const updateAttendanceIntoDB = async (
  id: string,
  payload: Partial<TAttendance>
) => {
  const attendance = await Attendance.findById(id);

  if (!attendance) {
    throw new AppError(httpStatus.NOT_FOUND, "Attendance not found");
  }

  const result = await Attendance.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};

export const AttendanceServices = {
  getAttendanceFromDB,
  getSingleAttendanceFromDB,
  createAttendanceIntoDB,
  updateAttendanceIntoDB,
};
