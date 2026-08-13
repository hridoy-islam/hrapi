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
    filter.$or = [
      { nextCheckDate: range },
      { nextCheckDate: { $exists: false } },
      { nextCheckDate: null },
    ];
  }

  if (status === "active") {
    filter.status = "active";
  } else if (status === "completed") {
    filter.status = "completed";
  } else if (status === "due") {
    filter.status = { $ne: "completed" };
    filter.nextCheckDate = {
      ...((filter.nextCheckDate as Record<string, unknown>) || {}),
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
  const nextCheckDateStr = coreData.nextCheckDate
    ? moment(coreData.nextCheckDate).format("DD MMM YYYY")
    : "No next check date set";

  const logEntry: any = {
    title: `Audit created with audit date of ${auditDateStr}`,
    date: new Date(),
    updatedBy,
    document: getDocuments(document),
    note: note || "",
    auditDate: coreData.auditDate || null,
    action: "create",
  };

  if (coreData.nextCheckDate) {
    logEntry.nextCheckDate = coreData.nextCheckDate;
    logEntry.title = `Audit created with audit date of ${auditDateStr} and next check date of ${nextCheckDateStr}`;
  }

  const logsToCreate: any[] = [logEntry];

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
      nextCheckDate: audit.nextCheckDate || null,
      action: "update",
    });
  }

  // Handle extend next check date action
  else if (updateData.action === "extendDate") {
    const oldDate = audit.nextCheckDate
      ? moment(audit.nextCheckDate).format("DD/MM/YYYY")
      : "N/A";
    const newDateRaw = updateData.nextCheckDate;
    const newDate = newDateRaw
      ? moment(newDateRaw).format("DD/MM/YYYY")
      : "N/A";

    logsToAdd.push({
      title: `Audit check date extended from ${oldDate} to ${newDate}`,
      date: new Date(),
      updatedBy,
      document: getDocuments(document),
      note: note || "",
      auditDate: audit.auditDate || null,
      nextCheckDate: newDateRaw || null,
      extendDeadline: newDateRaw || null,
      action: "extend",
    });

    if (newDateRaw) {
      audit.nextCheckDate = newDateRaw as Date;
    }
    audit.action = undefined as any;
    if (note !== undefined) {
      audit.note = note as string;
    }
    if (getDocuments(document).length > 0) {
      audit.document = [...(audit.document || []), ...getDocuments(document)];
    }
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
      nextCheckDate: audit.nextCheckDate || null,
      action: "complete",
    });

    audit.status = "completed";
    audit.action = undefined as any;
  }

  // Handle general updates (audit details: type/employee/service user/dates/note/documents)
  else if (
    (updateData.auditDate ||
      updateData.nextCheckDate ||
      updateData.auditTypeId ||
      updateData.employeeId ||
      updateData.serviceUserId ||
      note !== undefined ||
      document !== undefined) &&
    audit.status !== "completed"
  ) {
    const changes: string[] = [];
    if (updateData.auditDate) {
      changes.push(
        `audit date set to ${moment(updateData.auditDate).format("DD MMM YYYY")}`
      );
      audit.auditDate = updateData.auditDate as Date;
    }
    if (updateData.nextCheckDate) {
      changes.push(
        `next check date set to ${moment(updateData.nextCheckDate).format(
          "DD MMM YYYY"
        )}`
      );
      audit.nextCheckDate = updateData.nextCheckDate as Date;
    }
    if (updateData.auditTypeId) {
      changes.push("audit type updated");
      audit.auditTypeId = updateData.auditTypeId as any;
    }
    if (updateData.employeeId) {
      changes.push("employee updated");
      audit.employeeId = updateData.employeeId as any;
    }
    if (updateData.serviceUserId) {
      changes.push("service user updated");
      audit.serviceUserId = updateData.serviceUserId as any;
    }
    if (note !== undefined) {
      changes.push("note updated");
      audit.note = note as string;
    }
    if (document !== undefined) {
      changes.push("documents updated");
      audit.document = getDocuments(document);
    }

    logsToAdd.push({
      title:
        updateData.action === "update"
          ? "Audit details updated"
          : changes.length > 0
            ? changes.join(", ").replace(/^./, (c) => c.toUpperCase())
            : `Audit updated on ${moment().format("DD MMM YYYY")}`,
      date: new Date(),
      updatedBy,
      document: getDocuments(document),
      note: note || "",
      auditDate: audit.auditDate || null,
      nextCheckDate: audit.nextCheckDate || null,
      action: "update",
    });
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
    nextCheckDate?: Date;
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
  const oldNextCheckDate = log.nextCheckDate
    ? moment(log.nextCheckDate).format("DD MMM YYYY")
    : null;
  const oldExtDeadline = log.extendDeadline
    ? moment(log.extendDeadline).format("DD MMM YYYY")
    : null;
  const oldDate = log.date ? moment(log.date).format("DD MMM YYYY") : null;

  const newAuditDate = payload.auditDate
    ? moment(payload.auditDate).format("DD MMM YYYY")
    : null;
  const newNextCheckDate = payload.nextCheckDate
    ? moment(payload.nextCheckDate).format("DD MMM YYYY")
    : null;
  const newExtDeadline = payload.extendDeadline
    ? moment(payload.extendDeadline).format("DD MMM YYYY")
    : null;
  const newDate = payload.date ? moment(payload.date).format("DD MMM YYYY") : null;

  if (payload.document !== undefined) log.document = payload.document;
  if (payload.auditDate !== undefined) log.auditDate = payload.auditDate;
  if (payload.nextCheckDate !== undefined)
    log.nextCheckDate = payload.nextCheckDate;
  if (payload.extendDeadline !== undefined)
    log.extendDeadline = payload.extendDeadline;
  if (payload.note !== undefined) log.note = payload.note;
  if (payload.date !== undefined) log.date = payload.date;

  const dateStr = newDate || oldDate || moment(log.date).format("DD MMM YYYY");

  if (newNextCheckDate !== oldNextCheckDate) {
    if (newNextCheckDate) {
      log.title = oldNextCheckDate
        ? `Audit check date updated from ${oldNextCheckDate} to ${newNextCheckDate}`
        : `Audit check date set to ${newNextCheckDate}`;
    } else {
      log.title = `Next check date removed (was ${oldNextCheckDate || "not set"})`;
    }
  } else if (newAuditDate !== oldAuditDate) {
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
