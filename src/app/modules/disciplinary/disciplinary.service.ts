import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { Disciplinary } from "./disciplinary.model";
import { TDisciplinary } from "./disciplinary.interface";
import { DisciplinarySearchableFields } from "./disciplinary.constant";
import moment from '../../utils/moment-setup';

const getAllDisciplinaryFromDB = async (query: Record<string, unknown>) => {
  const DisciplinaryQuery = new QueryBuilder(Disciplinary.find().populate("logs.updatedBy", "firstName lastName initial name"), query)
    .search(DisciplinarySearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await DisciplinaryQuery.countTotal();
  const result = await DisciplinaryQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleDisciplinaryFromDB = async (id: string) => {
  const result = await Disciplinary.findById(id);
  return result;
};

const updateDisciplinaryIntoDB = async (
  id: string,
  payload: Partial<TDisciplinary> & { updatedBy?: string; document?: string | string[]; note?: string }
) => {
  const disciplinary = await Disciplinary.findById(id);
  if (!disciplinary) {
    throw new AppError(httpStatus.NOT_FOUND, "Disciplinary record not found");
  }

  const { updatedBy, document, note, ...updateData } = payload;

  const logsToAdd: any[] = [];

  const getDocuments = (doc: any): string[] => {
    if (Array.isArray(doc)) return doc;
    if (typeof doc === 'string' && doc) return [doc];
    return [];
  };

  // Handle isClosed toggle
  if (updateData.isClosed !== undefined && updateData.isClosed !== disciplinary.isClosed) {
    const now = new Date();
    const actionLabel = updateData.isClosed ? 'closed' : 'opened';

    logsToAdd.push({
      title: `Disciplinary issue was ${actionLabel} on ${moment(now).format("DD MMM YYYY")}`,
      date: now,
      updatedBy,
      document: getDocuments(document),
      note: note || "",
      issueDeadline: disciplinary.issueDeadline || null,
      action: updateData.isClosed ? 'close' : 'reopen',
      previousStatus: disciplinary.isClosed,
      newStatus: updateData.isClosed,
    });

    disciplinary.isClosed = updateData.isClosed as boolean;
  }

  // Handle extendDate action
  if (updateData.action === 'extendDate') {
    const oldDate = disciplinary.issueDeadline
      ? moment(disciplinary.issueDeadline).format('DD/MM/YYYY')
      : "N/A";
    const newDateRaw = updateData.extendDeadline;
    const newDate = newDateRaw
      ? moment(newDateRaw).format('DD/MM/YYYY')
      : "N/A";

    logsToAdd.push({
      title: `Deadline extended from ${oldDate} to ${newDate}`,
      date: new Date(),
      updatedBy,
      document: getDocuments(document),
      note: note || "",
      issueDeadline: disciplinary.issueDeadline || null,
      extendDeadline: newDateRaw || null,
    });

    if (newDateRaw) {
      disciplinary.issueDeadline = newDateRaw as Date;
    }
  }

  // Handle resolved action
  else if (updateData.action === 'resolved') {
    const resolveDateStr = moment().format('DD MMM YYYY');
    logsToAdd.push({
      title: `Issue Resolved on ${resolveDateStr}`,
      date: new Date(),
      updatedBy,
      document: getDocuments(document),
      note: note || "",
    });

    disciplinary.issueDeadline = undefined as any;
    disciplinary.extendDeadline = undefined as any;
    disciplinary.action = undefined as any;
  }

  // Handle general updates (new issue or standard update)
  else if (updateData.issueDeadline && updateData.isClosed === undefined) {
    const deadlineStr = moment(updateData.issueDeadline).format('DD MMM YYYY');
    logsToAdd.push({
      title: `New Disciplinary Issue Created with deadline of ${deadlineStr}`,
      date: new Date(),
      updatedBy,
      document: getDocuments(document),
      note: note || "",
      issueDeadline: updateData.issueDeadline || null,
    });

    disciplinary.issueDeadline = updateData.issueDeadline as Date;
  }

  if (logsToAdd.length > 0) {
    disciplinary.logs.push(...logsToAdd);
  }

  const result = await disciplinary.save();
  return result;
};

const createDisciplinaryIntoDB = async (
  payload: Partial<TDisciplinary> & { updatedBy?: string; document?: string | string[]; note?: string }
) => {
  const { updatedBy, document, note, ...coreData } = payload;

  const getDocuments = (doc: any): string[] => {
    if (Array.isArray(doc)) return doc;
    if (typeof doc === 'string' && doc) return [doc];
    return [];
  };

  const deadlineStr = coreData.issueDeadline
    ? moment(coreData.issueDeadline).format('DD MMM YYYY')
    : 'No deadline set';

  const logsToCreate: any[] = [];

  const todayStr = moment().format('DD MMM YYYY');

  if (coreData.isClosed) {
    logsToCreate.push({
      title: `Disciplinary issue closed on ${todayStr}`,
      date: new Date(),
      updatedBy,
      document: getDocuments(document),
      note: note || "",
      issueDeadline: coreData.issueDeadline || null,
      action: 'close',
      previousStatus: false,
      newStatus: true,
    });
  } else if (deadlineStr) {
    logsToCreate.push({
      title: `New Disciplinary Issue Created with deadline of ${deadlineStr}`,
      date: new Date(),
      updatedBy,
      document: getDocuments(document),
      note: note || "",
      issueDeadline: coreData.issueDeadline || null,
    });
  } else {
    logsToCreate.push({
      title: `Disciplinary issue opened on ${todayStr}`,
      date: new Date(),
      updatedBy,
      document: getDocuments(document),
      note: note || "",
    });
  }

  const result = await Disciplinary.create({
    ...coreData,
    logs: logsToCreate,
  });

  return result;
};

const updateDisciplinaryLogIntoDB = async (
  id: string,
  logId: string,
  payload: {
    document?: string[];
    issueDeadline?: Date;
    extendDeadline?: Date;
    note?: string;
    date?: Date;
  }
) => {
  const disciplinary = await Disciplinary.findById(id);

  if (!disciplinary) {
    throw new AppError(httpStatus.NOT_FOUND, "Disciplinary record not found");
  }

  const log = (disciplinary.logs as any)?.id(logId);

  if (!log) {
    throw new AppError(httpStatus.NOT_FOUND, "Disciplinary log entry not found");
  }

  const oldDeadline = log.issueDeadline
    ? moment(log.issueDeadline).format("DD MMM YYYY")
    : null;
  const oldExtDeadline = log.extendDeadline
    ? moment(log.extendDeadline).format("DD MMM YYYY")
    : null;
  const oldDate = log.date
    ? moment(log.date).format("DD MMM YYYY")
    : null;

  const newDeadline = payload.issueDeadline
    ? moment(payload.issueDeadline).format("DD MMM YYYY")
    : null;
  const newExtDeadline = payload.extendDeadline
    ? moment(payload.extendDeadline).format("DD MMM YYYY")
    : null;
  const newDate = payload.date
    ? moment(payload.date).format("DD MMM YYYY")
    : null;

  if (payload.document !== undefined) log.document = payload.document;
  if (payload.issueDeadline !== undefined) log.issueDeadline = payload.issueDeadline;
  if (payload.extendDeadline !== undefined) log.extendDeadline = payload.extendDeadline;
  if (payload.note !== undefined) log.note = payload.note;
  if (payload.date !== undefined) log.date = payload.date;

  const dateStr = newDate || oldDate || moment(log.date).format("DD MMM YYYY");

  if (newDeadline !== oldDeadline) {
    if (newDeadline) {
      log.title = oldDeadline
        ? `Disciplinary resolution deadline updated from ${oldDeadline} to ${newDeadline}`
        : `Disciplinary resolution deadline set to ${newDeadline}`;
    } else {
      log.title = `Disciplinary resolution deadline removed (was ${oldDeadline || "not set"})`;
    }
  } else if (newExtDeadline !== oldExtDeadline) {
    if (newExtDeadline) {
      log.title = oldExtDeadline
        ? `Disciplinary extended deadline updated from ${oldExtDeadline} to ${newExtDeadline}`
        : `Disciplinary extended deadline set to ${newExtDeadline}`;
    } else {
      log.title = `Disciplinary extended deadline removed (was ${oldExtDeadline || "not set"})`;
    }
  } else if (log.action === 'close' || log.action === 'reopen') {
    const actionLabel = log.action === 'close' ? 'closed' : 'opened';
    const deadlineDate = newDeadline || oldDeadline;
    if (newDeadline !== oldDeadline || (newDate && newDate !== oldDate)) {
      log.title = deadlineDate
        ? `Disciplinary issue for ${deadlineDate} was ${actionLabel} on ${dateStr}`
        : `Disciplinary issue is ${actionLabel} on ${dateStr}`;
    }
  }

  const result = await disciplinary.save();
  return result;
};

export const DisciplinaryServices = {
  getAllDisciplinaryFromDB,
  getSingleDisciplinaryFromDB,
  updateDisciplinaryIntoDB,
  createDisciplinaryIntoDB,
  updateDisciplinaryLogIntoDB
  
};
