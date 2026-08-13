import httpStatus from "http-status";

import { Audit } from "./audit.model";
import { TAudit } from "./audit.interface";
import { AuditSearchableFields } from "./audit.constant";
import AppError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import moment from "../../utils/moment-setup";

const getDocuments = (doc: any): string[] => {
  if (Array.isArray(doc)) return doc;
  if (typeof doc === "string" && doc) return [doc];
  return [];
};

const getAllAuditFromDB = async (query: Record<string, unknown>) => {
  const filter: Record<string, unknown> = {};

  const { companyId, employeeId, serviceUserId, auditTypeId, status } = query;
  if (companyId) filter.companyId = companyId;
  if (employeeId) filter.employeeId = employeeId;
  if (serviceUserId) filter.serviceUserId = serviceUserId;
  if (auditTypeId) filter.auditTypeId = auditTypeId;

  if (query.fromDate || query.toDate) {
    const range: Record<string, Date> = {};
    if (query.fromDate) range.$gte = new Date(query.fromDate as string);
    if (query.toDate) range.$lte = new Date(query.toDate as string);
    filter.auditDate = range;
  }

  if (status === "active") {
    filter.status = "active";
  } else if (status === "completed") {
    filter.status = "completed";
  } else if (status === "due") {
    filter.status = { $ne: "completed" };
    filter.auditDate = {
      ...((filter.auditDate as Record<string, unknown>) || {}),
      $lt: moment().startOf("day").toDate(),
    };
  }

  const userQuery = new QueryBuilder(
    Audit.find(filter)
      .populate("auditTypeId", "title status")
      .populate("employeeId", "firstName lastName initial name")
      .populate("serviceUserId", "name room")
      .populate("logs.updatedBy", "firstName lastName initial name"),
    query
  )
    .search(AuditSearchableFields)
    .sort()
    .paginate()
    .fields();

  const meta = await userQuery.countTotal();
  const result = await userQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleAuditFromDB = async (id: string) => {
  const result = await Audit.findById(id)
    .populate("auditTypeId", "title status")
    .populate("employeeId", "firstName lastName initial name")
    .populate("serviceUserId", "name room")
    .populate("logs.updatedBy", "firstName lastName initial name");
  return result;
};

const createAuditIntoDB = async (
  payload: Partial<TAudit> & {
    updatedBy?: string;
    document?: string | string[];
    note?: string;
  }
) => {
  const { updatedBy, document, note, ...coreData } = payload;

  const auditDateStr = coreData.auditDate
    ? moment(coreData.auditDate).format("DD MMM YYYY")
    : "No audit date set";

  const logsToCreate: any[] = [
    {
      title: `New Audit created with audit date of ${auditDateStr}`,
      date: new Date(),
      updatedBy,
      document: getDocuments(document),
      note: note || "",
      auditDate: coreData.auditDate || null,
      action: "create",
    },
  ];

  try {
    const result = await Audit.create({
      ...coreData,
      note,
      document: getDocuments(document),
      status: "active",
      logs: logsToCreate,
    });
    return result;
  } catch (error: any) {
    console.error("Error in createAuditIntoDB:", error);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to create Audit"
    );
  }
};

const updateAuditIntoDB = async (
  id: string,
  payload: Partial<TAudit> & {
    updatedBy?: string;
    document?: string | string[];
    note?: string;
    title?: string;
  }
) => {
  const audit = await Audit.findById(id);

  if (!audit) {
    throw new AppError(httpStatus.NOT_FOUND, "Audit not found");
  }

  const { updatedBy, document, note, ...updateData } = payload;

  const logsToAdd: any[] = [];

  // Handle add log entry action
  if (updateData.action === "addLog") {
    const todayStr = moment().format("DD MMM YYYY");

    logsToAdd.push({
      title: (updateData.title as string) || `Log added on ${todayStr}`,
      date: new Date(),
      updatedBy,
      document: getDocuments(document),
      note: note || "",
      auditDate: audit.auditDate || null,
      action: "update",
    });
  }

  // Handle extend audit date action
  else if (updateData.action === "extendDate") {
    const oldDate = audit.auditDate
      ? moment(audit.auditDate).format("DD/MM/YYYY")
      : "N/A";
    const newDateRaw = updateData.auditDate;
    const newDate = newDateRaw
      ? moment(newDateRaw).format("DD/MM/YYYY")
      : "N/A";

    logsToAdd.push({
      title: `Audit date extended from ${oldDate} to ${newDate}`,
      date: new Date(),
      updatedBy,
      document: getDocuments(document),
      note: note || "",
      auditDate: audit.auditDate || null,
      extendDeadline: newDateRaw || null,
      action: "extend",
    });

    if (newDateRaw) {
      audit.auditDate = newDateRaw as Date;
    }
    audit.action = undefined as any;
    if (note !== undefined) {
      audit.note = note as string;
    }
    if (getDocuments(document).length > 0) {
      audit.document = [...(audit.document || []), ...getDocuments(document)];
    }
  }

  // Handle edit note/documents action
  else if (updateData.action === "editDetails") {
    const todayStr = moment().format("DD MMM YYYY");

    logsToAdd.push({
      title: `Audit details updated on ${todayStr}`,
      date: new Date(),
      updatedBy,
      document: getDocuments(document),
      note: note || "",
      auditDate: audit.auditDate || null,
      action: "update",
    });

    if (note !== undefined) {
      audit.note = note as string;
    }
    if (document !== undefined) {
      audit.document = getDocuments(document);
    }
    audit.action = undefined as any;
  }

  // Handle complete action
  else if (updateData.action === "complete") {
    const todayStr = moment().format("DD MMM YYYY");

    logsToAdd.push({
      title: `Audit completed on ${todayStr}`,
      date: new Date(),
      updatedBy,
      document: getDocuments(document),
      note: note || "",
      auditDate: audit.auditDate || null,
      action: "complete",
    });

    audit.status = "completed";
    audit.action = undefined as any;
  }

  // Handle general updates (new audit date)
  else if (updateData.auditDate && audit.status !== "completed") {
    const dateStr = moment(updateData.auditDate).format("DD MMM YYYY");

    logsToAdd.push({
      title: `Audit date set to ${dateStr}`,
      date: new Date(),
      updatedBy,
      document: getDocuments(document),
      note: note || "",
      auditDate: updateData.auditDate || null,
      action: "update",
    });

    audit.auditDate = updateData.auditDate as Date;
  }

  if (logsToAdd.length > 0) {
    audit.logs.push(...logsToAdd);
  }

  const result = await audit.save();
  return result;
};

const updateAuditLogIntoDB = async (
  id: string,
  logId: string,
  payload: {
    document?: string[];
    auditDate?: Date;
    extendDeadline?: Date;
    note?: string;
    date?: Date;
  }
) => {
  const audit = await Audit.findById(id);

  if (!audit) {
    throw new AppError(httpStatus.NOT_FOUND, "Audit not found");
  }

  const log = (audit.logs as any)?.id(logId);

  if (!log) {
    throw new AppError(httpStatus.NOT_FOUND, "Audit log entry not found");
  }

  const oldAuditDate = log.auditDate
    ? moment(log.auditDate).format("DD MMM YYYY")
    : null;
  const oldExtDeadline = log.extendDeadline
    ? moment(log.extendDeadline).format("DD MMM YYYY")
    : null;
  const oldDate = log.date ? moment(log.date).format("DD MMM YYYY") : null;

  const newAuditDate = payload.auditDate
    ? moment(payload.auditDate).format("DD MMM YYYY")
    : null;
  const newExtDeadline = payload.extendDeadline
    ? moment(payload.extendDeadline).format("DD MMM YYYY")
    : null;
  const newDate = payload.date ? moment(payload.date).format("DD MMM YYYY") : null;

  if (payload.document !== undefined) log.document = payload.document;
  if (payload.auditDate !== undefined) log.auditDate = payload.auditDate;
  if (payload.extendDeadline !== undefined)
    log.extendDeadline = payload.extendDeadline;
  if (payload.note !== undefined) log.note = payload.note;
  if (payload.date !== undefined) log.date = payload.date;

  const dateStr = newDate || oldDate || moment(log.date).format("DD MMM YYYY");

  if (newAuditDate !== oldAuditDate) {
    if (newAuditDate) {
      log.title = oldAuditDate
        ? `Audit date updated from ${oldAuditDate} to ${newAuditDate}`
        : `Audit date set to ${newAuditDate}`;
    } else {
      log.title = `Audit date removed (was ${oldAuditDate || "not set"})`;
    }
  } else if (newExtDeadline !== oldExtDeadline) {
    if (newExtDeadline) {
      log.title = oldExtDeadline
        ? `Audit extended deadline updated from ${oldExtDeadline} to ${newExtDeadline}`
        : `Audit extended deadline set to ${newExtDeadline}`;
    } else {
      log.title = `Audit extended deadline removed (was ${
        oldExtDeadline || "not set"
      })`;
    }
  } else if (newDate && newDate !== oldDate) {
    log.title = `Audit updated on ${dateStr}`;
  }

  const result = await audit.save();
  return result;
};

const deleteAuditFromDB = async (id: string) => {
  const audit = await Audit.findById(id);

  if (!audit) {
    throw new AppError(httpStatus.NOT_FOUND, "Audit not found");
  }

  await Audit.findByIdAndDelete(id);

  return { message: "Audit deleted successfully" };
};

export const AuditServices = {
  getAllAuditFromDB,
  getSingleAuditFromDB,
  updateAuditIntoDB,
  createAuditIntoDB,
  updateAuditLogIntoDB,
  deleteAuditFromDB,
};
