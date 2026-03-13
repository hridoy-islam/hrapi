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

export const getAttendanceFromDB = async (query: Record<string, unknown>) => {
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
  // 1. Calculate "Today's" Stats
  // =========================================================
  const todayDateString = getDatePart(); // e.g., "2024-01-25"
  
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


  

  // =========================================================
  // 2. Prepare Filters for List (User Relationships)
  // =========================================================
  let listTargetUserIds: Types.ObjectId[] = [];
  const listUserFilter: Record<string, unknown> = {};

  if (companyId) listUserFilter.company = new Types.ObjectId(companyId as string);
  if (designationId) listUserFilter.designationId = new Types.ObjectId(designationId as string);
  
  // NOTE: If you only want to filter by the ROTA's department and not the USER's base department, 
  // you might want to comment out this next line. Otherwise, it enforces BOTH.
  if (departmentId) listUserFilter.departmentId = new Types.ObjectId(departmentId as string);
  
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
        },
        result: [],
      };
    }
    listTargetUserIds = filteredUsers.map((u) => u._id);
    filters.userId = { $in: listTargetUserIds };
  }

  // =========================================================
  // 2.5. Prepare Filters for Rota Department
  // =========================================================
  if (departmentId) {
    // Find all Rotas that belong to this department
    const matchedRotas = await Rota.find({ 
      departmentId: new Types.ObjectId(departmentId as string) 
    }).select("_id");

    const matchedRotaIds = matchedRotas.map((r:any) => r._id);

    // Add these valid Rota IDs to our main attendance filter
    // If a specific userId was passed, `filters.userId` is already set above, 
    // creating a natural "AND" condition in MongoDB.
    filters.rotaId = { $in: matchedRotaIds };
  }

  // =========================================================
  // 3. Build & Execute Attendance Query
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
        select: "name firstName lastName email phone designationId employeeId",
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
    }),
    queryBuilderParams
  )
    .search(["date"]) 
    .filter(queryBuilderParams)
    .sort()
    .fields();

  if (!isUnlimited) {
    attendanceQuery.paginate();
  }

  // Handle Date Filters
  if (month && year) {
    const startString = `${year}-${month}-01`;
    const endOfMonthString = moment(startString, "YYYY-MM-DD")
      .endOf("month")
      .format("YYYY-MM-DD");

    attendanceQuery.modelQuery
      .where("date")
      .gte(startString as any)
      .lte(endOfMonthString as any); 

  } else if (fromDate && toDate) {
    attendanceQuery.modelQuery
      .where("date")
      .gte(fromDate as any)
      .lte(toDate as any);
  }

  const result = await attendanceQuery.modelQuery;
  const total = result.length; // Note: If using pagination, this might just be the length of the current page. Consider using `Attendance.countDocuments` for accurate total pagination meta.

  return {
    meta: {
      page: pageNumber,
      limit: isUnlimited ? total : limitNumber,
      total: total, 
      totalPage: isUnlimited ? 1 : Math.ceil(total / limitNumber),
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


const createAttendanceIntoDB = async (payload: Partial<TAttendance>) => {
  const { userId, deviceId, location, source, clockType } = payload;

  if (!userId) {
    throw new AppError(httpStatus.BAD_REQUEST, "User ID is required.");
  }

  const now = moment();
  const todayDateStr = now.format("YYYY-MM-DD");
  const currentTimeOnly = now.format("HH:mm");

  // =====================================================
  // 1. CHECK FOR ACTIVE SESSION (CLOCK OUT PRIORITY)
  // =====================================================
  const activeAttendance = await Attendance.findOne({
    userId,
    status: "clockin",
  }).sort({ createdAt: -1 });

  if (activeAttendance) {
    const lastLog = activeAttendance.attendanceLogs[activeAttendance.attendanceLogs.length - 1];

    if (lastLog && !lastLog.clockOut) {
      // Use the specific clockInDate from the log if available, otherwise fallback to main date
      const logClockInDate = lastLog.clockInDate || activeAttendance.date;
      const clockInMoment = moment(`${logClockInDate} ${lastLog.clockIn}`, "YYYY-MM-DD HH:mm");
      
      const durationInMinutes = now.diff(clockInMoment, "minutes");

      // Set the clock out time AND the new clockOutDate
      lastLog.clockOut = currentTimeOnly;
      lastLog.clockOutDate = todayDateStr; 
      
      activeAttendance.status = "clockout"; 
      activeAttendance.totalDuration += (durationInMinutes > 0 ? durationInMinutes : 0);
      
      if (location) (activeAttendance as any).location = location;

      await activeAttendance.save();

      return {
        action: "clock_out",
        message: "Successfully clocked out.",
        data: activeAttendance,
      };
    }
  }

  // =====================================================
  // 2. NO ACTIVE SESSION -> PROCESS CLOCK IN
  // =====================================================

  const todayRotas = await Rota.find({
    employeeId: userId,
    startDate: { $lte: todayDateStr },
    endDate: { $gte: todayDateStr },
  });

  if (!todayRotas || todayRotas.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, "No assigned shifts found for you today.");
  }

  // Filter valid rotas
  const validRotas = todayRotas.filter((rota) => {
    // 🛑 CRITICAL FIX: If the user is on leave for this specific rota, ignore it completely
    if (rota.leaveType && rota.leaveType.trim() !== "") {
      return false;
    }

    // Safety check: ensure start and end times exist
    if (!rota.startTime || !rota.endTime) return false;

    const shiftStart = moment(`${todayDateStr} ${rota.startTime}`, "YYYY-MM-DD HH:mm");
    let shiftEnd = moment(`${todayDateStr} ${rota.endTime}`, "YYYY-MM-DD HH:mm");
    
    if (shiftEnd.isBefore(shiftStart)) shiftEnd.add(1, "day");

    const startWindow = shiftStart.clone().subtract(1, "hours");
    const endWindow = shiftEnd.clone().add(2, "hours");

    return now.isBetween(startWindow, endWindow, null, "[]");
  });

  if (validRotas.length === 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "No active shifts available to clock in right now. (Note: Approved leaves are ignored)."
    );
  }

  // Pick the shift whose Start Time is closest to the CURRENT Time
  validRotas.sort((a, b) => {
    const aStart = moment(`${todayDateStr} ${a.startTime}`, "YYYY-MM-DD HH:mm");
    const bStart = moment(`${todayDateStr} ${b.startTime}`, "YYYY-MM-DD HH:mm");
    return Math.abs(now.diff(aStart, "minutes")) - Math.abs(now.diff(bStart, "minutes"));
  });

  const matchedRota = validRotas[0];

  // =====================================================
  // 3. CREATE OR UPDATE THE ATTENDANCE RECORD
  // =====================================================
  
  // NOTE: For overnight shifts, if they clock in past midnight, we still want to attach 
  // this punch to the correct scheduled shift date. 
  const shiftAssignedDate = matchedRota.startDate;

  let attendanceRecord = await Attendance.findOne({
    userId,
    rotaId: matchedRota._id,
    date: shiftAssignedDate, // Look for the record tied to the shift's scheduled date
  });

  if (attendanceRecord) {
    attendanceRecord.status = "clockin";
    // Add the new clockInDate here
    attendanceRecord.attendanceLogs.push({ 
      clockIn: currentTimeOnly,
      clockInDate: todayDateStr 
    } as any);
    await attendanceRecord.save();
  } else {
    attendanceRecord = await Attendance.create({
      userId,
      rotaId: matchedRota._id,
      date: shiftAssignedDate, // Grouping date stays as the assigned shift date
      status: "clockin",
      // Include the new clockInDate here
      attendanceLogs: [{ 
        clockIn: currentTimeOnly,
        clockInDate: todayDateStr 
      }],
      deviceId,
      source: source || "accessControl",
      clockType: clockType || "qr",
      location,
    });
  }

  return {
    action: "clock_in",
    message: `Successfully clocked in to ${matchedRota.shiftName || 'shift'}.`,
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
};