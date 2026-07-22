import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { SpotCheck } from "./spotCheck.model";
import { TSpotCheck } from "./spotCheck.interface";
import { SpotCheckSearchableFields } from "./spotCheck.constant";
import { User } from "../user/user.model";
import moment from '../../utils/moment-setup';
import { ScheduleCheck } from "../scheduleCheck/scheduleCheck.model";

const getAllSpotCheckFromDB = async (query: Record<string, unknown>) => {
  const SpotCheckQuery = new QueryBuilder(SpotCheck.find().populate("logs.updatedBy", "firstName lastName initial name"), query)
    .search(SpotCheckSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await SpotCheckQuery.countTotal();
  const result = await SpotCheckQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleSpotCheckFromDB = async (id: string) => {
  const result = await SpotCheck.findById(id);
  return result;
};

const updateSpotCheckIntoDB = async (
  id: string,
  payload: Partial<TSpotCheck> & { updatedBy?: string; document?: string; note?: string }
) => {
  const spotCheck = await SpotCheck.findById(id);
  if (!spotCheck) {
    throw new AppError(httpStatus.NOT_FOUND, "SpotCheck not found");
  }

  const { updatedBy, document, note, ...updateData } = payload;

  const logsToAdd: any[] = [];

  const areDatesEqual = (date1: Date | null | undefined, date2: Date | null | undefined) => {
    if (!date1 && !date2) return true;
    if (!date1 || !date2) return false;
    return moment(date1).isSame(moment(date2), 'day');
  };

  // Log scheduledDate change
  if (updateData.scheduledDate && !areDatesEqual(updateData.scheduledDate, spotCheck.scheduledDate)) {
    const oldDate = spotCheck.scheduledDate
      ? moment(spotCheck.scheduledDate).format("DD MMM YYYY")
      : "N/A";
    const newDate = moment(updateData.scheduledDate).format("DD MMM YYYY");

    logsToAdd.push({
      title: `Spot Check scheduled date updated from ${oldDate} to ${newDate}`,
      date: new Date(),
      updatedBy,
      document: Array.isArray(document) ? document : [],
      note: note || "",
      scheduledDate: updateData.scheduledDate,
      completionDate: spotCheck.completionDate || null,
    });
  }

  // Handle completion
  if (updateData.completionDate !== undefined) {
    if (updateData.completionDate) {
      const newLogEntry = {
        title: `Spot Check completed for ${moment(spotCheck.scheduledDate).format("DD MMM YYYY")} completed on ${moment(updateData.completionDate).format("DD MMM YYYY")}`,
        date: new Date(),
        updatedBy,
        document: Array.isArray(document) ? document : [],
        note: note || "",
        scheduledDate: spotCheck.scheduledDate,
        completionDate: updateData.completionDate,
      };
      logsToAdd.push(newLogEntry);

      spotCheck.spotCheckNote = "";

      const employee = await User.findById(spotCheck.employeeId);
      let durationToAdd = 30;

      if (employee && employee.company) {
        const scheduleSettings = await ScheduleCheck.findOne({
          companyId: employee.company,
        });

        if (scheduleSettings && scheduleSettings.spotCheckDuration > 0) {
          durationToAdd = scheduleSettings.spotCheckDuration;
        }
      }

      spotCheck.scheduledDate = moment(spotCheck.scheduledDate)
        .add(durationToAdd, "days")
        .toDate();
    } else {
      if (updateData.scheduledDate) {
        spotCheck.scheduledDate = updateData.scheduledDate;
      }
    }

    spotCheck.completionDate = updateData.completionDate;
  } else {
    if (note !== undefined) {
      spotCheck.spotCheckNote = note;
    }
    if (updateData.scheduledDate) {
      spotCheck.scheduledDate = updateData.scheduledDate;
    }
  }

  // Handle isClosed toggle
  if (updateData.isClosed !== undefined && updateData.isClosed !== spotCheck.isClosed) {
    const schedStr = moment(spotCheck.scheduledDate).format("DD MMM YYYY");
    const now = new Date();
    const actionLabel = updateData.isClosed ? 'closed' : 'opened';

    logsToAdd.push({
      title: `Spot Check for ${schedStr} was ${actionLabel} on ${moment(now).format("DD MMM YYYY")}`,
      date: now,
      updatedBy,
      document: Array.isArray(document) ? document : [],
      note: note || "",
      scheduledDate: spotCheck.scheduledDate,
      completionDate: spotCheck.completionDate || null,
      action: updateData.isClosed ? 'close' : 'reopen',
      previousStatus: spotCheck.isClosed,
      newStatus: updateData.isClosed,
    });

    spotCheck.isClosed = updateData.isClosed;
  }

  // Push logs
  if (logsToAdd.length > 0) {
    spotCheck.logs.push(...logsToAdd);
  }

  // Apply other payload properties
  Object.keys(updateData).forEach(key => {
    if (key !== 'scheduledDate' && key !== 'completionDate' && key !== 'isClosed') {
      (spotCheck as any)[key] = (updateData as any)[key];
    }
  });

  const result = await spotCheck.save();
  return result;
};


const createSpotCheckIntoDB = async (
  payload: Partial<TSpotCheck> & { updatedBy?: string; note?: string; document?: string }
) => {
  const { updatedBy, note, document, ...spotCheckData } = payload;

  // 1. Prepare Initial Log
  const scheduledDateStr = spotCheckData.scheduledDate
    ? moment(spotCheckData.scheduledDate).format("DD MMM YYYY")
    : "Not Set";

  const initialLog = {
    title: `Spot Check Scheduled for ${scheduledDateStr}`,
    date: new Date(),
    updatedBy: updatedBy,
    document: !document ? [] : Array.isArray(document) ? document : [document],
    note: note || "",
    scheduledDate: spotCheckData.scheduledDate || null,
    completionDate: spotCheckData.completionDate || null,
  };

  // 2. Create Record with Log
  const result = await SpotCheck.create({
    ...spotCheckData,
    logs: [initialLog],
    spotCheckNote: note || "",
  });

  return result;
};


const updateSpotCheckLogIntoDB = async (
  id: string,
  logId: string,
  payload: {
    document?: string[];
    scheduledDate?: Date;
    completionDate?: Date;
    note?: string;
    date?: Date;
  }
) => {
  const spotCheck = await SpotCheck.findById(id);

  if (!spotCheck) {
    throw new AppError(httpStatus.NOT_FOUND, "Spot check record not found");
  }

  const log = (spotCheck.logs as any)?.id(logId);

  if (!log) {
    throw new AppError(httpStatus.NOT_FOUND, "Spot check log entry not found");
  }

  // Capture old values BEFORE overwriting with payload
  const oldScheduled = log.scheduledDate
    ? moment(log.scheduledDate).format("DD MMM YYYY")
    : null;
  const oldCompleted = log.completionDate
    ? moment(log.completionDate).format("DD MMM YYYY")
    : null;
  const oldDate = log.date
    ? moment(log.date).format("DD MMM YYYY")
    : null;

  const newScheduled = payload.scheduledDate
    ? moment(payload.scheduledDate).format("DD MMM YYYY")
    : null;
  const newCompleted = payload.completionDate
    ? moment(payload.completionDate).format("DD MMM YYYY")
    : null;
  const newDate = payload.date
    ? moment(payload.date).format("DD MMM YYYY")
    : null;

  if (payload.document !== undefined) log.document = payload.document;
  if (payload.scheduledDate !== undefined) log.scheduledDate = payload.scheduledDate;
  if (payload.completionDate !== undefined) log.completionDate = payload.completionDate;
  if (payload.note !== undefined) log.note = payload.note;
  if (payload.date !== undefined) log.date = payload.date;

  const schedStr = newScheduled || oldScheduled || "N/A";
  const dateStr = newDate || oldDate || moment(log.date).format("DD MMM YYYY");

  // Auto-generate title when dates change
  if (log.action === 'close' || log.action === 'reopen') {
    const actionLabel = log.action === 'close' ? 'closed' : 'opened';
    if ((newScheduled && newScheduled !== oldScheduled) || (newDate && newDate !== oldDate)) {
      log.title = `Spot Check for ${schedStr} was ${actionLabel} on ${dateStr}`;
    }
  } else if (!log.action || log.action === 'update') {
    if (newCompleted && newCompleted !== oldCompleted) {
      log.title = `Spot Check scheduled for ${schedStr} completed on ${newCompleted}`;
    } else if (newScheduled && newScheduled !== oldScheduled) {
      log.title = `Spot Check scheduled date updated from ${oldScheduled || "N/A"} to ${newScheduled}`;
    }
  }

  const result = await spotCheck.save();
  return result;
};

export const SpotCheckServices = {
  getAllSpotCheckFromDB,
  getSingleSpotCheckFromDB,
  updateSpotCheckIntoDB,
  createSpotCheckIntoDB,
  updateSpotCheckLogIntoDB
  
};
