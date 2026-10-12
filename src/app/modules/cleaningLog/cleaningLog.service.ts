/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import moment from "moment-timezone";

import AppError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { CleaningLog } from "./cleaningLog.model";
import {
  TCleaningLog,
  TCleaningLogHistory,
  TCleaningLogItem,
  TCleaningLogSession,
  TCleaningLogStatus,
} from "./cleaningLog.interface";
import { CleaningArea } from "../cleaningArea/cleaningArea.model";
import { CleaningElement } from "../cleaningElement/cleaningElement.model";
import {
  cleaningPeriod,
  cleaningPeriodKey,
  COMPLETED_LOG_FILTER,
  OPEN_LOG_STATUSES,
} from "../cleaningArea/cleaningArea.constant";
import { CleaningAccessServices } from "../cleaningAccess/cleaningAccess.service";
import { User } from "../user/user.model";

const employeeSelect = "firstName lastName initial name email image";

const DEFAULT_RANGE_DAYS = 30;

const UK_TZ = "Europe/London";

// Widest report a single request can ask for
const REPORT_MAX_DAYS = 93;

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
  const user = await User.findById(String(id?._id || id)).select(
    employeeSelect,
  );
  return displayName(user);
};

const historyLine = async (
  action: TCleaningLogHistory["action"],
  verb: string,
  authUser?: any,
): Promise<TCleaningLogHistory> => ({
  title: `${await nameOf(authUser?._id)} ${verb}`,
  action,
  updatedBy: authUser?._id,
  date: new Date(),
});

const ukTime = (date: Date) => moment(date).tz(UK_TZ).format("HH:mm");

// Only the checked flag is taken from the request. The element text always
// comes from the area itself.
type TItemInput = { elementId?: string; checked?: boolean };

const checkedIdsOf = (items: unknown): Set<string> =>
  new Set(
    (Array.isArray(items) ? (items as TItemInput[]) : [])
      .filter((item) => item?.checked && item?.elementId)
      .map((item) => String(item.elementId)),
  );

const buildItemsFromArea = async (
  areaId: string,
  items: unknown,
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

// Same checklist the log started with, only the ticks move
const tickItems = (existing: any[], items: unknown): TCleaningLogItem[] => {
  const checkedIds = checkedIdsOf(items);
  return existing.map((item: any) => ({
    ...(item.toObject ? item.toObject() : item),
    checked: checkedIds.has(String(item.elementId)),
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
      "This area does not belong to the company",
    );
  }

  return area;
};

const statusLabel = (status?: TCleaningLogStatus) =>
  status === "paused"
    ? "paused"
    : status === "stopped"
      ? "awaiting completion"
      : "in progress";

// A daily area takes one log a day and a monthly area one a month, whoever
// works on it. A session still running holds the area just like a completed
// log does. `excludeId` skips the log being edited.
const assertAreaOpen = async (
  area: any,
  date: Date | string = new Date(),
  excludeId?: string,
) => {
  const existing: any = await CleaningLog.findOne({
    areaId: area._id,
    createdAt: cleaningPeriod(area.type, date),
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  })
    .select("status employeeId")
    .populate("employeeId", employeeSelect);

  if (!existing) return;

  const open = OPEN_LOG_STATUSES.includes(existing.status);
  throw new AppError(
    httpStatus.CONFLICT,
    open
      ? `${area.areaName} is ${statusLabel(existing.status)} by ${displayName(existing.employeeId)}`
      : area.type === "monthly"
        ? `${area.areaName} has already been completed this month`
        : `${area.areaName} has already been completed today`,
  );
};

const isDuplicateKey = (error: any) => error?.code === 11000;

const areaTakenError = (area: any) =>
  new AppError(
    httpStatus.CONFLICT,
    `${area.areaName} has just been taken by someone else`,
  );

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

// Lists and the timeline only ever show completed logs
const getAllCleaningLogFromDB = async (
  query: Record<string, unknown>,
  authUser?: any,
) => {
  const filter: Record<string, unknown> = { ...COMPLETED_LOG_FILTER };

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

// Sessions not completed yet, whatever day they were started on
const getActiveCleaningLogsFromDB = async (
  query: Record<string, unknown>,
  authUser?: any,
) => {
  const filter: Record<string, unknown> = {
    status: { $in: [...OPEN_LOG_STATUSES] },
  };

  if (query.companyId) filter.companyId = query.companyId;
  if (query.employeeId) filter.employeeId = query.employeeId;
  if (query.type) filter.type = query.type;
  if (isEmployee(authUser)) filter.employeeId = authUser._id;

  return populateLog(CleaningLog.find(filter).sort("-updatedAt"));
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

// An employee only works their own sessions; the company side can step in
// on anyone's
const findSessionLog = async (id: string, authUser?: any) => {
  const log = await CleaningLog.findById(id);

  if (!log) {
    throw new AppError(httpStatus.NOT_FOUND, "Cleaning log not found");
  }

  if (isEmployee(authUser) && String(log.employeeId) !== String(authUser._id)) {
    throw new AppError(httpStatus.FORBIDDEN, "This log is not yours");
  }

  return log;
};

const assertStatus = (
  log: any,
  allowed: TCleaningLogStatus[],
  message: string,
) => {
  if (!allowed.includes(log.status)) {
    throw new AppError(httpStatus.BAD_REQUEST, message);
  }
};

// Only one area can be running per employee at a time; a paused one does
// not count
const assertNothingRunning = async (employeeId: any, excludeId?: string) => {
  const running = await CleaningLog.findOne({
    employeeId,
    status: "in_progress",
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).select("areaName");

  if (running) {
    throw new AppError(
      httpStatus.CONFLICT,
      `${running.areaName} is still running. Pause or stop it first.`,
    );
  }
};

// Ends the session that is running, if any, and totals the time worked
const closeSessions = (sessions: any[], now: Date) => {
  const closed: TCleaningLogSession[] = sessions.map((session: any) => ({
    startedAt: session.startedAt,
    endedAt: session.endedAt || now,
  }));

  const durationSeconds = Math.round(
    closed.reduce(
      (total, session) =>
        total +
        (new Date(session.endedAt!).getTime() -
          new Date(session.startedAt).getTime()),
      0,
    ) / 1000,
  );

  return { sessions: closed, durationSeconds };
};

// Applies a status move only if nobody else moved the log first, so a double
// tap or a second device cannot apply it twice
const moveLog = async (
  log: any,
  update: Record<string, unknown>,
  history: TCleaningLogHistory,
  authUser?: any,
) => {
  const result = await CleaningLog.findOneAndUpdate(
    { _id: log._id, status: log.status },
    {
      ...update,
      updatedBy: authUser?._id,
      $push: { logs: history },
    },
    { new: true, runValidators: true },
  );

  if (!result) {
    throw new AppError(
      httpStatus.CONFLICT,
      "This session was just updated elsewhere. Please refresh.",
    );
  }

  return getSingleCleaningLogFromDB(String(result._id));
};

const startCleaningLogIntoDB = async (payload: any, authUser?: any) => {
  const { companyId, areaId } = payload || {};

  // An employee always works for themselves
  const employeeId = isEmployee(authUser) ? authUser._id : payload?.employeeId;

  if (!companyId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Company id is required");
  }
  if (!employeeId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Employee is required");
  }
  if (!areaId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Area is required");
  }

  const assigned = await CleaningAccessServices.isEmployeeAssigned(
    companyId,
    employeeId,
  );

  if (!assigned) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "This employee is not assigned to the cleaning module",
    );
  }

  const area = await findArea(areaId, companyId);
  await assertAreaOpen(area);
  await assertNothingRunning(employeeId);

  const items = await buildItemsFromArea(areaId, []);
  if (items.length === 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This area has no elements yet. Ask an admin to add them first.",
    );
  }

  const now = new Date();
  const actorId = authUser?._id || employeeId;
  const actorName = await nameOf(actorId);
  const title =
    String(actorId) === String(employeeId)
      ? `${actorName} started cleaning`
      : `${actorName} started cleaning for ${await nameOf(employeeId)}`;

  const log: Partial<TCleaningLog> = {
    companyId,
    employeeId,
    areaId: area._id as any,
    areaName: area.areaName,
    roomNumber: area.roomNumber,
    type: area.type,
    status: "in_progress",
    periodKey: cleaningPeriodKey(area.type, now),
    items,
    sessions: [{ startedAt: now }],
    durationSeconds: 0,
    startTime: ukTime(now),
    createdBy: authUser?._id,
    logs: [{ title, action: "start", updatedBy: actorId, date: now }],
  };

  try {
    const result = await CleaningLog.create(log);
    return getSingleCleaningLogFromDB(String(result._id));
  } catch (error) {
    // Lost the race to someone who started the same area a moment earlier
    if (isDuplicateKey(error)) throw areaTakenError(area);
    throw error;
  }
};

const pauseCleaningLogIntoDB = async (
  id: string,
  payload: any,
  authUser?: any,
) => {
  const log = await findSessionLog(id, authUser);
  assertStatus(log, ["in_progress"], "Only a running area can be paused");

  return moveLog(
    log,
    {
      ...closeSessions(log.sessions, new Date()),
      status: "paused",
      ...(payload?.items ? { items: tickItems(log.items, payload.items) } : {}),
    },
    await historyLine("pause", "paused cleaning", authUser),
    authUser,
  );
};

const resumeCleaningLogIntoDB = async (
  id: string,
  payload: any,
  authUser?: any,
) => {
  const log = await findSessionLog(id, authUser);
  // Stop is final: a stopped area can only be completed
  assertStatus(log, ["paused"], "Only a paused area can be resumed");
  await assertNothingRunning(log.employeeId, id);

  return moveLog(
    log,
    {
      status: "in_progress",
      sessions: [
        ...log.sessions.map((session: any) => session.toObject()),
        { startedAt: new Date() },
      ],
      ...(payload?.items ? { items: tickItems(log.items, payload.items) } : {}),
    },
    await historyLine("resume", "resumed cleaning", authUser),
    authUser,
  );
};

const stopCleaningLogIntoDB = async (
  id: string,
  payload: any,
  authUser?: any,
) => {
  const log = await findSessionLog(id, authUser);
  assertStatus(
    log,
    ["in_progress", "paused"],
    "Only a running or paused area can be stopped",
  );

  const now = new Date();

  return moveLog(
    log,
    {
      ...closeSessions(log.sessions, now),
      status: "stopped",
      endTime: ukTime(now),
      ...(payload?.items ? { items: tickItems(log.items, payload.items) } : {}),
    },
    await historyLine("stop", "stopped cleaning", authUser),
    authUser,
  );
};

const completeCleaningLogIntoDB = async (
  id: string,
  payload: any,
  authUser?: any,
) => {
  const log: any = await findSessionLog(id, authUser);
  const { items, signatureUrl, signedAt, note, startTime, endTime } =
    payload || {};

  // An employee stops the timer first. The company side can finish a session
  // in any state, typing the end time (and correcting the start if needed).
  const finishedByCompany = !isEmployee(authUser);
  if (finishedByCompany) {
    assertStatus(
      log,
      [...OPEN_LOG_STATUSES],
      "This area has already been completed",
    );
  } else {
    assertStatus(log, ["stopped"], "Stop the area before completing it");
  }

  if (!signatureUrl) {
    throw new AppError(httpStatus.BAD_REQUEST, "Signature is required");
  }

  let timing: Record<string, unknown> = {};
  if (finishedByCompany) {
    const start = startTime || log.startTime;
    assertTime(start, "Start time");
    assertTime(endTime, "End time");
    assertTimeOrder(start, endTime);
    timing = {
      // Any running stretch ends now, and the typed times are what count
      sessions: closeSessions(log.sessions, new Date()).sessions,
      startTime: start,
      endTime,
      durationSeconds: (minutesOf(endTime) - minutesOf(start)) * 60,
    };
  }

  const filedForOther = String(authUser?._id) !== String(log.employeeId);
  const verb = filedForOther
    ? `completed cleaning log for ${await nameOf(log.employeeId)}`
    : "submitted cleaning log";

  return moveLog(
    log,
    {
      status: "completed",
      items: tickItems(log.items, items),
      signatureUrl,
      signedAt: signedAt ? new Date(signedAt) : new Date(),
      completedAt: new Date(),
      ...(note ? { note } : {}),
      ...timing,
    },
    await historyLine("create", verb, authUser),
    authUser,
  );
};

// Saves the ticks as they are made during a session. Not written to the
// history, which would fill up with one line per tick.
const updateCleaningLogItemsIntoDB = async (
  id: string,
  payload: any,
  authUser?: any,
) => {
  const log: any = await findSessionLog(id, authUser);
  assertStatus(
    log,
    [...OPEN_LOG_STATUSES],
    "This area has already been completed",
  );

  const result = await CleaningLog.findOneAndUpdate(
    { _id: log._id, status: { $in: [...OPEN_LOG_STATUSES] } },
    { items: tickItems(log.items, payload?.items) },
    { new: true, runValidators: true },
  ).select("items status");

  if (!result) {
    throw new AppError(
      httpStatus.CONFLICT,
      "This area has already been completed",
    );
  }

  return result;
};

// Drops a session that was started by mistake, freeing the area again
const discardCleaningLogFromDB = async (id: string, authUser?: any) => {
  const log = await findSessionLog(id, authUser);
  assertStatus(
    log,
    [...OPEN_LOG_STATUSES],
    "A completed log cannot be discarded",
  );

  return CleaningLog.findByIdAndDelete(id);
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
      `${label} must be in the HH:MM format`,
    );
  }
};

const minutesOf = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

// HH:MM strings sort the same way the times do
const assertTimeOrder = (startTime: string, endTime: string) => {
  if (endTime < startTime) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "End time cannot be earlier than start time",
    );
  }
};

// The company side records a finished log in one go, typing the start and
// end time instead of running the timer
const createCleaningLogIntoDB = async (payload: any, authUser?: any) => {
  const {
    companyId,
    employeeId,
    areaId,
    items,
    signatureUrl,
    signedAt,
    startTime,
    endTime,
    note,
  } = payload || {};

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
    employeeId,
  );

  if (!assigned) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "This employee is not assigned to the cleaning module",
    );
  }

  const area = await findArea(areaId, companyId);
  await assertAreaOpen(area);

  const now = new Date();
  const log: Partial<TCleaningLog> = {
    companyId,
    employeeId,
    areaId: area._id as any,
    areaName: area.areaName,
    roomNumber: area.roomNumber,
    type: area.type,
    status: "completed",
    periodKey: cleaningPeriodKey(area.type, now),
    items: await buildItemsFromArea(areaId, items),
    durationSeconds: (minutesOf(endTime) - minutesOf(startTime)) * 60,
    signatureUrl,
    signedAt: signedAt ? new Date(signedAt) : now,
    completedAt: now,
    startTime,
    endTime,
    ...(note ? { note } : {}),
    createdBy: authUser?._id,
    logs: [
      await historyLine(
        "create",
        `created cleaning log for ${await nameOf(employeeId)}`,
        authUser,
      ),
    ],
  };

  try {
    const result = await CleaningLog.create(log);
    return getSingleCleaningLogFromDB(String(result._id));
  } catch (error) {
    if (isDuplicateKey(error)) throw areaTakenError(area);
    throw error;
  }
};

// Corrections to a completed log from the company side, every field included
const updateCleaningLogIntoDB = async (
  id: string,
  payload: any,
  authUser?: any,
) => {
  const existing: any = await CleaningLog.findById(id);

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Cleaning log not found");
  }

  if (OPEN_LOG_STATUSES.includes(existing.status)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This area is still being worked on and cannot be edited yet",
    );
  }

  const update: Record<string, unknown> = { updatedBy: authUser?._id };

  if (payload?.employeeId) {
    const assigned = await CleaningAccessServices.isEmployeeAssigned(
      String(existing.companyId),
      payload.employeeId,
    );

    if (!assigned) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "This employee is not assigned to the cleaning module",
      );
    }

    update.employeeId = payload.employeeId;
  }

  const areaChanged =
    payload?.areaId && String(payload.areaId) !== String(existing.areaId);

  if (areaChanged) {
    // A new area means a new checklist, taken fresh from that area
    const area = await findArea(payload.areaId, String(existing.companyId));
    // Checked against the period the log was originally created in
    await assertAreaOpen(area, existing.createdAt, id);
    update.areaId = area._id;
    update.areaName = area.areaName;
    update.roomNumber = area.roomNumber;
    update.type = area.type;
    update.periodKey = cleaningPeriodKey(area.type, existing.createdAt);
    update.items = await buildItemsFromArea(payload.areaId, payload.items);
  } else if (payload?.items) {
    // Same area: keep the text the log was signed against, only the ticks move
    update.items = tickItems(existing.items, payload.items);
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
  const timesChanged =
    (update.startTime !== undefined &&
      update.startTime !== existing.startTime) ||
    (update.endTime !== undefined && update.endTime !== existing.endTime);
  if (timesChanged) {
    const startTime = (update.startTime as string) ?? existing.startTime;
    const endTime = (update.endTime as string) ?? existing.endTime;
    if (startTime && endTime) {
      assertTimeOrder(startTime, endTime);
      // Hand-set times replace what the timer recorded
      update.durationSeconds = (minutesOf(endTime) - minutesOf(startTime)) * 60;
    }
  }

  try {
    await CleaningLog.findByIdAndUpdate(
      id,
      {
        ...update,
        $push: {
          logs: await historyLine("update", "updated cleaning log", authUser),
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );
  } catch (error) {
    if (isDuplicateKey(error)) {
      throw new AppError(
        httpStatus.CONFLICT,
        "That area already has a log for this period",
      );
    }
    throw error;
  }

  return getSingleCleaningLogFromDB(id);
};

const deleteCleaningLogFromDB = async (id: string) => {
  const result = await CleaningLog.findByIdAndDelete(id);

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Cleaning log not found");
  }

  return result;
};

// Area x day grid of completed logs, counted on the UK clock. The type only
// picks which areas (daily or monthly) the report covers; the columns are
// always the days from fromDate to toDate.
const getCleaningReportFromDB = async (query: Record<string, unknown>) => {
  const { companyId, employeeId } = query;
  const type = query.type === "monthly" ? "monthly" : "daily";

  if (!companyId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Company id is required");
  }
  if (!query.fromDate || !query.toDate) {
    throw new AppError(httpStatus.BAD_REQUEST, "From and to date are required");
  }

  const from = moment.tz(String(query.fromDate).slice(0, 10), UK_TZ).startOf("day");
  const to = moment.tz(String(query.toDate).slice(0, 10), UK_TZ).endOf("day");

  if (!from.isValid() || !to.isValid() || to.isBefore(from)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Please pick a valid date range");
  }

  if (to.diff(from, "days") + 1 > REPORT_MAX_DAYS) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `A report can cover up to ${REPORT_MAX_DAYS} days`,
    );
  }

  const dayKey = (date: Date | moment.Moment) =>
    moment(date).tz(UK_TZ).format("YYYY-MM-DD");

  const columns: string[] = [];
  const cursor = from.clone();
  while (cursor.isSameOrBefore(to)) {
    columns.push(dayKey(cursor));
    cursor.add(1, "day");
  }

  const [areas, logs] = await Promise.all([
    CleaningArea.find({ companyId, type }).select("areaName roomNumber"),
    CleaningLog.find({
      ...COMPLETED_LOG_FILTER,
      companyId,
      type,
      ...(employeeId ? { employeeId } : {}),
      createdAt: { $gte: from.toDate(), $lte: to.toDate() },
    })
      .select("areaId areaName roomNumber employeeId createdAt startTime endTime")
      .populate("employeeId", employeeSelect)
      .sort("createdAt"),
  ]);

  const rows = new Map<string, any>();
  areas.forEach((area: any) =>
    rows.set(String(area._id), {
      areaId: area._id,
      areaName: area.areaName,
      roomNumber: area.roomNumber,
      cells: {},
    }),
  );

  logs.forEach((log: any) => {
    // An area deleted since still shows, under the name the log kept
    const rowKey = String(log.areaId || log.areaName);
    if (!rows.has(rowKey)) {
      rows.set(rowKey, {
        areaId: log.areaId,
        areaName: log.areaName,
        roomNumber: log.roomNumber,
        cells: {},
      });
    }

    // Ticked on the day the cleaning was done
    const key = dayKey(log.createdAt);
    const row = rows.get(rowKey);
    if (!row.cells[key]) {
      row.cells[key] = {
        logId: log._id,
        employeeName: displayName(log.employeeId),
        startTime: log.startTime,
        endTime: log.endTime,
      };
    }
  });

  return { type, columns, rows: Array.from(rows.values()) };
};

export const CleaningLogServices = {
  getAllCleaningLogFromDB,
  getActiveCleaningLogsFromDB,
  getSingleCleaningLogFromDB,
  getCleaningReportFromDB,
  createCleaningLogIntoDB,
  startCleaningLogIntoDB,
  pauseCleaningLogIntoDB,
  resumeCleaningLogIntoDB,
  stopCleaningLogIntoDB,
  completeCleaningLogIntoDB,
  updateCleaningLogItemsIntoDB,
  discardCleaningLogFromDB,
  updateCleaningLogIntoDB,
  deleteCleaningLogFromDB,
};
