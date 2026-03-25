import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { Attendance } from "./attendance.model";
import { TAttendance } from "./attendance.interface";
import { EmployeeRate } from "../hr/employeeRate/employeeRate.model";
import { User } from "../user/user.model";
import { Types } from "mongoose";
import moment from "moment-timezone";
import { Rota } from "../rota/rota.model";
import { ServiceUser } from "../serviceUser/serviceUser.model";

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

const getDatePart = () => moment().format("YYYY-MM-DD");

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
    isApproved,
    ...filters
  } = query;

  // =========================================================
  // 1. Prepare Filters for List (User Relationships)
  // =========================================================
  if (companyId) {
    filters.companyId = new Types.ObjectId(companyId as string);
  }

  if (isApproved !== undefined) {
    const isApprovedBool = isApproved === "true" || isApproved === true;
    if (isApprovedBool) {
      filters.isApproved = true;
    } else {
      filters.isApproved = { $ne: true };
    }
  }

  if (filters.userType !== "visitor" && filters.userType !== "service_user") {
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
          meta: { page: 1, limit: 0, total: 0, totalPage: 1 },
          result: [],
        };
      }
      listTargetUserIds = filteredUsers.map((u) => u._id);
      filters.userId = { $in: listTargetUserIds };
    }

    if (departmentId) {
      const matchedRotas = await Rota.find({
        departmentId: new Types.ObjectId(departmentId as string),
      }).select("_id");

      const matchedRotaIds = matchedRotas.map((r: any) => r._id);
      filters.rotaId = { $in: matchedRotaIds };
    }
  }

  // =========================================================
  // 2. Build Query & Apply Filters (NO PAGINATION YET)
  // =========================================================
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
        select: "name firstName lastName email phone designationId departmentId employeeId",
        populate: [
          { path: "designationId", select: "title" },
          { path: "departmentId", select: "departmentName" },
        ],
      })
      .populate({
        path: "serviceUserId",
        select: "name room",
      })
      .populate("rotaId")
      .populate({
        path: "rotaId",
        populate: {
          path: "departmentId",
          select: "departmentName",
        },
      }),
    queryBuilderParams,
  )
    .search(["clockInDate", "visitorName"])
    .filter(queryBuilderParams)
    .sort()
    .fields();

  // =========================================================
  // 3. Handle Date Filters (UPDATED FOR ISO STRINGS)
  // =========================================================
  if (month && year) {
    // Force the boundaries to cover the entire start and end days
    const startString = moment(`${year}-${month}-01`, "YYYY-MM-DD")
      .startOf("month")
      .format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
    const endOfMonthString = moment(`${year}-${month}-01`, "YYYY-MM-DD")
      .endOf("month")
      .format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");

    attendanceQuery.modelQuery
      .where("clockInDate")
      .gte(startString as any)
      .lte(endOfMonthString as any);
  } else if (fromDate && toDate) {
    // Append time to properly encapsulate the full date range
    const startISO = `${fromDate}T00:00:00.000Z`;
    const endISO = `${toDate}T23:59:59.999Z`;

    attendanceQuery.modelQuery
      .where("clockInDate")
      .gte(startISO as any)
      .lte(endISO as any);
  }

  // =========================================================
  // 4. Calculate True Total Count
  // =========================================================
  const currentFilters = attendanceQuery.modelQuery.getFilter();
  const total = await Attendance.countDocuments(currentFilters);

  // =========================================================
  // 5. Apply Pagination and Execute
  // =========================================================
  if (!isUnlimited) {
    attendanceQuery.paginate();
  }

  const result = await attendanceQuery.modelQuery;

  return {
    meta: {
      page: pageNumber,
      limit: isUnlimited ? total : limitNumber,
      total: total,
      totalPage: isUnlimited ? 1 : Math.ceil(total / (limitNumber || 1)),
    },
    result,
  };
};

const getSingleAttendanceFromDB = async (id: string) => {
  const result = await Attendance.findById(id)
    .populate({
      path: "userId",
      select:
        "name firstName lastName email phone designationId employeeId departmentId",
      populate: [
        { path: "designationId", select: "title" },
        { path: "departmentId", select: "departmentName" },
      ],
    })
    .populate({
      path: "rotaId",
      populate: {
        path: "departmentId",
        select: "departmentName",
      },
    });

  return result;
};

const getCompanyEmployeesLatestAttendance = async (
  query: Record<string, unknown>,
) => {
  const { companyId, page = 1, limit = 10, searchTerm } = query;

  if (!companyId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Company ID is required.");
  }

  // 1. Build User Match Query
  const userMatch: any = {
    company: new Types.ObjectId(companyId as string),
    role: "employee",
  };

  if (searchTerm) {
    userMatch.$or = [
      { name: { $regex: searchTerm, $options: "i" } },
      { email: { $regex: searchTerm, $options: "i" } },
      { employeeId: { $regex: searchTerm, $options: "i" } },
    ];
  }

  // 2. Fetch ALL matching users (Do not apply skip/limit here yet)
  const users = await User.find(userMatch)
    .select(
      "name firstName lastName email phone designationId departmentId employeeId profileImage",
    )
    .populate({ path: "designationId", select: "title" })
    .populate({ path: "departmentId", select: "departmentName" })
    .lean(); // Use .lean() to get raw JS objects for faster processing

  if (!users.length) {
    return {
      meta: {
        page: Number(page),
        limit: limit === "all" ? 0 : Number(limit),
        total: 0,
        totalPage: 0,
      },
      result: [],
    };
  }

  const userIds = users.map((user) => user._id);

  // 3. Aggregate Latest Attendance for these users
  const latestAttendances = await Attendance.aggregate([
    { $match: { userId: { $in: userIds } } },
    { $sort: { createdAt: -1 } }, // Sort descending to get latest first
    {
      $group: {
        _id: "$userId", // Group by User
        latestStatus: { $first: "$status" },
        clockIn: { $first: "$clockIn" },
        clockInDate: { $first: "$clockInDate" },
        clockOut: { $first: "$clockOut" },
        clockOutDate: { $first: "$clockOutDate" },
        lastUpdated: { $first: "$createdAt" },
      },
    },
  ]);

  // Create a lookup map for O(1) matching
  const attendanceMap = new Map();
  latestAttendances.forEach((record) => {
    attendanceMap.set(record._id.toString(), record);
  });

  // 4. Merge Users with Attendance Data AND filter for 'clockin' only
  const clockedInUsers = users.reduce((acc, user) => {
    const attendanceInfo = attendanceMap.get(user._id.toString());

    // Check if the user's latest status is exactly "clockin"
    if (attendanceInfo && attendanceInfo.latestStatus === "clockin") {
      (acc as any).push({
        ...user,
        latestAttendance: attendanceInfo,
      });
    }
    return acc;
  }, []);

  // 5. Apply Pagination to the filtered list
  const pageNumber = Number(page);
  const limitNumber = limit === "all" ? 0 : Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const totalClockedIn = clockedInUsers.length;

  // Slice the array for the current page
  const paginatedResult =
    limitNumber === 0
      ? clockedInUsers
      : clockedInUsers.slice(skip, skip + limitNumber);

  return {
    meta: {
      page: pageNumber,
      limit: limitNumber === 0 ? totalClockedIn : limitNumber,
      total: totalClockedIn,
      totalPage:
        limitNumber === 0 ? 1 : Math.ceil(totalClockedIn / limitNumber),
    },
    result: paginatedResult,
  };
};

export const getCompanyServiceUsersLatestAttendance = async (
  query: Record<string, unknown>,
) => {
  const { companyId, page = 1, limit = 10, searchTerm } = query;

  if (!companyId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Company ID is required.");
  }

  // 1. Build ServiceUser Match Query
  // FIX: Changed `company` to `companyId`
  const serviceUserMatch: any = {
    companyId: new Types.ObjectId(companyId as string),
  };

  if (searchTerm) {
    // FIX: Changed firstName/lastName to `name`, added phone just in case
    serviceUserMatch.$or = [
      { name: { $regex: searchTerm, $options: "i" } },
      { email: { $regex: searchTerm, $options: "i" } },
      { phone: { $regex: searchTerm, $options: "i" } },
    ];
  }

  // 2. Fetch ALL matching ServiceUsers
  const serviceUsers = await ServiceUser.find(serviceUserMatch)
    .select("name email phone room")
    .lean();

  if (!serviceUsers.length) {
    return {
      meta: {
        page: Number(page),
        limit: limit === "all" ? 0 : Number(limit),
        total: 0,
        totalPage: 0,
      },
      result: [],
    };
  }

  const suIds = serviceUsers.map((su: any) => su._id);

  // 3. Aggregate Latest Attendance for these Service Users
  const latestAttendances = await Attendance.aggregate([
    { $match: { serviceUserId: { $in: suIds }, userType: "service_user" } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$serviceUserId",
        latestStatus: { $first: "$status" },
        clockIn: { $first: "$clockIn" },
        clockInDate: { $first: "$clockInDate" },
        clockOut: { $first: "$clockOut" },
        clockOutDate: { $first: "$clockOutDate" },
        lastUpdated: { $first: "$createdAt" },
      },
    },
  ]);

  // Create a lookup map
  const attendanceMap = new Map();
  latestAttendances.forEach((record) => {
    attendanceMap.set(record._id.toString(), record);
  });

  // 4. Merge Data AND filter for 'clockin' only
  const clockedInServiceUsers = serviceUsers.reduce((acc: any[], user) => {
    const attendanceInfo = attendanceMap.get(user._id.toString());

    // Check if the service user's latest status is exactly "clockin"
    if (attendanceInfo && attendanceInfo.latestStatus === "clockin") {
      acc.push({
        ...user,
        latestAttendance: attendanceInfo,
      });
    }
    return acc;
  }, []);

  // 5. Apply Pagination
  const pageNumber = Number(page);
  const limitNumber = limit === "all" ? 0 : Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const totalClockedIn = clockedInServiceUsers.length;

  const paginatedResult =
    limitNumber === 0
      ? clockedInServiceUsers
      : clockedInServiceUsers.slice(skip, skip + limitNumber);

  return {
    meta: {
      page: pageNumber,
      limit: limitNumber === 0 ? totalClockedIn : limitNumber,
      total: totalClockedIn,
      totalPage:
        limitNumber === 0 ? 1 : Math.ceil(totalClockedIn / limitNumber),
    },
    result: paginatedResult,
  };
};

const getCompanyVisitorsLatestAttendance = async (
  query: Record<string, unknown>,
) => {
  const { companyId, page = 1, limit = 10, searchTerm } = query;

  if (!companyId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Company ID is required.");
  }

  const pageNumber = Number(page);
  const limitNumber = limit === "all" ? 0 : Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  // 1. Build Query for Visitors who are currently clocked in
  const matchStage: any = {
    companyId: new Types.ObjectId(companyId as string),
    userType: "visitor",
    status: "clockin", // We only want visitors actively inside the premises
  };

  // 2. Add Search functionality for embedded visitor fields
  if (searchTerm) {
    matchStage.$or = [
      { visitorName: { $regex: searchTerm, $options: "i" } },
      { visitorPhone: { $regex: searchTerm, $options: "i" } },
      { visitReason: { $regex: searchTerm, $options: "i" } },
    ];
  }

  // 3. Get Totals
  const totalVisitors = await Attendance.countDocuments(matchStage);

  // 4. Fetch Paginated Results
  let visitorsQuery = Attendance.find(matchStage)
    .sort({ createdAt: -1 })
    .lean();

  if (limitNumber > 0) {
    visitorsQuery = visitorsQuery.skip(skip).limit(limitNumber);
  }

  const visitors = await visitorsQuery;

  return {
    meta: {
      page: pageNumber,
      limit: limitNumber === 0 ? totalVisitors : limitNumber,
      total: totalVisitors,
      totalPage: limitNumber === 0 ? 1 : Math.ceil(totalVisitors / limitNumber),
    },
    result: visitors,
  };
};

// const createAttendanceIntoDB = async (
//   payload: Partial<TAttendance> & { actionType?: 'clock_in' | 'clock_out' }
// ) => {
//   const {
//     userId,
//     serviceUserId,
//     visitorName,
//     userType = 'employee',
//     deviceId,
//     location,
//     source,
//     visitReason,
//     clockType,
//     notes,
//     actionType,
//     companyId
//   } = payload;

//   // 1. Validate companyId
//   if (!companyId) {
//     throw new AppError(httpStatus.BAD_REQUEST, "Company ID is required.");
//   }

//   // --- Map identifiers correctly based on userType ---
//   const resolvedServiceUserId = serviceUserId || (userType === 'service_user' ? userId : undefined);
//   const resolvedUserId = userType === 'employee' ? userId : undefined;

//   // 2. Validate identifiers
//   if (userType === 'employee' && !resolvedUserId) {
//     throw new AppError(httpStatus.BAD_REQUEST, "Employee ID is required.");
//   }

//   if (userType === 'service_user' && !resolvedServiceUserId) {
//     throw new AppError(httpStatus.BAD_REQUEST, "Service User ID is required.");
//   }

//   if (userType === 'visitor' && !visitorName) {
//     throw new AppError(httpStatus.BAD_REQUEST, "Visitor Name is required.");
//   }

//   if (userType === 'visitor' && !actionType) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "actionType ('clock_in' or 'clock_out') is strictly required for visitors."
//     );
//   }

//   const now = moment();
//   const todayDateStr = now.format("YYYY-MM-DD");
//   const currentTimeOnly = now.format("HH:mm");

//   // =====================================================
//   // FIND ACTIVE SESSION
//   // =====================================================

//   const matchQuery: any = {
//     status: "clockin",
//     userType,
//     companyId
//   };

//   if (userType === 'employee') {
//     matchQuery.userId = resolvedUserId;
//   } else if (userType === 'service_user') {
//     matchQuery.serviceUserId = resolvedServiceUserId;
//   } else if (userType === 'visitor') {
//     matchQuery.visitorName = {
//       $regex: `^${(visitorName as any).trim()}$`,
//       $options: "i"
//     };
//   }

//   const activeAttendance = await Attendance
//     .findOne(matchQuery)
//     .sort({ createdAt: -1 });

//   // =====================================================
//   // DETERMINE ACTION
//   // =====================================================

//   let finalAction: 'clock_in' | 'clock_out';

//   if (userType === 'visitor') {
//     // Visitors MUST rely on the explicit actionType
//     finalAction = actionType as 'clock_in' | 'clock_out';

//   } else if (userType === 'employee') {
//     // ✅ Employees: use explicit actionType if provided, otherwise auto-detect
//     if (actionType) {
//       // ✅ Block clock_in if there's already an active (un-clocked-out) session
//       if (actionType === 'clock_in' && activeAttendance) {
//         throw new AppError(
//           httpStatus.BAD_REQUEST,
//           "You are already clocked in."
//         );
//       }
//       finalAction = actionType;
//     } else {
//       // Auto-detect fallback
//       finalAction = activeAttendance ? 'clock_out' : 'clock_in';
//     }

//   } else {
//     // Service Users: auto-detect
//     finalAction = activeAttendance ? 'clock_out' : 'clock_in';
//   }

//   // =====================================================
//   // ROUTE: CLOCK IN
//   // =====================================================
//   if (finalAction === 'clock_in') {

//     // Prevent double clock-in for employees and service users
//     if (activeAttendance && userType !== 'visitor') {
//       throw new AppError(httpStatus.BAD_REQUEST, "You are already clocked in.");
//     }

//     const attendanceRecord = await Attendance.create({
//       userId: resolvedUserId,
//       serviceUserId: resolvedServiceUserId,
//       visitorName: visitorName?.trim(),
//       userType,
//       companyId,
//       visitReason,
//       clockIn: currentTimeOnly,
//       clockInDate: todayDateStr,
//       status: "clockin",
//       source: source || "accessControl",
//       clockType: clockType || "qr",
//       deviceId,
//       location,
//       notes,
//     });

//     return {
//       action: "clock_in",
//       message: "Successfully clocked in.",
//       data: attendanceRecord,
//     };
//   }

//   // =====================================================
//   // ROUTE: CLOCK OUT
//   // =====================================================
//   if (finalAction === 'clock_out') {

//     if (!activeAttendance) {
//       throw new AppError(
//         httpStatus.BAD_REQUEST,
//         "No active Clock In session found to clock out from."
//       );
//     }

//     const clockInMoment = moment(
//       `${activeAttendance.clockInDate} ${activeAttendance.clockIn}`,
//       "YYYY-MM-DD HH:mm"
//     );

//     const durationInMinutes = now.diff(clockInMoment, "minutes");

//     activeAttendance.clockOut = currentTimeOnly;
//     activeAttendance.clockOutDate = todayDateStr;
//     activeAttendance.status = "clockout";
//     activeAttendance.totalDuration = durationInMinutes > 0 ? durationInMinutes : 0;

//     if (location) activeAttendance.location = location;
//     if (notes) activeAttendance.notes = notes;

//     await activeAttendance.save();

//     return {
//       action: "clock_out",
//       message: "Successfully clocked out.",
//       data: activeAttendance,
//     };
//   }
// };

const createAttendanceIntoDB = async (
  payload: Partial<TAttendance> & { actionType?: "clock_in" | "clock_out" },
) => {
  const {
    userId,
    serviceUserId,
    visitorName,
    userType = "employee",
    deviceId,
    location,
    source,
    visitReason,
    clockType,
    notes,
    actionType,
    companyId,
  } = payload;

  // =====================================================
  // 1. VALIDATIONS & SETUP
  // =====================================================
  if (!companyId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Company ID is required.");
  }

  // Map identifiers correctly based on userType
  const resolvedServiceUserId =
    serviceUserId || (userType === "service_user" ? userId : undefined);
  const resolvedUserId = userType === "employee" ? userId : undefined;

  // Validate identifiers
  if (userType === "employee" && !resolvedUserId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Employee ID is required.");
  }

  if (userType === "service_user" && !resolvedServiceUserId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Service User ID is required.");
  }

  if (userType === "visitor" && !visitorName) {
    throw new AppError(httpStatus.BAD_REQUEST, "Visitor Name is required.");
  }

  if (userType === "visitor" && !actionType) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "actionType ('clock_in' or 'clock_out') is strictly required for visitors.",
    );
  }

  const now = moment();
  const currentIsoTime = now.toISOString(); 
const todayDateStr = now.format("YYYY-MM-DD");
  const currentTimeOnly = now.format("HH:mm");
  // =====================================================
  // 2. FIND ACTIVE SESSION
  // =====================================================
  const matchQuery: any = {
    status: "clockin",
    userType,
    companyId,
  };

  if (userType === "employee") {
    matchQuery.userId = resolvedUserId;
  } else if (userType === "service_user") {
    matchQuery.serviceUserId = resolvedServiceUserId;
  } else if (userType === "visitor") {
    matchQuery.visitorName = {
      $regex: `^${(visitorName as any).trim()}$`,
      $options: "i",
    };
  }

  const activeAttendance = await Attendance.findOne(matchQuery).sort({
    createdAt: -1,
  });

  // =====================================================
  // 3. DETERMINE ACTION (CLOCK IN OR OUT)
  // =====================================================
  let finalAction: "clock_in" | "clock_out";

  if (userType === "visitor") {
    // Visitors MUST rely on the explicit actionType
    finalAction = actionType as "clock_in" | "clock_out";
  } else if (userType === "employee") {
    // Employees: use explicit actionType if provided, otherwise auto-detect
    if (actionType) {
      if (actionType === "clock_in" && activeAttendance) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "You are already clocked in.",
        );
      }
      finalAction = actionType;
    } else {
      finalAction = activeAttendance ? "clock_out" : "clock_in";
    }
  } else {
    // Service Users: auto-detect
    finalAction = activeAttendance ? "clock_out" : "clock_in";
  }

  // =====================================================
  // 4. ROUTE: CLOCK IN
  // =====================================================
  if (finalAction === "clock_in") {
    // Prevent double clock-in for employees and service users
    if (activeAttendance && userType !== "visitor") {
      throw new AppError(httpStatus.BAD_REQUEST, "You are already clocked in.");
    }

    let matchedRotaId: any = undefined;
    let shiftAssignedDate = todayDateStr;
    let shiftName = "unscheduled shift";

    // =====================================================
    // 🛑 ROTA SELECTION LOGIC FOR EMPLOYEES (STRICT) 🛑
    // =====================================================
    if (userType === "employee") {
      // Fetch ALL rotas for this employee that cover today
      const todayRotas = await Rota.find({
        employeeId: resolvedUserId,
        companyId,
        status: "publish",
        startDate: { $lte: todayDateStr },
        endDate: { $gte: todayDateStr },
      });

      // No rota at all for today → hard error
      if (!todayRotas || todayRotas.length === 0) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "No shift assigned today. Please contact admin.",
        );
      }

      // Check if ALL of today's rotas indicate the employee is on leave
      const leavRotas = todayRotas.filter(
        (rota) => rota.leaveType && rota.leaveType.trim() !== "",
      );

      if (leavRotas.length === todayRotas.length) {
        // Every rota for today is a leave rota → employee is on leave
        const leaveLabel = leavRotas[0].leaveType;
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `You’re on leave today (${leaveLabel}), so clock in isn’t available.`,
        );
      }

      // Filter out leave rotas — only work with active (non-leave) rotas
      const workRotas = todayRotas.filter(
        (rota) => !rota.leaveType || rota.leaveType.trim() === "",
      );

      if (workRotas.length === 0) {
        throw new AppError(httpStatus.BAD_REQUEST, "No Shift found for today.");
      }

      // Validate each rota has required time fields
      const rotasWithTimes = workRotas.filter(
        (rota) => rota.startTime && rota.endTime,
      );

      if (rotasWithTimes.length === 0) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Your assigned rota for today has no start/end time configured.",
        );
      }

      // ── CLOCK-IN TIME WINDOW CHECK ──
      const validRotas = rotasWithTimes.filter((rota) => {
        // Build ISO compliant strings for parsing shift times
        const shiftStart = moment(
          `${todayDateStr}T${rota.startTime}:00`, 
          moment.ISO_8601,
          true
        );
        const shiftEnd = moment(
          `${todayDateStr}T${rota.endTime}:00`, 
          moment.ISO_8601,
          true
        );

        // Handle overnight shifts (e.g. 22:00 → 06:00)
        if (shiftEnd.isBefore(shiftStart)) {
          shiftEnd.add(1, "day");
        }

        // Window opens at the very beginning of the day (00:00:00)
        const startWindow = shiftStart.clone().startOf("day");

        // Window stays open until the very end of the shift's ending day (23:59:59)
        const endWindow = shiftEnd.clone().endOf("day");

        return now.isBetween(startWindow, endWindow, null, "[]");
      });

      // Guard: no rota window is currently open
      if (validRotas.length === 0) {
        throw new AppError(httpStatus.BAD_REQUEST, `No Shift found for today.`);
      }

      // ── AUTO-SELECT ROTA ──────────────────────────────────────────────
      let selectedRota = validRotas[0];

      if (validRotas.length > 1) {
        validRotas.sort((a, b) => {
          const aStart = moment(`${todayDateStr}T${a.startTime}:00`, moment.ISO_8601);
          const bStart = moment(`${todayDateStr}T${b.startTime}:00`, moment.ISO_8601);
          
          // Prefer the rota whose start is nearest (past or future) to now
          return (
            Math.abs(now.diff(aStart, "minutes")) -
            Math.abs(now.diff(bStart, "minutes"))
          );
        });
        selectedRota = validRotas[0];
      }

      matchedRotaId = selectedRota._id;
      shiftAssignedDate = selectedRota.startDate;
      shiftName = selectedRota.shiftName || "shift";
    }

    // ── CREATE THE ATTENDANCE RECORD (USING ISO TIMESTAMPS) ──────────────
    const attendanceRecord = await Attendance.create({
      userId: resolvedUserId,
      serviceUserId: resolvedServiceUserId,
      visitorName: visitorName?.trim(),
      userType,
      companyId,
      visitReason,
      rotaId: matchedRotaId,
      date: shiftAssignedDate,
      clockIn:  currentIsoTime,
      clockInDate: currentIsoTime,
      status: "clockin",
      source: source || "accessControl",
      clockType: clockType || "qr",
      deviceId,
      location,
      notes,
    });

    return {
      action: "clock_in",
      message:
        userType === "employee"
          ? `Successfully clocked in to ${shiftName}.`
          : "Successfully clocked in.",
      data: attendanceRecord,
    };
  }

  // =====================================================
  // 5. ROUTE: CLOCK OUT
  // =====================================================
  if (finalAction === "clock_out") {
    if (!activeAttendance) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "No active session found. Please clock in first.",
      );
    }

    // Because clockIn is now saved as an ISO string, we can parse it directly 
    // without manual concatenation of dates and times
    const clockInMoment = moment(activeAttendance.clockIn, moment.ISO_8601);
    const durationInMinutes = now.diff(clockInMoment, "minutes");

    
    activeAttendance.clockOut = currentIsoTime; 
    activeAttendance.clockOutDate = currentIsoTime; 
    activeAttendance.status = "clockout";
    activeAttendance.totalDuration = durationInMinutes > 0 ? durationInMinutes : 0;

    if (location) activeAttendance.location = location;
    if (notes) activeAttendance.notes = notes;

    await activeAttendance.save();

    return {
      action: "clock_out",
      message: "Successfully clocked out.",
      data: activeAttendance,
    };
  }
};

const updateAttendanceIntoDB = async (
  id: string,
  payload: Partial<TAttendance>,
) => {
  const attendance = await Attendance.findById(id);

  if (!attendance) {
    throw new AppError(httpStatus.NOT_FOUND, "Attendance not found");
  }

  if (payload.clockOut || payload.clockOutDate) {
    payload.status = "clockout";
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
  getCompanyEmployeesLatestAttendance,
  getCompanyVisitorsLatestAttendance,
  getCompanyServiceUsersLatestAttendance,
};
