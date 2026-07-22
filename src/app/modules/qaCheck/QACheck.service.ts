import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { QACheck } from "./QACheck.model";
import { TQACheck } from "./QACheck.interface";
import { QACheckSearchableFields } from "./QACheck.constant";
import { User } from "../user/user.model";
import moment from '../../utils/moment-setup';
import { ScheduleCheck } from "../scheduleCheck/scheduleCheck.model";

const getAllQACheckFromDB = async (query: Record<string, unknown>) => {
  const QACheckQuery = new QueryBuilder(QACheck.find().populate("logs.updatedBy", "firstName lastName initial name"), query)
    .search(QACheckSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await QACheckQuery.countTotal();
  const result = await QACheckQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleQACheckFromDB = async (id: string) => {
  const result = await QACheck.findById(id);
  return result;
};

const updateQACheckIntoDB = async (
  id: string,
  payload: Partial<TQACheck> & { updatedBy?: string; document?: string; note?: string }
) => {
  const qaCheck = await QACheck.findById(id);
  if (!qaCheck) {
    throw new AppError(httpStatus.NOT_FOUND, "QA Check not found");
  }

  const { updatedBy, document, note, ...updateData } = payload;

  const logsToAdd: any[] = [];

  const areDatesEqual = (date1: Date | null | undefined, date2: Date | null | undefined) => {
    if (!date1 && !date2) return true;
    if (!date1 || !date2) return false;
    return moment(date1).isSame(moment(date2), 'day');
  };

  // Log scheduledDate change
  if (updateData.scheduledDate !== undefined && !areDatesEqual(updateData.scheduledDate, qaCheck.scheduledDate)) {
    const oldDate = qaCheck.scheduledDate
      ? moment(qaCheck.scheduledDate).format("DD MMM YYYY")
      : "N/A";
    const newDate = updateData.scheduledDate
      ? moment(updateData.scheduledDate).format("DD MMM YYYY")
      : null;

    logsToAdd.push({
      title: newDate
        ? qaCheck.scheduledDate
          ? `QA Check scheduled date updated from ${oldDate} to ${newDate}`
          : `QA Check Scheduled for ${newDate}`
        : `QA Check scheduled date removed (was ${oldDate})`,
      date: new Date(),
      updatedBy,
      document: Array.isArray(document) ? document : [],
      note: note || "",
      scheduledDate: updateData.scheduledDate || null,
      completionDate: qaCheck.completionDate || null,
    });
  }

  // Handle completion
  if (updateData.completionDate !== undefined) {
    if (updateData.completionDate) {
      // Real completion — log it and calculate next schedule date
      const schedDateStrCompletion = qaCheck.scheduledDate
        ? moment(qaCheck.scheduledDate).format("DD MMM YYYY")
        : null;
      const newLogEntry = {
        title: schedDateStrCompletion
          ? `QA Check scheduled for ${schedDateStrCompletion} completed on ${moment(updateData.completionDate).format("DD MMM YYYY")}`
          : `QA Check completed on ${moment(updateData.completionDate).format("DD MMM YYYY")}`,
        date: new Date(),
        updatedBy,
        document: Array.isArray(document) ? document : [],
        note: note || "",
        scheduledDate: qaCheck.scheduledDate,
        completionDate: updateData.completionDate,
      };
      logsToAdd.push(newLogEntry);

      qaCheck.QACheckNote = "";

      const employee = await User.findById(qaCheck.employeeId);
      let durationToAdd = 30;

      if (employee?.company) {
        const scheduleSettings = await ScheduleCheck.findOne({
          companyId: employee.company,
        });

        if (scheduleSettings && scheduleSettings.qaCheckDuration > 0) {
          durationToAdd = scheduleSettings.qaCheckDuration;
        }
      }

      qaCheck.scheduledDate = moment(qaCheck.scheduledDate)
        .add(durationToAdd, "days")
        .toDate();
    } else {
      // Clearing completion date — use payload scheduledDate
      if (updateData.scheduledDate) {
        qaCheck.scheduledDate = updateData.scheduledDate;
      }
    }

    qaCheck.completionDate = updateData.completionDate;
  } else {
    if (note !== undefined) {
      qaCheck.QACheckNote = note;
    }
    if (updateData.scheduledDate) {
      qaCheck.scheduledDate = updateData.scheduledDate;
    }
  }

  // Handle isClosed toggle
  if (updateData.isClosed !== undefined && updateData.isClosed !== qaCheck.isClosed) {
    const schedDate = qaCheck.scheduledDate
      ? moment(qaCheck.scheduledDate).format("DD MMM YYYY")
      : null;
    const now = new Date();
    const actionLabel = updateData.isClosed ? 'closed' : 'opened';

    logsToAdd.push({
      title: schedDate
        ? `QA Check for ${schedDate} was ${actionLabel} on ${moment(now).format("DD MMM YYYY")}`
        : `QA Check is ${actionLabel} on ${moment(now).format("DD MMM YYYY")}`,
      date: now,
      updatedBy,
      document: Array.isArray(document) ? document : [],
      note: note || "",
      scheduledDate: qaCheck.scheduledDate,
      completionDate: qaCheck.completionDate || null,
      action: updateData.isClosed ? 'close' : 'reopen',
      previousStatus: qaCheck.isClosed,
      newStatus: updateData.isClosed,
    });

    qaCheck.isClosed = updateData.isClosed;
  }

  // Push logs
  if (logsToAdd.length > 0) {
    qaCheck.logs.push(...logsToAdd);
  }

  // Apply other payload properties
  Object.keys(updateData).forEach(key => {
    if (key !== 'scheduledDate' && key !== 'completionDate' && key !== 'isClosed') {
      (qaCheck as any)[key] = (updateData as any)[key];
    }
  });

  const result = await qaCheck.save();
  return result;
};


const createQACheckIntoDB = async (
  payload: Partial<TQACheck> & { updatedBy?: string; note?: string; document?: string }
) => {
  const { updatedBy, note, document, ...QACheckData } = payload;

  const scheduledDateStr = QACheckData.scheduledDate
    ? moment(QACheckData.scheduledDate).format("DD MMM YYYY")
    : null;

  const todayStr = moment().format("DD MMM YYYY");

  const logsToCreate: any[] = [];

  if (QACheckData.isClosed && scheduledDateStr) {
    logsToCreate.push({
      title: `QA Check Scheduled for ${scheduledDateStr}`,
      date: new Date(),
      updatedBy: updatedBy,
      document: Array.isArray(document) ? document : [],
      note: note || "",
      scheduledDate: QACheckData.scheduledDate,
      completionDate: QACheckData.completionDate || null,
    });
    logsToCreate.push({
      title: `QA Check closed on ${todayStr}`,
      date: new Date(),
      updatedBy: updatedBy,
      document: Array.isArray(document) ? document : [],
      note: note || "",
      scheduledDate: QACheckData.scheduledDate,
      completionDate: QACheckData.completionDate || null,
    });
  } else if (QACheckData.isClosed) {
    logsToCreate.push({
      title: `QA Check closed on ${todayStr}`,
      date: new Date(),
      updatedBy: updatedBy,
      document: Array.isArray(document) ? document : [],
      note: note || "",
      scheduledDate: QACheckData.scheduledDate || null,
      completionDate: QACheckData.completionDate || null,
    });
  } else if (scheduledDateStr) {
    logsToCreate.push({
      title: `QA Check Scheduled for ${scheduledDateStr}`,
      date: new Date(),
      updatedBy: updatedBy,
      document: Array.isArray(document) ? document : [],
      note: note || "",
      scheduledDate: QACheckData.scheduledDate,
      completionDate: QACheckData.completionDate || null,
    });
  } else {
    logsToCreate.push({
      title: `QA Check opened on ${todayStr}`,
      date: new Date(),
      updatedBy: updatedBy,
      document: Array.isArray(document) ? document : [],
      note: note || "",
      scheduledDate: null,
      completionDate: QACheckData.completionDate || null,
    });
  }

  const result = await QACheck.create({
    ...QACheckData,
    logs: logsToCreate,
    QACheckNote: note || "", 
  });

  return result;
};


const updateQACheckLogIntoDB = async (
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
  const qaCheck = await QACheck.findById(id);

  if (!qaCheck) {
    throw new AppError(httpStatus.NOT_FOUND, "QA Check record not found");
  }

  const log = (qaCheck.logs as any)?.id(logId);

  if (!log) {
    throw new AppError(httpStatus.NOT_FOUND, "QA Check log entry not found");
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

  const dateStr = newDate || oldDate || moment(log.date).format("DD MMM YYYY");

  // Auto-generate title when dates change
  if (newCompleted !== oldCompleted) {
    const schedDate = newScheduled || oldScheduled;
    if (newCompleted) {
      log.title = schedDate
        ? `QA Check scheduled for ${schedDate} completed on ${newCompleted}`
        : `QA Check completed on ${newCompleted}`;
    } else {
      log.title = schedDate
        ? `QA Check completion date removed for ${schedDate}`
        : `QA Check completion date removed`;
    }
  } else if (log.action === 'close' || log.action === 'reopen') {
    const actionLabel = log.action === 'close' ? 'closed' : 'opened';
    const schedDate = newScheduled || oldScheduled;
    if (newScheduled !== oldScheduled || (newDate && newDate !== oldDate)) {
      log.title = schedDate
        ? `QA Check for ${schedDate} was ${actionLabel} on ${dateStr}`
        : `QA Check is ${actionLabel} on ${dateStr}`;
    }
  } else if (!log.action || log.action === 'update') {
    if (newScheduled !== oldScheduled) {
      if (newScheduled) {
        log.title = oldScheduled
          ? `QA Check scheduled date updated from ${oldScheduled} to ${newScheduled}`
          : `QA Check scheduled date set to ${newScheduled}`;
      } else {
        log.title = `QA Check scheduled date removed (was ${oldScheduled || "not set"})`;
      }
    }
  }

  const result = await qaCheck.save();
  return result;
};




export const QACheckServices = {
  getAllQACheckFromDB,
  getSingleQACheckFromDB,
  updateQACheckIntoDB,
  createQACheckIntoDB,
  updateQACheckLogIntoDB
  
};
