/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";

import AppError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { CleaningLog } from "./cleaningLog.model";
import { TCleaningLog, TCleaningLogItem } from "./cleaningLog.interface";
import { CleaningArea } from "../cleaningArea/cleaningArea.model";
import { CleaningElement } from "../cleaningElement/cleaningElement.model";
import { CleaningAccessServices } from "../cleaningAccess/cleaningAccess.service";
import { User } from "../user/user.model";

const employeeSelect = "firstName lastName initial name email image";

const DEFAULT_RANGE_DAYS = 30;

const isEmployee = (authUser?: any) => authUser?.role === "employee";

const populateLog = (query: any) =>
  query
    .populate("employeeId", employeeSelect)
    .populate("createdBy", employeeSelect)
    .populate("updatedBy", employeeSelect)
    .populate("logs.updatedBy", employeeSelect);

const displayName = (user: any) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
  user?.name ||
  user?.email ||
  "Someone";

const nameOf = async (id: any): Promise<string> => {
  if (!id) return "Someone";
  const user = await User.findById(String(id?._id || id)).select(employeeSelect);
  return displayName(user);
};

// Only the checked flag is taken from the request. The element text always
// comes from the area itself.
type TItemInput = { elementId?: string; checked?: boolean };

const checkedIdsOf = (items: unknown): Set<string> =>
  new Set(
    (Array.isArray(items) ? (items as TItemInput[]) : [])
      .filter((item) => item?.checked && item?.elementId)
      .map((item) => String(item.elementId))
  );

const buildItemsFromArea = async (
  areaId: string,
  items: unknown
): Promise<TCleaningLogItem[]> => {
  const checkedIds = checkedIdsOf(items);
  const elements = await CleaningElement.find({ areaId }).sort("createdAt");

  return elements.map((element: any) => ({
    elementId: element._id,
    element: element.element,
    performanceParameter: element.performanceParameter,
    checked: checkedIds.has(String(element._id)),
  }));
};

const findArea = async (areaId: string, companyId?: string) => {
  const area = await CleaningArea.findById(areaId);

  if (!area) {
    throw new AppError(httpStatus.NOT_FOUND, "Area not found");
  }

  if (companyId && String(area.companyId) !== String(companyId)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This area does not belong to the company"
    );
  }

  return area;
};

// No range given means the last 30 days, which is what every list opens on
const dateRange = (query: Record<string, unknown>) => {
  const end = query.toDate
    ? new Date(`${String(query.toDate).slice(0, 10)}T23:59:59.999Z`)
    : new Date();

  const start = query.fromDate
    ? new Date(`${String(query.fromDate).slice(0, 10)}T00:00:00.000Z`)
    : new Date(Date.now() - DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000);

  return { $gte: start, $lte: end };
};

const getAllCleaningLogFromDB = async (
  query: Record<string, unknown>,
  authUser?: any
) => {
  const filter: Record<string, unknown> = {};

  const { companyId, employeeId, areaId, type } = query;
  if (companyId) filter.companyId = companyId;
  if (employeeId) filter.employeeId = employeeId;
  if (areaId) filter.areaId = areaId;
  if (type) filter.type = type;

  // Set last, so an employee cannot widen the list through the query string
  if (isEmployee(authUser)) filter.employeeId = authUser._id;

  filter.createdAt = dateRange(query);

  const logQuery = new QueryBuilder(populateLog(CleaningLog.find(filter)), {
    sort: "-createdAt",
    ...query,
  })
    .search(["areaName", "roomNumber"])
    .sort()
    .paginate()
    .fields();

  const meta = await logQuery.countTotal();
  const result = await logQuery.modelQuery;

  return { meta, result };
};

const getSingleCleaningLogFromDB = async (id: string, authUser?: any) => {
  const result = await populateLog(CleaningLog.findById(id));

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Cleaning log not found");
  }

  if (
    isEmployee(authUser) &&
    String(result.employeeId?._id || result.employeeId) !== String(authUser._id)
  ) {
    throw new AppError(httpStatus.FORBIDDEN, "This log is not yours");
  }

  return result;
};

// A 24-hour clock time, e.g. 09:00 or 17:30
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const assertTime = (value: unknown, label: string) => {
  if (!value) {
    throw new AppError(httpStatus.BAD_REQUEST, `${label} is required`);
  }
  if (typeof value !== "string" || !TIME_PATTERN.test(value)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `${label} must be in the HH:MM format`
    );
  }
};

// HH:MM strings sort the same way the times do
const assertTimeOrder = (startTime: string, endTime: string) => {
  if (endTime < startTime) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "End time cannot be earlier than start time"
    );
  }
};

const createCleaningLogIntoDB = async (payload: any, authUser?: any) => {
  const { companyId, areaId, items, signatureUrl, signedAt, startTime, endTime, note } =
    payload || {};

  // An employee always logs for themselves
  const employeeId = isEmployee(authUser)
    ? authUser._id
    : payload?.employeeId;

  if (!companyId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Company id is required");
  }
  if (!employeeId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Employee is required");
  }
  if (!areaId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Area is required");
  }
  if (!signatureUrl) {
    throw new AppError(httpStatus.BAD_REQUEST, "Signature is required");
  }
  assertTime(startTime, "Start time");
  assertTime(endTime, "End time");
  assertTimeOrder(startTime, endTime);

  const assigned = await CleaningAccessServices.isEmployeeAssigned(
    companyId,
    employeeId
  );

  if (!assigned) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "This employee is not assigned to the cleaning module"
    );
  }

  const area = await findArea(areaId, companyId);

  // History line: the employee submitting their own log, or someone
  // creating it on their behalf
  const actorId = authUser?._id || employeeId;
  const actorName = await nameOf(actorId);
  const title =
    String(actorId) === String(employeeId)
      ? `${actorName} submitted cleaning log`
      : `${actorName} created cleaning log for ${await nameOf(employeeId)}`;

  const log: Partial<TCleaningLog> = {
    companyId,
    employeeId,
    areaId: area._id as any,
    areaName: area.areaName,
    roomNumber: area.roomNumber,
    type: area.type,
    items: await buildItemsFromArea(areaId, items),
    signatureUrl,
    signedAt: signedAt ? new Date(signedAt) : new Date(),
    startTime,
    endTime,
    ...(note ? { note } : {}),
    createdBy: authUser?._id,
    logs: [
      { title, action: "create", updatedBy: actorId, date: new Date() },
    ],
  };

  const result = await CleaningLog.create(log);

  return getSingleCleaningLogFromDB(String(result._id));
};

const updateCleaningLogIntoDB = async (
  id: string,
  payload: any,
  authUser?: any
) => {
  const existing = await CleaningLog.findById(id);

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Cleaning log not found");
  }

  const update: Record<string, unknown> = { updatedBy: authUser?._id };

  if (payload?.employeeId) {
    const assigned = await CleaningAccessServices.isEmployeeAssigned(
      String(existing.companyId),
      payload.employeeId
    );

    if (!assigned) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "This employee is not assigned to the cleaning module"
      );
    }

    update.employeeId = payload.employeeId;
  }

  const areaChanged =
    payload?.areaId && String(payload.areaId) !== String(existing.areaId);

  if (areaChanged) {
    // A new area means a new checklist, taken fresh from that area
    const area = await findArea(payload.areaId, String(existing.companyId));
    update.areaId = area._id;
    update.areaName = area.areaName;
    update.roomNumber = area.roomNumber;
    update.type = area.type;
    update.items = await buildItemsFromArea(payload.areaId, payload.items);
  } else if (payload?.items) {
    // Same area: keep the text the log was signed against, only the ticks move
    const checkedIds = checkedIdsOf(payload.items);
    update.items = existing.items.map((item: any) => ({
      ...item.toObject(),
      checked: checkedIds.has(String(item.elementId)),
    }));
  }

  if (payload?.signatureUrl) {
    update.signatureUrl = payload.signatureUrl;
    update.signedAt = payload.signedAt
      ? new Date(payload.signedAt)
      : new Date();
  }

  if (payload?.note !== undefined) {
    update.note = payload.note || "";
  }

  if (payload?.startTime !== undefined) {
    assertTime(payload.startTime, "Start time");
    update.startTime = payload.startTime;
  }
  if (payload?.endTime !== undefined) {
    assertTime(payload.endTime, "End time");
    update.endTime = payload.endTime;
  }
  if (update.startTime !== undefined || update.endTime !== undefined) {
    const startTime = (update.startTime as string) ?? existing.startTime;
    const endTime = (update.endTime as string) ?? existing.endTime;
    if (startTime && endTime) assertTimeOrder(startTime, endTime);
  }

  await CleaningLog.findByIdAndUpdate(
    id,
    {
      ...update,
      $push: {
        logs: {
          title: `${await nameOf(authUser?._id)} updated cleaning log`,
          action: "update",
          updatedBy: authUser?._id,
          date: new Date(),
        },
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  return getSingleCleaningLogFromDB(id);
};

const deleteCleaningLogFromDB = async (id: string) => {
  const result = await CleaningLog.findByIdAndDelete(id);

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Cleaning log not found");
  }

  return result;
};

export const CleaningLogServices = {
  getAllCleaningLogFromDB,
  getSingleCleaningLogFromDB,
  createCleaningLogIntoDB,
  updateCleaningLogIntoDB,
  deleteCleaningLogFromDB,
};
