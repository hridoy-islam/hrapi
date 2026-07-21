import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { Supervision } from "./supervision.model";
import { TSupervision } from "./supervision.interface";
import { SupervisionSearchableFields } from "./supervision.constant";
import { User } from "../user/user.model";
import { ScheduleCheck } from "../scheduleCheck/scheduleCheck.model";
import moment from '../../utils/moment-setup';

const getAllSupervisionFromDB = async (query: Record<string, unknown>) => {
  const SupervisionQuery = new QueryBuilder(Supervision.find().populate("logs.updatedBy", "firstName lastName initial name"), query)
    .search(SupervisionSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await SupervisionQuery.countTotal();
  const result = await SupervisionQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleSupervisionFromDB = async (id: string) => {
  const result = await Supervision.findById(id);
  return result;
};

const updateSupervisionIntoDB = async (
  id: string,
  payload: Partial<TSupervision> & { updatedBy?: string; document?: string; note?: string }
) => {
  const supervision = await Supervision.findById(id);
  if (!supervision) {
    throw new AppError(httpStatus.NOT_FOUND, "Supervision record not found");
  }

  const { updatedBy, document, note, ...updateData } = payload;

  const logsToAdd: any[] = [];

  const areDatesEqual = (date1: Date | null | undefined, date2: Date | null | undefined) => {
    if (!date1 && !date2) return true;
    if (!date1 || !date2) return false;
    return moment(date1).isSame(moment(date2), 'day');
  };

  // Log scheduledDate change
  if (updateData.scheduledDate && !areDatesEqual(updateData.scheduledDate, supervision.scheduledDate)) {
    const oldDate = supervision.scheduledDate
      ? moment(supervision.scheduledDate).format("DD MMM YYYY")
      : "N/A";
    const newDate = moment(updateData.scheduledDate).format("DD MMM YYYY");

    logsToAdd.push({
      title: `Supervision scheduled date updated from ${oldDate} to ${newDate}`,
      date: new Date(),
      updatedBy,
      document: Array.isArray(document) ? document : [],
      note: note || "",
      scheduledDate: updateData.scheduledDate,
      completionDate: supervision.completionDate || null,
    });
  }

  // Handle completion
  if (updateData.completionDate !== undefined) {
    if (updateData.completionDate) {
      // Real completion — log it and calculate next schedule date
      const newLogEntry = {
        title: `Supervision scheduled for ${moment(supervision.scheduledDate).format("DD MMM YYYY")} completed on ${moment(updateData.completionDate).format("DD MMM YYYY")}`,
        date: new Date(),
        updatedBy,
        document: Array.isArray(document) ? document : [],
        note: note || "",
        scheduledDate: supervision.scheduledDate,
        completionDate: updateData.completionDate,
      };
      logsToAdd.push(newLogEntry);

      supervision.sessionNote = "";

      const employee = await User.findById(supervision.employeeId);
      let durationToAdd = 30;

      if (employee?.company) {
        const scheduleSettings = await ScheduleCheck.findOne({
          companyId: employee.company,
        });

        if (scheduleSettings && scheduleSettings.supervisionDuration > 0) {
          durationToAdd = scheduleSettings.supervisionDuration;
        }
      }

      supervision.scheduledDate = moment(supervision.scheduledDate)
        .add(durationToAdd, "days")
        .toDate();
    } else {
      // Clearing completion date — use payload scheduledDate
      if (updateData.scheduledDate) {
        supervision.scheduledDate = updateData.scheduledDate;
      }
    }

    supervision.completionDate = updateData.completionDate;
  } else {
    if (note !== undefined) {
      supervision.sessionNote = note;
    }
    if (updateData.scheduledDate) {
      supervision.scheduledDate = updateData.scheduledDate;
    }
  }

  // Handle isClosed toggle
  if (updateData.isClosed !== undefined && updateData.isClosed !== supervision.isClosed) {
    const schedStr = moment(supervision.scheduledDate).format("DD MMM YYYY");
    const now = new Date();
    const actionLabel = updateData.isClosed ? 'closed' : 'opened';

    logsToAdd.push({
      title: `Supervision for ${schedStr} was ${actionLabel} on ${moment(now).format("DD MMM YYYY")}`,
      date: now,
      updatedBy,
      document: Array.isArray(document) ? document : [],
      note: note || "",
      scheduledDate: supervision.scheduledDate,
      completionDate: supervision.completionDate || null,
      action: updateData.isClosed ? 'close' : 'reopen',
      previousStatus: supervision.isClosed,
      newStatus: updateData.isClosed,
    });

    supervision.isClosed = updateData.isClosed;
  }

  // Push logs
  if (logsToAdd.length > 0) {
    supervision.logs.push(...logsToAdd);
  }

  // Apply other payload properties
  Object.keys(updateData).forEach(key => {
    if (key !== 'scheduledDate' && key !== 'completionDate' && key !== 'isClosed') {
      (supervision as any)[key] = (updateData as any)[key];
    }
  });

  const result = await supervision.save();
  return result;
};

const createSupervisionIntoDB = async (
  payload: Partial<TSupervision> & { updatedBy?: string; note?: string; document?: string }
) => {
  const { updatedBy, note, document, ...supervisionData } = payload;

  const scheduledDateStr = supervisionData.scheduledDate
    ? moment(supervisionData.scheduledDate).format("DD MMM YYYY")
    : "Not Set";

  const initialLog = {
    title: `Supervision Scheduled for ${scheduledDateStr}`,
    date: new Date(),
    updatedBy: updatedBy,
    document: Array.isArray(document) ? document : [],
    note: note || "",
    scheduledDate: supervisionData.scheduledDate || null,
    completionDate: supervisionData.completionDate || null,
  };

  const result = await Supervision.create({
    ...supervisionData,
    logs: [initialLog],
    sessionNote: note || "",
  });

  return result;
};

const updateSupervisionLogIntoDB = async (
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
  const supervision = await Supervision.findById(id);

  if (!supervision) {
    throw new AppError(httpStatus.NOT_FOUND, "Supervision record not found");
  }

  const log = (supervision.logs as any)?.id(logId);

  if (!log) {
    throw new AppError(httpStatus.NOT_FOUND, "Supervision log entry not found");
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
      log.title = `Supervision for ${schedStr} was ${actionLabel} on ${dateStr}`;
    }
  } else if (!log.action || log.action === 'update') {
    if (newCompleted && newCompleted !== oldCompleted) {
      log.title = `Supervision scheduled for ${schedStr} completed on ${newCompleted}`;
    } else if (newScheduled && newScheduled !== oldScheduled) {
      log.title = `Supervision scheduled date updated from ${oldScheduled || "N/A"} to ${newScheduled}`;
    }
  }

  const result = await supervision.save();
  return result;
};

export const SupervisionServices = {
  getAllSupervisionFromDB,
  getSingleSupervisionFromDB,
  updateSupervisionIntoDB,
  createSupervisionIntoDB,
  updateSupervisionLogIntoDB
  
};
