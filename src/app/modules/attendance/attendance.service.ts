import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { Attendance } from "./attendance.model";
import { TAttendance } from "./attendance.interface";
import { EmployeeRate } from "../hr/employeeRate/employeeRate.model";
import { User } from "../user/user.model";
import { Types } from "mongoose";
import moment from "moment-timezone";

// Constants
const UK_TIMEZONE = "Europe/London";

// Helper: Get Full ISO String (e.g., 2024-01-25T14:30:00+00:00)
const getFullISOString = (date: Date = new Date()) => {
  return moment(date).tz(UK_TIMEZONE).format(); 
};

// Helper: Extract Time String from ISO (HH:mm:ss)
const getTimeFromISO = (isoString: string) => {
  return moment(isoString).format("HH:mm:ss");
};

// Helper: Get Date Part for Searching (YYYY-MM-DD)
const getDatePart = (date: Date = new Date()) => {
  return moment(date).tz(UK_TIMEZONE).format("YYYY-MM-DD");
};

const getAttendanceFromDB = async (query: Record<string, unknown>) => {
  const {
    month,
    year,
    fromDate,
    toDate,
    designationId,
    departmentId,
    companyId,
    userId,
    page,
    limit,
    sort,
    fields,
    searchTerm,
    ...filters
  } = query;

  // 1. Calculate "Today's" Stats
  // We match any startDate that *starts with* today's YYYY-MM-DD
  const todayDateString = getDatePart(); // "2024-01-25"
  
  let companyUserIds: Types.ObjectId[] = [];

  if (companyId) {
    const companyUsers = await User.find({
      company: new Types.ObjectId(companyId as string),
    }).select("_id");
    companyUserIds = companyUsers.map((u) => u._id);
  } else {
    const allUsers = await User.find({ status: "active" }).select("_id");
    companyUserIds = allUsers.map((u) => u._id);
  }

  const totalCompanyEmployees = companyUserIds.length;

  // Stats Match: startDate must start with the today string
  const statsMatchStage: any = {
    startDate: { $regex: `^${todayDateString}` },
    userId: { $in: companyUserIds },
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

  // 2. Prepare Filters for List
  let listTargetUserIds: Types.ObjectId[] = [];
  const listUserFilter: Record<string, unknown> = {};

  if (companyId)
    listUserFilter.company = new Types.ObjectId(companyId as string);
  if (designationId)
    listUserFilter.designationId = new Types.ObjectId(designationId as string);
  if (departmentId)
    listUserFilter.departmentId = new Types.ObjectId(departmentId as string);
  if (userId) listUserFilter._id = new Types.ObjectId(userId as string);

  if (companyId || designationId || userId || departmentId) {
    const filteredUsers = await User.find(listUserFilter).select("_id");

    if (filteredUsers.length === 0) {
      return {
        meta: {
          page: 1,
          limit: 0,
          total: 0,
          totalPage: 1,
          stats: finalStats,
        },
        result: [],
      };
    }
    listTargetUserIds = filteredUsers.map((u) => u._id);
    filters.userId = { $in: listTargetUserIds };
  }

  const isUnlimited = limit === "all" || !limit;
  const pageNumber = Number(page || 1);
  const limitNumber = isUnlimited ? 0 : Number(limit);

  const queryBuilderParams = {
    ...filters,
    searchTerm,
    page: isUnlimited ? 1 : pageNumber,
    limit: limitNumber,
    sort,
    fields,
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
    .search(["notes", "deviceId", "startDate"]) // startDate search works on string
    .filter(queryBuilderParams)
    .sort()
    .fields();

  if (!isUnlimited) {
    attendanceQuery.paginate();
  }


  if (month && year) {
    // Whole Month: 2024-01-01T00:00... to 2024-01-31T23:59...
    const startString = `${year}-${month}-01`;
    const endOfMonthString = moment(startString, "YYYY-MM-DD")
      .endOf("month")
      .format("YYYY-MM-DD");

    // We use string comparison. 
    // "2024-01-01" is technically less than "2024-01-01T10:00", 
    // so we just ensure it starts >= start of month AND <= end of month + 'z' (to cover all times)
    
    attendanceQuery.modelQuery
      .where("startDate")
      .gte(startString as any)
      .lt(moment(endOfMonthString).add(1, 'day').format("YYYY-MM-DD") as any); 
  } else if (fromDate && toDate) {
    // Range: fromDate "2024-01-01" to toDate "2024-01-05"
    // We want to include all times on the toDate, so we look for < toDate + 1 day
    const nextDayAfterToDate = moment(toDate as string).add(1, 'day').format("YYYY-MM-DD");

    attendanceQuery.modelQuery
      .where("startDate")
      .gte(fromDate as any)
      .lt(nextDayAfterToDate as any);
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
    location,
    screenshots,
    notes,
    source,
    clockType,
  } = payload;

  if (!userId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "User ID is required."
    );
  }

  // Generate Current Timestamps (as fallback)
  const now = new Date();
  const currentFullISO = getFullISOString(now); 
  const currentTimeOnly = getTimeFromISO(currentFullISO); 

  // =====================================================
  // SCENARIO: MANUAL ENTRY (Bulk Upload / Admin Add)
  // =====================================================
  if ((payload as any).eventType === "manual") {
    return await Attendance.create({
      ...payload,
      // FIX: Use payload values if provided, otherwise fallback to current time
      startDate: payload.startDate || currentFullISO,  
      startTime: payload.startTime || currentTimeOnly,
      eventType: "manual",
      approvalRequired: true, 
      approvalStatus: payload.approvalStatus || "approved", // Respect payload status
    });
  }

  // =====================================================
  // ACTIVE SESSION CHECK
  // =====================================================
  const activeSession = await Attendance.findOne({
    userId,
    endDate: { $exists: false },
  }).sort({ createdAt: -1 });

  // =====================================================
  // SCENARIO A: CLOCK OUT
  // =====================================================
  if (activeSession) {
    const startMoment = moment(activeSession.startDate);
    const endMoment = moment(currentFullISO);
    
    if (endMoment.isBefore(startMoment)) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         "Clock Out time cannot be earlier than Clock In time."
      );
    }

    const durationInMinutes = endMoment.diff(startMoment, "minutes");

    const updateData: Partial<TAttendance> = {
      endDate: currentFullISO,
      endTime: currentTimeOnly,
      eventType: "clock_out",
      duration: durationInMinutes > 0 ? durationInMinutes : 0,
    };

    if (notes) updateData.notes = notes;
    if (location) (updateData as any).location = location;

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
  // SCENARIO B: CLOCK IN (Regular)
  // =====================================================
  const employeeRates = await EmployeeRate.find({ userId });

  let assignedShiftId = null;
  let shiftAmbiguityIssue = false;
  let systemNote = "";

  if (employeeRates.length === 1 && employeeRates[0].shiftId) {
    assignedShiftId = Array.isArray(employeeRates[0].shiftId)
      ? employeeRates[0].shiftId[0]
      : employeeRates[0].shiftId;
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

    // Standard Clock In uses Current Time
    startDate: currentFullISO, 
    startTime: currentTimeOnly, 

    shiftId: assignedShiftId || undefined,
  };

  if (location) (sessionData as any).location = location;
  if (screenshots) sessionData.screenshots = screenshots;

  if (notes) {
    sessionData.notes = shiftAmbiguityIssue
      ? `${notes} | ${systemNote}`
      : notes;
  } else if (shiftAmbiguityIssue) {
    sessionData.notes = systemNote;
  }

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