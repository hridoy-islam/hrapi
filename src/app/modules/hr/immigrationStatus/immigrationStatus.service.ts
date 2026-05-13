import httpStatus from "http-status";

import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";
import { ImmigrationStatusSearchableFields } from "./immigrationStatus.constant";
import { ImmigrationStatus } from "./immigrationStatus.model";
import { TImmigrationStatus } from "./immigrationStatus.interface";
import moment from '../../../utils/moment-setup';

const getAllImmigrationStatusFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(
    ImmigrationStatus.find()
      .populate("logs.updatedBy", "firstName lastName initial name")
      .populate("employeeId", "firstName lastName initial name"),
    query
  )
    .search(ImmigrationStatusSearchableFields)
    .filter(query)
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

const getSingleImmigrationStatusFromDB = async (id: string) => {
  const result = await ImmigrationStatus.findById(id);
  return result;
};

const createImmigrationStatusIntoDB = async (payload: any) => {
  const { employeeId, nextCheckDate, updatedBy, document, title } = payload;

  if (!employeeId) {
    throw new AppError(httpStatus.BAD_REQUEST, "employeeId is required");
  }
  if (!nextCheckDate) {
    throw new AppError(httpStatus.BAD_REQUEST, "nextCheckDate is required");
  }

  const initialLogEntry = {
    title: "Initiate Immigration Status Verification",
    date: moment.utc().toDate(),       
    updatedBy: updatedBy,
    document: Array.isArray(document) ? document : [], 
  };

  const rtwData = {
    employeeId,
    nextCheckDate: moment.utc(nextCheckDate).startOf("day").toDate(), 
    title: title || "",       
    updatedBy: updatedBy,       
    logs: [initialLogEntry],
  };

  try {
    const result = await ImmigrationStatus.create(rtwData);
    return result;
  } catch (error: any) {
    console.error("Error in createImmigrationStatusIntoDB:", error);

    if (error instanceof AppError) throw error;

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to create ImmigrationStatus"
    );
  }
};

const updateImmigrationStatusIntoDB = async (
  id: string,
  payload: Partial<any>
) => {
  const immigrationStatus:any = await ImmigrationStatus.findById(id);

  if (!immigrationStatus) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "ImmigrationStatus not found"
    );
  }

  const logsToAdd = [];

  // Normalize incoming date using moment
  const newNextCheckDate = payload.nextCheckDate
    ? moment.utc(payload.nextCheckDate).startOf("day").toDate()
    : undefined;

  // Compare dates only by day
  const areDatesEqual = (
    date1: Date | null | undefined,
    date2: Date | null | undefined
  ) => {
    if (!date1 && !date2) return true;
    if (!date1 || !date2) return false;
    return moment.utc(date1).isSame(moment.utc(date2), "day");
  };

  // Add log if date changed
  if (
    newNextCheckDate &&
    !areDatesEqual(newNextCheckDate, immigrationStatus.nextCheckDate)
  ) {
    const oldDate = immigrationStatus.nextCheckDate
      ? moment.utc(immigrationStatus.nextCheckDate).format("DD MMM YYYY")
      : "N/A";

    const newDate = moment.utc(newNextCheckDate).format("DD MMM YYYY");

    const logEntry: any = {
      title: `Immigration status Check Date Updated from ${oldDate} to ${newDate}`,
      date: moment.utc().toDate(),
      updatedBy: payload.updatedBy,
    };

    // ✅ Attach documents to log if provided
    if (payload.document && payload.document.length > 0) {
      logEntry.document = payload.document;
    }

    logsToAdd.push(logEntry);

    // ✅ Update nextCheckDate on the record
    immigrationStatus.nextCheckDate = newNextCheckDate;
  }

  // ✅ Always update documents on the main record if provided
  // (regardless of whether the date changed)
  if (payload.document && payload.document.length > 0) {
    immigrationStatus.document = [
      ...(immigrationStatus.document || []),
      ...payload.document,
    ];
    // OR replace entirely if that's your intent:
    // immigrationStatus.document = payload.document;
  }

  // Push logs
  if (logsToAdd.length > 0) {
    immigrationStatus.logs = immigrationStatus.logs || [];
    immigrationStatus.logs.push(...logsToAdd);
  }

  // Update remaining fields — exclude fields handled manually above
  const EXCLUDED_KEYS = new Set([
    "nextCheckDate",
    "document",
    "updatedBy",
    "logs",
  ]);

  Object.keys(payload).forEach((key) => {
    if (!EXCLUDED_KEYS.has(key)) {
      (immigrationStatus as any)[key] = (payload as any)[key];
    }
  });

  // ✅ Always track who last updated
  if (payload.updatedBy) {
    immigrationStatus.updatedBy = payload.updatedBy;
  }

  const result = await immigrationStatus.save();

  return result;
};

export const ImmigrationStatusServices = {
  getAllImmigrationStatusFromDB,
  getSingleImmigrationStatusFromDB,
  createImmigrationStatusIntoDB,
  updateImmigrationStatusIntoDB,
};
