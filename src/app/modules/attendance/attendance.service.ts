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
    ...filters // the rest of the query params
  } = query;

  // =========================================================
  // 1. Prepare Filters for List (User Relationships)
  // =========================================================
  let listTargetUserIds: Types.ObjectId[] = [];
  const listUserFilter: Record<string, unknown> = {};

  if (companyId) listUserFilter.company = new Types.ObjectId(companyId as string);
  if (designationId) listUserFilter.designationId = new Types.ObjectId(designationId as string);
  if (departmentId) listUserFilter.departmentId = new Types.ObjectId(departmentId as string);
  if (userId) listUserFilter._id = new Types.ObjectId(userId as string);

  // If any user-level filter is applied, we must resolve user IDs first
  if (companyId || designationId || userId || departmentId) {
    const filteredUsers = await User.find(listUserFilter).select("_id");

    if (filteredUsers.length === 0) {
      return {
        meta: {
          page: 1,
          limit: 0,
          total: 0,
          totalPage: 1,
        },
        result: [],
      };
    }
    listTargetUserIds = filteredUsers.map((u) => u._id);
    filters.userId = { $in: listTargetUserIds };
  }

  // NOTE: Rota filtering has been completely removed as per the new schema.

  // =========================================================
  // 2. Build & Execute Attendance Query
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
      }),
    queryBuilderParams
  )
    .search(["clockInDate"]) // Changed from "date" to "clockInDate"
    .filter(queryBuilderParams)
    .sort()
    .fields();

  if (!isUnlimited) {
    attendanceQuery.paginate();
  }

  // =========================================================
  // 3. Handle Date Filters (Using clockInDate)
  // =========================================================
  if (month && year) {
    const startString = `${year}-${month}-01`;
    const endOfMonthString = moment(startString, "YYYY-MM-DD")
      .endOf("month")
      .format("YYYY-MM-DD");

    attendanceQuery.modelQuery
      .where("clockInDate")
      .gte(startString as any)
      .lte(endOfMonthString as any); 

  } else if (fromDate && toDate) {
    attendanceQuery.modelQuery
      .where("clockInDate")
      .gte(fromDate as any)
      .lte(toDate as any);
  }

  const result = await attendanceQuery.modelQuery;
  const total = result.length; // Note: For standard pagination, consider running a separate countDocuments() query.

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
      select: "name firstName lastName email phone designationId employeeId departmentId",
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

const getCompanyEmployeesLatestAttendance = async (query: Record<string, unknown>) => {
  const { companyId, page = 1, limit = 10, searchTerm } = query;

  if (!companyId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Company ID is required.");
  }

  // 1. Build User Match Query
  const userMatch: any = { company: new Types.ObjectId(companyId as string), role: 'employee' };
  
  if (searchTerm) {
    userMatch.$or = [
      { name: { $regex: searchTerm, $options: "i" } },
      { email: { $regex: searchTerm, $options: "i" } },
      { employeeId: { $regex: searchTerm, $options: "i" } }
    ];
  }

  // 2. Fetch ALL matching users (Do not apply skip/limit here yet)
  const users = await User.find(userMatch)
    .select("name firstName lastName email phone designationId departmentId employeeId profileImage")
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
  const paginatedResult = limitNumber === 0 
    ? clockedInUsers 
    : clockedInUsers.slice(skip, skip + limitNumber);

  return {
    meta: {
      page: pageNumber,
      limit: limitNumber === 0 ? totalClockedIn : limitNumber,
      total: totalClockedIn,
      totalPage: limitNumber === 0 ? 1 : Math.ceil(totalClockedIn / limitNumber),
    },
    result: paginatedResult,
  };
};

export const createAttendanceIntoDB = async (
  payload: Partial<TAttendance> & { actionType?: 'clock_in' | 'clock_out' }
) => {
  const {
    userId,
    serviceUserId,
    visitorName,
    visitorPhone,
    userType = 'employee',
    deviceId,
    location,
    source,
    clockType,
    notes,
    actionType,
    companyId
  } = payload;

  // 1. Validate companyId
  if (!companyId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Company ID is required.");
  }

  // Validate identifiers
  if (userType === 'employee' && !userId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Employee ID is required.");
  }

  if (userType === 'service_user' && !serviceUserId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Service User ID is required.");
  }

  if (userType === 'visitor' && !visitorName) {
    throw new AppError(httpStatus.BAD_REQUEST, "Visitor Name is required.");
  }

  const now = moment();
  const todayDateStr = now.format("YYYY-MM-DD");
  const currentTimeOnly = now.format("HH:mm");

  // =====================================================
  // FIND ACTIVE SESSION
  // =====================================================

  const matchQuery: any = {
    status: "clockin",
    userType,
    companyId
  };

  if (userType === 'employee') {
    matchQuery.userId = userId;
  }

  if (userType === 'service_user') {
    matchQuery.serviceUserId = serviceUserId;
  }

  if (userType === 'visitor') {
    matchQuery.visitorName = {
      $regex: `^${(visitorName as any).trim()}$`,
      $options: "i"   // case-insensitive
    };
  }

  const activeAttendance = await Attendance
    .findOne(matchQuery)
    .sort({ createdAt: -1 });

  // Prevent double clock in
  if (activeAttendance && actionType === 'clock_in') {
    throw new AppError(httpStatus.BAD_REQUEST, "You are already clocked in.");
  }

  // =====================================================
  // CLOCK OUT
  // =====================================================

  if (activeAttendance) {

    const clockInMoment = moment(
      `${activeAttendance.clockInDate} ${activeAttendance.clockIn}`,
      "YYYY-MM-DD HH:mm"
    );

    const durationInMinutes = now.diff(clockInMoment, "minutes");

    activeAttendance.clockOut = currentTimeOnly;
    activeAttendance.clockOutDate = todayDateStr;
    activeAttendance.status = "clockout";

    activeAttendance.totalDuration =
      durationInMinutes > 0 ? durationInMinutes : 0;

    if (location) activeAttendance.location = location;
    if (notes) activeAttendance.notes = notes;

    await activeAttendance.save();

    return {
      action: "clock_out",
      message: "Successfully clocked out.",
      data: activeAttendance,
    };
  }

  // =====================================================
  // NO ACTIVE SESSION -> CLOCK IN
  // =====================================================

  if (!activeAttendance && actionType === 'clock_out') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "No active Clock In session found to clock out from."
    );
  }

  const attendanceRecord = await Attendance.create({
    userId,
    serviceUserId,
    visitorName: visitorName?.trim(),
    visitorPhone,
    userType,
    companyId,
    clockIn: currentTimeOnly,
    clockInDate: todayDateStr,
    status: "clockin",
    source: source || "accessControl",
    clockType: clockType || "qr",
    deviceId,
    location,
    notes,
  });

  return {
    action: "clock_in",
    message: "Successfully clocked in.",
    data: attendanceRecord,
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
  getCompanyEmployeesLatestAttendance
};