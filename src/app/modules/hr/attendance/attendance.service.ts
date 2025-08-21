import httpStatus from "http-status";

import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";

import { Attendance } from "./attendance.model";
import { AttendanceSearchableFields } from "./attendance.constant";
import { TAttendance } from "./attendance.interface";
import moment from "moment";


const getMonthStartAndEnd = (month: string, year: string) => {
  const startOfMonth = moment(`${year}-${month}-01`, 'YYYY-MM-DD').startOf('month').toDate();
  const endOfMonth = moment(`${year}-${month}-01`, 'YYYY-MM-DD').endOf('month').toDate();
  return { startOfMonth, endOfMonth };
};

const getAttendanceFromDB = async (query: Record<string, unknown>) => {
  const { month, year, fromDate, toDate, ...otherQueryParams } = query;

  // Base query with population
  const userQuery = new QueryBuilder(
    Attendance.find()
      .populate("userId", "name firstName initial lastName email phone")
      .populate({
        path: "userId",
        populate: {
          path: "departmentId",
        },
      }),
    otherQueryParams
  )
    .search(AttendanceSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  // --- Case 1: Filter by Month & Year ---
  if (month && year) {
    const { startOfMonth, endOfMonth } = getMonthStartAndEnd(
      month as string,
      year as string
    );

    userQuery.modelQuery
      .where("clockIn")
      .gte(startOfMonth)  // whole month start
      .lte(endOfMonth);   // whole month end
  }

  // --- Case 2: Filter by Custom Date Range (day-to-day) ---
  if (fromDate && toDate) {
    const startDate = moment(fromDate, "YYYY-MM-DD").startOf("day").toDate();
    const endDate = moment(toDate, "YYYY-MM-DD").endOf("day").toDate();

    userQuery.modelQuery
      .where("clockIn")
      .gte(startDate)
      .lte(endDate);
  }

  // --- Fetch meta and results ---
  const meta = await userQuery.countTotal();
  const result = await userQuery.modelQuery;

  return {
    meta,
    result,
  };
};



const getSingleAttendanceFromDB = async (id: string) => {
  const result = await Attendance.findById(id);
  return result;
};

const createAttendanceIntoDB = async (payload: Partial<TAttendance>) => {
  try {
    const {
      userId,
      eventType,
      timestamp,
      source,
      clockType,
      deviceId,
      location,
      screenshots,
      notes,
    } = payload;

    if (!userId || !eventType || !timestamp) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "userId, eventType and timestamp are required"
      );
    }

    if (eventType === "clock_in") {
      // Create a new attendance session for clock-in
      const sessionData: Partial<TAttendance> = {
        userId,
        clockIn: timestamp,
        eventType,
        source,
        timestamp,
      };

      // Add optional fields if they exist
      if (clockType) sessionData.clockType = clockType;
      if (deviceId) sessionData.deviceId = deviceId;
      if (location) sessionData.location = location;
      if (screenshots) sessionData.screenshots = screenshots;
      if (notes) sessionData.notes = notes;

      // Handle approval requirements based on source
      if (source === "mobileApp") {
        sessionData.approvalRequired = true;
        sessionData.approvalStatus = "pending";
      }

      const result = await Attendance.create(sessionData);
      return result;
    }

    if (eventType === "clock_out") {
      // Find latest unclosed attendance session
      const existingSession = await Attendance.findOne({
        userId,
        clockOut: { $exists: false },
      }).sort({ clockIn: -1 });

      if (!existingSession) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "No open clock-in session found for user"
        );
      }

      // Update the existing session with clock-out data
      const updateData: Partial<TAttendance> = {
        clockOut: timestamp,
        eventType,
      };

      // Add optional fields if they exist
      if (location) updateData.location = location;
      if (screenshots) {
        updateData.screenshots = [
          ...(existingSession.screenshots || []),
          ...screenshots,
        ];
      }
      if (notes) updateData.notes = notes;

      const result = await Attendance.findByIdAndUpdate(
        existingSession._id,
        updateData,
        { new: true }
      );

      return result;
    }

    if (eventType === "manual") {
  if (!payload.clockIn || !payload.clockOut) {
    throw new AppError(httpStatus.BAD_REQUEST, "clockIn and clockOut are required for manual_entry");
  }

  const sessionData: Partial<TAttendance> = {
    userId,
    clockIn: payload.clockIn,
    clockOut: payload.clockOut,
    eventType,
    source,
  };

  if (clockType) sessionData.clockType = clockType;
  if (deviceId) sessionData.deviceId = deviceId;
  if (location) sessionData.location = location;
  if (screenshots) sessionData.screenshots = screenshots;
  if (notes) sessionData.notes = notes;

  const result = await Attendance.create(sessionData);
  return result;
}

    throw new AppError(httpStatus.BAD_REQUEST, "Invalid eventType");
  } catch (error: any) {
    console.error("Error in createAttendanceIntoDB:", error);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to create Attendance"
    );
  }
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
