import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { MeetingMinsSearchableFields } from "./meetingMins.constant";
import { MeetingMins } from "./meetingMins.model";
import { TMeetingMins } from "./meetingMins.interface";
import moment from "../../utils/moment-setup";
import mongoose from "mongoose";

const getAllMeetingMinsFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(
    MeetingMins.find()
      .populate("logs.updatedBy", "firstName lastName initial name")
      .populate({path:"employeeId", select: "firstName lastName initial name"}),
    query
  )
    .search(MeetingMinsSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await userQuery.countTotal();
  const result = await userQuery.modelQuery;

  return { meta, result };
};

const getSingleMeetingMinsFromDB = async (id: string) => {
  const result = await MeetingMins.findById(id)
    .populate("logs.updatedBy", "firstName lastName initial name")
    .populate({
      path: "employeeId",
      select: "firstName lastName initial name designationId",
      populate: {
        path: "designationId",
        select: "title",
      },
    });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "MeetingMins not found");
  }

  return result;
};

const createMeetingMinsIntoDB = async (payload: any) => {
  try {
    const initialLogEntry = {
      title: "Meeting initiated",
      date: new Date(),
      updatedBy: payload.updatedBy,
      documents: payload.documents || [], // ✅ fixed
    };

    const data = {
      employeeId: payload.employeeId,
      title: payload.title, // ✅ required field
      nextMeetingDate: payload.nextMeetingDate, // ✅ fixed
      logs: [initialLogEntry],
      companyId:payload.companyId
    };

    const result = await MeetingMins.create(data);
    return result;
  } catch (error: any) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to create MeetingMins"
    );
  }
};

export const updateMeetingMinsIntoDB = async (
  id: string,
  payload: Partial<TMeetingMins> & { updatedBy?: string; documents?: string[]; note?: string }
) => {
  const meetingMins = await MeetingMins.findById(id);

  if (!meetingMins) {
    throw new AppError(httpStatus.NOT_FOUND, "Meeting minutes not found");
  }

  // 1. Create a log entry if new documents were uploaded
  if (payload.documents && payload.documents.length > 0) {
    // Log the documents against the date that just happened 
    // (If nextMeetingDate was null previously, fallback to today's date)
    const logDate = meetingMins.nextMeetingDate 
      ? new Date(meetingMins.nextMeetingDate) 
      : new Date();

    const newLog = {
      title: `Meeting Documents`,
      date: logDate,
      updatedBy: payload.updatedBy,
      documents: payload.documents,
      note: payload.note
    };

    // Safely push into the logs array
    if (!(meetingMins as any).logs) {
      (meetingMins as any).logs = [];
    }
    (meetingMins as any).logs.push(newLog);
    
    // Tell Mongoose the logs array was modified
    meetingMins.markModified('logs');
  }

  // 2. Update the nextMeetingDate for the future (only if passed in the payload)
  if ('nextMeetingDate' in payload) {
    (meetingMins as any).nextMeetingDate = payload.nextMeetingDate;
    
    // Explicitly mark as modified to force Mongoose to save the Date/String change
    meetingMins.markModified('nextMeetingDate');
  }

  // 3. Update any other standard fields safely
  Object.keys(payload).forEach((key) => {
    // Also exclude "note" here so it doesn't get written to the root document
    if (!["nextMeetingDate", "logs", "documents", "updatedBy", "note"].includes(key)) {
      (meetingMins as any)[key] = (payload as any)[key];
    }
  });

  // 4. Save and return
  const result = await meetingMins.save();
  return result;
};

const getUnacknowledgedMeetingsFromDB = async (
  employeeId: string,
  query: Record<string, unknown> = {}
) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const aggregateResult = await MeetingMins.aggregate([
    {
      $match: {
        employeeId: new mongoose.Types.ObjectId(employeeId),
      },
    },
    {
      $addFields: {
        latestLog: { $arrayElemAt: ["$logs", -1] },
      },
    },
    {
      $match: {
        latestLog: { $exists: true, $ne: null },
        // Only include if the latest log actually has documents
        $expr: { $gt: [{ $size: { $ifNull: ["$latestLog.documents", []] } }, 0] },
        "latestLog.Acknowledgement": { $ne: new mongoose.Types.ObjectId(employeeId) },
      },
    },
    {
      $project: { _id: 1 },
    },
  ]);

  const meetingIds = aggregateResult.map((doc) => doc._id);
  const total = meetingIds.length;

  const unacknowledgedMeetings = await MeetingMins.find({ _id: { $in: meetingIds } })
    .populate("logs.updatedBy", "firstName lastName initial name")
    .populate({
      path: "employeeId",
      select: "firstName lastName initial name designationId",
      populate: { path: "designationId", select: "title" },
    })
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    data: unacknowledgedMeetings,
  };
};



const acknowledgeMeetingLogIntoDB = async (payload: {
  meetingId: string;
  logId: string;
  employeeId: string;
}) => {
  const { meetingId, logId, employeeId } = payload;

  // 1. Find the meeting document
  const meetingMins = await MeetingMins.findById(meetingId);

  if (!meetingMins) {
    throw new AppError(httpStatus.NOT_FOUND, "Meeting minutes not found");
  }

  if (!meetingMins.logs || meetingMins.logs.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, "No logs exist for this meeting.");
  }

  // 2. Find the index of the specific log using logId
  const targetLogIndex = meetingMins.logs.findIndex(
    (log: any) => log._id.toString() === logId.toString()
  );

  if (targetLogIndex === -1) {
    throw new AppError(httpStatus.NOT_FOUND, "Specific meeting log not found");
  }

  const targetLog = meetingMins.logs[targetLogIndex];

  // 3. Initialize Acknowledgement array if it somehow doesn't exist
  if (!targetLog.Acknowledgement) {
    targetLog.Acknowledgement = [];
  }

  // 4. Check if the employee has already acknowledged this specific log
  const hasAcknowledged = targetLog.Acknowledgement.some(
    (id: any) => id.toString() === employeeId.toString()
  );

  if (hasAcknowledged) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You have already acknowledged this meeting update."
    );
  }

  // 5. Push the employeeId to the target log's Acknowledgement array
  targetLog.Acknowledgement.push(employeeId as any);

  // 6. Tell mongoose the exact subdocument array index that has been modified
  meetingMins.markModified(`logs.${targetLogIndex}.Acknowledgement`);

  // 7. Save and return
  const result = await meetingMins.save();
  return result;
};

const uploadDocumentsToMeetingLogIntoDB = async (payload: {
  meetingId: string;
  logId: string;
  documents: string[];
}) => {
  const { meetingId, logId, documents } = payload;

  // 1. Find the meeting document
  const meetingMins = await MeetingMins.findById(meetingId);

  if (!meetingMins) {
    throw new AppError(httpStatus.NOT_FOUND, "Meeting minutes not found");
  }

  if (!meetingMins.logs || meetingMins.logs.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, "No logs exist for this meeting.");
  }

  // 2. Find the index of the specific log using logId
  const targetLogIndex = meetingMins.logs.findIndex(
    (log: any) => log._id.toString() === logId.toString()
  );

  if (targetLogIndex === -1) {
    throw new AppError(httpStatus.NOT_FOUND, "Specific meeting log not found");
  }

  const targetLog = meetingMins.logs[targetLogIndex];

  // 3. Initialize documents array if it somehow doesn't exist
  if (!targetLog.documents) {
    targetLog.documents = [];
  }

  // 4. Push the new documents to the target log's documents array
  targetLog.documents.push(...documents);

  // 5. Tell mongoose the exact subdocument array index that has been modified
  meetingMins.markModified(`logs.${targetLogIndex}.documents`);

  // 6. Save and return
  const result = await meetingMins.save();
  return result;
};

export const MeetingMinsServices = {
  getAllMeetingMinsFromDB,
  getSingleMeetingMinsFromDB,
  createMeetingMinsIntoDB,
  updateMeetingMinsIntoDB,
  getUnacknowledgedMeetingsFromDB,
  acknowledgeMeetingLogIntoDB,
  uploadDocumentsToMeetingLogIntoDB
};