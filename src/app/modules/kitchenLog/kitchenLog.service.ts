/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import moment from "moment-timezone";
import { Types } from "mongoose";

import AppError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { KITCHEN_LOG_MODELS, KitchenLog } from "./kitchenLog.model";
import { TKitchenLogHistory } from "./kitchenLog.interface";
import {
  APPROVAL_MODULES,
  DEEP_CLEAN_ITEMS,
  deepCleanAreaFor,
  EQUIPMENT_TEMPERATURE_AREA,
  EQUIPMENT_TEMPERATURE_FIELDS,
  isTemperatureOutOfRange,
  KITCHEN_CLEANING_READINGS,
  KITCHEN_FREQUENCIES,
  KITCHEN_MODULE_KEYS,
  KITCHEN_MODULES,
  KITCHEN_SHIFT_KEYS,
  KITCHEN_SHIFTS,
  modulesOf,
  OPEN_KITCHEN_STATUSES,
  periodLabelKey,
  periodRange,
  PROBE_BOILING_WATER_RANGE,
  PROBE_ICED_WATER_RANGE,
  TKitchenFrequency,
  TKitchenModule,
  TKitchenShift,
  UK_TZ,
  ukMoment,
} from "./kitchenLog.constant";
import { KitchenAccessServices } from "../kitchenAccess/kitchenAccess.service";
import { User } from "../user/user.model";

const employeeSelect = "firstName lastName initial name email image";

const DEFAULT_RANGE_DAYS = 30;

// Widest report a single request can ask for
const REPORT_MAX_DAYS = 366;

const isEmployee = (authUser?: any) => authUser?.role === "employee";

const populateLog = (query: any) =>
  query
    .populate("employeeId", employeeSelect)
    .populate("createdBy", employeeSelect)
    .populate("updatedBy", employeeSelect)
    .populate("logs.updatedBy", employeeSelect)
    // Only the modules that take approval have it, hence not strict
    .populate({
      path: "approvedBy",
      select: employeeSelect,
      strictPopulate: false,
    });

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
  action: TKitchenLogHistory["action"],
  verb: string,
  authUser?: any,
): Promise<TKitchenLogHistory> => ({
  title: `${await nameOf(authUser?._id)} ${verb}`,
  action,
  updatedBy: authUser?._id,
  date: new Date(),
});

const ukTime = (date: Date) => moment(date).tz(UK_TZ).format("HH:mm");

const isDuplicateKey = (error: any) => error?.code === 11000;

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const moduleConfig = (module: unknown) => {
  if (!KITCHEN_MODULE_KEYS.includes(module as TKitchenModule)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Please pick a valid log");
  }
  return KITCHEN_MODULES[module as TKitchenModule];
};

const modelOf = (module: TKitchenModule) => KITCHEN_LOG_MODELS[module];

// A 24-hour clock time, e.g. 09:00 or 17:30
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const assertTime = (value: unknown, label: string) => {
  if (!value) return;
  if (typeof value !== "string" || !TIME_PATTERN.test(value)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `${label} must be in the HH:MM format`,
    );
  }
};

const assertRequiredTime = (value: unknown, label: string) => {
  if (!value) {
    throw new AppError(httpStatus.BAD_REQUEST, `${label} is required`);
  }
  assertTime(value, label);
};

const minutesOf = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

// HH:MM strings sort the same way the times do
const assertTimeOrder = (startTime?: string, endTime?: string) => {
  if (startTime && endTime && endTime < startTime) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "End time cannot be earlier than start time",
    );
  }
};

// Empty means not filled in yet; anything else has to be a number
const toNumber = (value: unknown, label: string): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new AppError(httpStatus.BAD_REQUEST, `${label} must be a number`);
  }
  return number;
};

const inRange = (value: number | undefined, range: { min: number; max: number }) =>
  value === undefined ? undefined : value >= range.min && value <= range.max;

const byKey = (input: unknown) =>
  new Map<string, any>(
    (Array.isArray(input) ? input : [])
      .filter((entry: any) => entry?.key)
      .map((entry: any) => [String(entry.key), entry]),
  );

// The day a log covers. An employee always logs today; the company side may
// back-fill a past day, picked as YYYY-MM-DD on the UK calendar.
const resolveLogDate = (value: unknown) => {
  const now = new Date();
  if (!value) return now;

  const picked = moment.tz(String(value).slice(0, 10), "YYYY-MM-DD", true, UK_TZ);
  if (!picked.isValid()) {
    throw new AppError(httpStatus.BAD_REQUEST, "Please pick a valid date");
  }

  const today = ukMoment(now);
  if (picked.isAfter(today, "day")) {
    throw new AppError(httpStatus.BAD_REQUEST, "The date cannot be in the future");
  }

  return picked.isSame(today, "day") ? now : picked.hour(12).toDate();
};

// ---------------------------------------------------------------------------
// What a log is filled in against
// ---------------------------------------------------------------------------

// The shift or item a log is for. Modules with one target per period (deep
// clean, equipment, probe) have none.
const resolveTarget = (module: TKitchenModule, payload: any) => {
  if (module === "kitchen_cleaning") {
    const shift = payload?.shift as TKitchenShift;
    if (!KITCHEN_SHIFT_KEYS.includes(shift)) {
      throw new AppError(httpStatus.BAD_REQUEST, "Please pick morning or afternoon");
    }
    return { shift };
  }

  const items = DEEP_CLEAN_ITEMS[module];
  if (items) {
    const item = items.find((entry) => entry.key === payload?.itemKey);
    if (!item) {
      throw new AppError(httpStatus.BAD_REQUEST, "Please pick an item");
    }
    return {
      itemKey: item.key,
      item: item.item,
      action: item.action,
      itemFrequency: item.frequency,
    };
  }

  return {};
};

const targetKeyOf = (log: any) => log.shift || log.itemKey || "single";

const targetLabel = (module: TKitchenModule, log: any) => {
  if (module === "kitchen_cleaning") {
    return KITCHEN_SHIFTS[log.shift as TKitchenShift]?.label || log.shift;
  }
  return log.item || log.area || KITCHEN_MODULES[module].label;
};

// The period key a new log takes. Items done more than once a period get
// the first free slot, e.g. 2026-W43#floor#2.
const resolvePeriodKey = async (
  companyId: string,
  module: TKitchenModule,
  date: Date,
  target: Record<string, any>,
) => {
  const config = KITCHEN_MODULES[module];
  const base = periodLabelKey(config.frequency, date);
  const key = target.shift || target.itemKey;
  const periodKey = key ? `${base}#${key}` : base;

  if (config.perPeriod <= 1) return periodKey;

  const taken = await KitchenLog.find({
    companyId,
    module,
    periodKey: { $regex: `^${periodKey}#` },
  }).select("periodKey");
  const used = new Set(taken.map((log: any) => log.periodKey));

  for (let slot = 1; slot <= config.perPeriod; slot += 1) {
    if (!used.has(`${periodKey}#${slot}`)) return `${periodKey}#${slot}`;
  }

  throw new AppError(
    httpStatus.CONFLICT,
    `${target.item || config.label} has already been done ${config.perPeriod} times this week`,
  );
};

// Why the item is not free: someone is on it, or it is done
const takenError = async (
  companyId: string,
  module: TKitchenModule,
  periodKey: string,
  label: string,
) => {
  const existing: any = await KitchenLog.findOne({ companyId, module, periodKey })
    .select("status employeeId")
    .populate("employeeId", employeeSelect);

  const frequency = KITCHEN_MODULES[module].frequency;
  const period =
    frequency === "monthly"
      ? "this month"
      : frequency === "daily"
        ? "today"
        : "this week";

  return new AppError(
    httpStatus.CONFLICT,
    existing && existing.status !== "completed"
      ? `${label} is already in progress by ${displayName(existing.employeeId)}`
      : `${label} has already been completed ${period}`,
  );
};

// The module's own fields, built from the constants with only the values
// taken from the request. `existing` keeps the text an open or signed log was
// started against; a field missing from the request is left as it is.
const detailFields = (
  module: TKitchenModule,
  payload: any,
  existing?: any,
): Record<string, unknown> => {
  const fields: Record<string, unknown> = {};

  if (payload?.note !== undefined) fields.note = String(payload.note || "").trim();

  if (module === "kitchen_cleaning") {
    const shift = (existing?.shift || payload?.shift) as TKitchenShift;
    if (payload?.checklist !== undefined || !existing) {
      const ticks = byKey(payload?.checklist);
      const base = existing?.checklist?.length
        ? existing.checklist
        : KITCHEN_SHIFTS[shift].checklist;
      fields.checklist = base.map((item: any) => ({
        key: item.key,
        label: item.label,
        checked: Boolean(ticks.get(item.key)?.checked),
      }));
    }
    if (payload?.readings !== undefined || !existing) {
      const values = byKey(payload?.readings);
      const base = existing?.readings?.length
        ? existing.readings
        : KITCHEN_CLEANING_READINGS;
      fields.readings = base.map((reading: any) => ({
        key: reading.key,
        label: reading.label,
        value: String(values.get(reading.key)?.value ?? "").trim().slice(0, 200),
      }));
    }
  }

  if (module === "equipment_temperature") {
    if (!existing) fields.area = EQUIPMENT_TEMPERATURE_AREA;
    if (payload?.temperatures !== undefined || !existing) {
      const values = byKey(payload?.temperatures);
      fields.temperatures = EQUIPMENT_TEMPERATURE_FIELDS.map((field) => {
        const value = values.get(field.key) || {};
        assertTime(value.time, `${field.label} time`);
        const temperature = toNumber(value.temperature, `${field.label} temperature`);
        return {
          key: field.key,
          label: field.label,
          range: field.range,
          time: value.time || "",
          temperature,
          outOfRange: isTemperatureOutOfRange(field, temperature),
          reportedToManagement: Boolean(value.reportedToManagement),
        };
      });
    }
  }

  if (module === "probe_calibration") {
    if (payload?.probeDetails !== undefined) {
      fields.probeDetails = String(payload.probeDetails || "").trim();
    }
    if (payload?.icedWaterReading !== undefined) {
      const reading = toNumber(payload.icedWaterReading, "Iced water reading");
      fields.icedWaterReading = reading;
      fields.icedWaterInRange = inRange(reading, PROBE_ICED_WATER_RANGE);
    }
    if (payload?.boilingWaterReading !== undefined) {
      const reading = toNumber(payload.boilingWaterReading, "Boiling water reading");
      fields.boilingWaterReading = reading;
      fields.boilingWaterInRange = inRange(reading, PROBE_BOILING_WATER_RANGE);
    }
  }

  return fields;
};

// What has to be filled in before a log can be completed, on top of the
// signature
const assertComplete = (module: TKitchenModule, log: any) => {
  if (module === "kitchen_cleaning") {
    const unticked = (log.checklist || []).find((item: any) => !item.checked);
    if (unticked) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Tick every check before finishing: ${unticked.label}`,
      );
    }
  }

  if (module === "equipment_temperature") {
    (log.temperatures || []).forEach((reading: any) => {
      if (!reading.time) {
        throw new AppError(httpStatus.BAD_REQUEST, `${reading.label} time is required`);
      }
      assertTime(reading.time, `${reading.label} time`);
      if (typeof reading.temperature !== "number") {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `${reading.label} temperature is required`,
        );
      }
    });
  }

  if (module === "probe_calibration") {
    if (typeof log.icedWaterReading !== "number") {
      throw new AppError(httpStatus.BAD_REQUEST, "Iced water reading is required");
    }
    if (typeof log.boilingWaterReading !== "number") {
      throw new AppError(httpStatus.BAD_REQUEST, "Boiling water reading is required");
    }
  }
};

const assertAssigned = async (companyId: string, employeeId: string) => {
  const assigned = await KitchenAccessServices.isEmployeeAssigned(
    companyId,
    employeeId,
  );
  if (!assigned) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "This employee is not assigned to the kitchen log module",
    );
  }
};

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

// No range given means the last 30 days
const dateRange = (query: Record<string, unknown>) => {
  const end = query.toDate
    ? moment.tz(String(query.toDate).slice(0, 10), UK_TZ).endOf("day").toDate()
    : new Date();

  const start = query.fromDate
    ? moment.tz(String(query.fromDate).slice(0, 10), UK_TZ).startOf("day").toDate()
    : moment().tz(UK_TZ).subtract(DEFAULT_RANGE_DAYS, "days").startOf("day").toDate();

  return { $gte: start, $lte: end };
};

const NEEDS_APPROVAL_FILTER = {
  module: { $in: APPROVAL_MODULES },
  status: "completed",
  approvedAt: null,
};

const getAllKitchenLogFromDB = async (
  query: Record<string, unknown>,
  authUser?: any,
) => {
  const filter: Record<string, unknown> = {};
  const { companyId, employeeId, module, frequency, status, needsApproval } =
    query;

  if (companyId) filter.companyId = companyId;
  if (employeeId) filter.employeeId = employeeId;
  if (module) filter.module = module;
  if (frequency) filter.frequency = frequency;
  filter.status = status || "completed";

  if (needsApproval === "true") {
    Object.assign(filter, NEEDS_APPROVAL_FILTER);
  } else {
    filter.logDate = dateRange(query);
  }

  // Set last, so an employee cannot widen the list through the query string
  if (isEmployee(authUser)) filter.employeeId = authUser._id;

  const logQuery = new QueryBuilder(populateLog(KitchenLog.find(filter)), {
    sort: "-logDate",
    ...query,
  })
    .sort()
    .paginate()
    .fields();

  const meta = await logQuery.countTotal();
  const result = await logQuery.modelQuery;

  return { meta, result };
};

// Completed logs still waiting for management, counted per frequency for the
// tab badges
const getApprovalCountsFromDB = async (query: Record<string, unknown>) => {
  const { companyId } = query;
  if (!companyId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Company id is required");
  }

  const groups = await KitchenLog.aggregate([
    {
      $match: {
        ...NEEDS_APPROVAL_FILTER,
        companyId: new Types.ObjectId(String(companyId)),
      },
    },
    { $group: { _id: "$frequency", count: { $sum: 1 } } },
  ]);

  const counts: Record<string, number> = { total: 0 };
  KITCHEN_FREQUENCIES.forEach((frequency) => (counts[frequency] = 0));
  groups.forEach((group: any) => {
    counts[group._id] = group.count;
    counts.total += group.count;
  });

  return counts;
};

// Every item of a frequency for the current period, with what is done and
// what is left. Drives the staff buttons and the admin "left" board.
const getKitchenBoardFromDB = async (
  query: Record<string, unknown>,
  authUser?: any,
) => {
  const { companyId } = query;
  const frequency = query.frequency as TKitchenFrequency;

  if (!companyId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Company id is required");
  }
  if (!KITCHEN_FREQUENCIES.includes(frequency)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Please pick a valid frequency");
  }
  if (isEmployee(authUser)) {
    await assertAssigned(String(companyId), authUser._id);
  }

  const date = new Date();
  const modules = modulesOf(frequency);
  const range = periodRange(frequency, date);

  const logs: any[] = await KitchenLog.find({
    companyId,
    module: { $in: modules },
    logDate: range,
  })
    .select(
      "module status employeeId shift itemKey item area periodKey startTime endTime completedAt approvedAt",
    )
    .populate("employeeId", employeeSelect)
    .sort("createdAt")
    .lean();

  const targetsOf = (module: TKitchenModule) => {
    if (module === "kitchen_cleaning") {
      return KITCHEN_SHIFT_KEYS.map((shift) => ({
        key: shift,
        label: KITCHEN_SHIFTS[shift].label,
        description: KITCHEN_SHIFTS[shift].hours,
      }));
    }
    const items = DEEP_CLEAN_ITEMS[module];
    if (items) {
      return items.map((item) => ({
        key: item.key,
        label: item.item,
        description: item.action,
      }));
    }
    if (module === "kitchen_deep_clean") {
      return [
        {
          key: "single",
          label: deepCleanAreaFor(date),
          description: ukMoment(date).format("dddd"),
        },
      ];
    }
    if (module === "equipment_temperature") {
      return [
        {
          key: "single",
          label: `${EQUIPMENT_TEMPERATURE_AREA} temperatures`,
          description: ukMoment(date).format("dddd"),
        },
      ];
    }
    return [
      {
        key: "single",
        label: KITCHEN_MODULES[module].label,
        description: ukMoment(date).format("MMMM YYYY"),
      },
    ];
  };

  return {
    frequency,
    periodKey: periodLabelKey(frequency, date),
    periodStart: range.$gte,
    periodEnd: range.$lte,
    modules: modules.map((module) => {
      const config = KITCHEN_MODULES[module];
      const moduleLogs = logs.filter((log) => log.module === module);

      const targets = targetsOf(module).map((target) => {
        const entries = moduleLogs
          .filter((log) => targetKeyOf(log) === target.key)
          .map((log) => ({
            _id: log._id,
            status: log.status,
            employeeId: log.employeeId,
            startTime: log.startTime,
            endTime: log.endTime,
            completedAt: log.completedAt,
            approvedAt: log.approvedAt,
          }));
        const done = entries.filter((log) => log.status === "completed").length;
        return {
          ...target,
          required: config.perPeriod,
          done,
          isDone: done >= config.perPeriod,
          entries,
        };
      });

      return {
        module,
        label: config.label,
        requiresApproval: config.requiresApproval,
        timed: config.timed,
        left: targets.filter((target) => !target.isDone).length,
        targets,
      };
    }),
  };
};

const findLog = async (id: string, authUser?: any) => {
  const log: any = await KitchenLog.findById(id);

  if (!log) {
    throw new AppError(httpStatus.NOT_FOUND, "Kitchen log not found");
  }

  if (isEmployee(authUser) && String(log.employeeId) !== String(authUser._id)) {
    throw new AppError(httpStatus.FORBIDDEN, "This log is not yours");
  }

  return log;
};

const getSingleKitchenLogFromDB = async (id: string, authUser?: any) => {
  await findLog(id, authUser);
  return populateLog(KitchenLog.findById(id));
};

// ---------------------------------------------------------------------------
// Session: start -> stop -> complete
// ---------------------------------------------------------------------------

// Applies a change only if nobody moved the log first, so a double tap or a
// second device cannot apply it twice
const moveLog = async (
  log: any,
  update: Record<string, unknown>,
  history: TKitchenLogHistory | null,
  authUser?: any,
) => {
  const Model = modelOf(log.module);
  const result = await populateLog(
    Model.findOneAndUpdate(
      { _id: log._id, status: log.status },
      {
        ...update,
        updatedBy: authUser?._id,
        ...(history ? { $push: { logs: history } } : {}),
      },
      { new: true, runValidators: true },
    ),
  );

  if (!result) {
    throw new AppError(
      httpStatus.CONFLICT,
      "This log was just updated elsewhere. Please refresh.",
    );
  }

  return result;
};

const assertOpen = (log: any) => {
  if (!OPEN_KITCHEN_STATUSES.includes(log.status)) {
    throw new AppError(httpStatus.BAD_REQUEST, "This log has already been completed");
  }
};

// Opens a log for the employee themselves and starts its timer
const startKitchenLogIntoDB = async (payload: any, authUser?: any) => {
  const { companyId, module } = payload || {};
  const employeeId = authUser?._id;

  if (!companyId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Company id is required");
  }
  const config = moduleConfig(module);
  if (!config.timed) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `${config.label} is filled in and submitted in one go`,
    );
  }

  await assertAssigned(companyId, employeeId);

  const now = new Date();
  const target = resolveTarget(module, payload);
  const periodKey = await resolvePeriodKey(companyId, module, now, target);
  const label = targetLabel(module, target);

  const log = {
    companyId,
    employeeId,
    module,
    frequency: config.frequency,
    status: "in_progress",
    logDate: now,
    periodKey,
    startTime: ukTime(now),
    startedAt: now,
    durationSeconds: 0,
    ...target,
    ...(module === "kitchen_deep_clean" ? { area: deepCleanAreaFor(now) } : {}),
    ...detailFields(module, { ...payload, ...target }),
    createdBy: employeeId,
    logs: [await historyLine("start", `started ${config.label}`, authUser)],
  };

  try {
    const result = await modelOf(module).create(log);
    return populateLog(KitchenLog.findById(result._id));
  } catch (error) {
    // Lost the race to someone who started the same item a moment earlier
    if (isDuplicateKey(error)) {
      throw await takenError(
        companyId,
        module,
        periodKey,
        module === "kitchen_deep_clean" ? deepCleanAreaFor(now) : label,
      );
    }
    throw error;
  }
};

// Ticks, readings and notes saved as they are made. Not written to the
// history, which would fill up with one line per tick.
const saveKitchenLogProgressIntoDB = async (
  id: string,
  payload: any,
  authUser?: any,
) => {
  const log = await findLog(id, authUser);
  assertOpen(log);

  return moveLog(log, detailFields(log.module, payload, log), null, authUser);
};

const stopKitchenLogIntoDB = async (id: string, payload: any, authUser?: any) => {
  const log = await findLog(id, authUser);
  if (log.status !== "in_progress") {
    throw new AppError(httpStatus.BAD_REQUEST, "Only a running log can be stopped");
  }

  const now = new Date();
  const startedAt = log.startedAt || log.createdAt;

  return moveLog(
    log,
    {
      ...detailFields(log.module, payload, log),
      status: "stopped",
      stoppedAt: now,
      endTime: ukTime(now),
      durationSeconds: Math.max(
        0,
        Math.round((now.getTime() - new Date(startedAt).getTime()) / 1000),
      ),
    },
    await historyLine("stop", `stopped ${KITCHEN_MODULES[log.module as TKitchenModule].label}`, authUser),
    authUser,
  );
};

const completeKitchenLogIntoDB = async (
  id: string,
  payload: any,
  authUser?: any,
) => {
  const log = await findLog(id, authUser);
  assertOpen(log);

  const module = log.module as TKitchenModule;
  const config = KITCHEN_MODULES[module];
  const employee = isEmployee(authUser);

  // An employee completes once the timer is stopped; the company side can
  // finish a session in any open state
  if (employee && log.status !== "stopped") {
    throw new AppError(httpStatus.BAD_REQUEST, "Stop the timer before completing");
  }

  const { signatureUrl, signedAt } = payload || {};
  if (!signatureUrl) {
    throw new AppError(httpStatus.BAD_REQUEST, "Signature is required");
  }

  const fields = detailFields(module, payload, log);
  assertComplete(module, { ...log.toObject(), ...fields });

  // An employee's times are the ones the timer stamped; the company side may
  // type them in
  const now = new Date();
  const startTime = (employee ? log.startTime : payload?.startTime || log.startTime) || "";
  const endTime =
    (employee ? log.endTime : payload?.endTime || log.endTime) || ukTime(now);
  assertRequiredTime(startTime, "Start time");
  assertRequiredTime(endTime, "End time");
  assertTimeOrder(startTime, endTime);

  const typed = startTime !== log.startTime || endTime !== log.endTime;
  const filedForOther = String(authUser?._id) !== String(log.employeeId);

  return moveLog(
    log,
    {
      ...fields,
      status: "completed",
      startTime,
      endTime,
      stoppedAt: log.stoppedAt || now,
      ...(typed || !log.durationSeconds
        ? { durationSeconds: (minutesOf(endTime) - minutesOf(startTime)) * 60 }
        : {}),
      signatureUrl,
      signedAt: signedAt ? new Date(signedAt) : now,
      completedAt: now,
    },
    await historyLine(
      "complete",
      filedForOther
        ? `completed ${config.label} for ${await nameOf(log.employeeId)}`
        : `completed ${config.label}`,
      authUser,
    ),
    authUser,
  );
};

// Drops a session started by mistake, freeing the item again
const discardKitchenLogFromDB = async (id: string, authUser?: any) => {
  const log = await findLog(id, authUser);
  if (!OPEN_KITCHEN_STATUSES.includes(log.status)) {
    throw new AppError(httpStatus.BAD_REQUEST, "A completed log cannot be discarded");
  }
  return KitchenLog.findByIdAndDelete(id);
};

// ---------------------------------------------------------------------------
// Logs filed in one go
// ---------------------------------------------------------------------------

// A finished log recorded in one go: by the company side for any module and
// employee (times typed in), or by an employee for the untimed modules
const createKitchenLogIntoDB = async (payload: any, authUser?: any) => {
  const { companyId, module, signatureUrl, signedAt } = payload || {};
  const employee = isEmployee(authUser);
  const employeeId = employee ? authUser._id : payload?.employeeId;

  if (!companyId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Company id is required");
  }
  if (!employeeId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Employee is required");
  }
  const config = moduleConfig(module);
  if (employee && config.timed) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Press Start to begin ${config.label}`,
    );
  }
  if (!signatureUrl) {
    throw new AppError(httpStatus.BAD_REQUEST, "Signature is required");
  }

  const now = new Date();
  const logDate = employee ? now : resolveLogDate(payload?.logDate);

  // Untimed logs are stamped with the moment they are submitted
  const startTime = config.timed ? payload?.startTime : payload?.startTime || ukTime(now);
  const endTime = config.timed ? payload?.endTime : payload?.endTime || startTime;
  assertRequiredTime(startTime, "Start time");
  assertRequiredTime(endTime, "End time");
  assertTimeOrder(startTime, endTime);

  await assertAssigned(companyId, employeeId);

  const target = resolveTarget(module, payload);
  const fields = detailFields(module, { ...payload, ...target });
  assertComplete(module, fields);

  const periodKey = await resolvePeriodKey(companyId, module, logDate, target);
  const area =
    module === "kitchen_deep_clean" ? { area: deepCleanAreaFor(logDate) } : {};

  const log = {
    companyId,
    employeeId,
    module,
    frequency: config.frequency,
    status: "completed",
    logDate,
    periodKey,
    startTime,
    endTime,
    durationSeconds: (minutesOf(endTime) - minutesOf(startTime)) * 60,
    ...target,
    ...area,
    ...fields,
    signatureUrl,
    signedAt: signedAt ? new Date(signedAt) : now,
    completedAt: now,
    createdBy: authUser?._id,
    logs: [
      await historyLine(
        "create",
        employee
          ? `completed ${config.label}`
          : `created ${config.label} for ${await nameOf(employeeId)}`,
        authUser,
      ),
    ],
  };

  try {
    const result = await modelOf(module).create(log);
    return populateLog(KitchenLog.findById(result._id));
  } catch (error) {
    if (isDuplicateKey(error)) {
      throw await takenError(
        companyId,
        module,
        periodKey,
        (area as any).area || targetLabel(module, target),
      );
    }
    throw error;
  }
};

// Corrections to a completed log from the company side
const updateKitchenLogIntoDB = async (
  id: string,
  payload: any,
  authUser?: any,
) => {
  const existing: any = await KitchenLog.findById(id);

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Kitchen log not found");
  }
  if (existing.status !== "completed") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This log is still being worked on and cannot be edited yet",
    );
  }

  const module = existing.module as TKitchenModule;
  const update: Record<string, unknown> = {
    ...detailFields(module, payload, existing),
    updatedBy: authUser?._id,
  };
  assertComplete(module, { ...existing.toObject(), ...update });

  if (payload?.employeeId && String(payload.employeeId) !== String(existing.employeeId)) {
    await assertAssigned(String(existing.companyId), payload.employeeId);
    update.employeeId = payload.employeeId;
  }

  if (payload?.signatureUrl) {
    update.signatureUrl = payload.signatureUrl;
    update.signedAt = payload.signedAt ? new Date(payload.signedAt) : new Date();
  }

  // Either can be corrected, never cleared
  if (payload?.startTime !== undefined) {
    assertRequiredTime(payload.startTime, "Start time");
    update.startTime = payload.startTime;
  }
  if (payload?.endTime !== undefined) {
    assertRequiredTime(payload.endTime, "End time");
    update.endTime = payload.endTime;
  }
  const startTime = (update.startTime as string) ?? existing.startTime;
  const endTime = (update.endTime as string) ?? existing.endTime;
  if (
    startTime &&
    endTime &&
    (startTime !== existing.startTime || endTime !== existing.endTime)
  ) {
    assertTimeOrder(startTime, endTime);
    update.durationSeconds = (minutesOf(endTime) - minutesOf(startTime)) * 60;
  }

  await modelOf(module).findByIdAndUpdate(
    id,
    {
      ...update,
      $push: {
        logs: await historyLine("update", `updated ${KITCHEN_MODULES[module].label}`, authUser),
      },
    },
    { new: true, runValidators: true },
  );

  return populateLog(KitchenLog.findById(id));
};

// Management sign off on a completed deep clean
const approveKitchenLogIntoDB = async (
  id: string,
  payload: any,
  authUser?: any,
) => {
  const log: any = await KitchenLog.findById(id);

  if (!log) {
    throw new AppError(httpStatus.NOT_FOUND, "Kitchen log not found");
  }

  const module = log.module as TKitchenModule;
  if (!KITCHEN_MODULES[module].requiresApproval) {
    throw new AppError(httpStatus.BAD_REQUEST, "This log does not need approval");
  }
  if (log.status !== "completed") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Only a completed log can be approved",
    );
  }
  if (!payload?.approvalSignature) {
    throw new AppError(httpStatus.BAD_REQUEST, "Approval signature is required");
  }

  const result = await modelOf(module).findOneAndUpdate(
    { _id: id, approvedAt: null },
    {
      approvedBy: authUser?._id,
      approvalSignature: payload.approvalSignature,
      approvedAt: new Date(),
      approvalComment: String(payload.approvalComment || "").trim(),
      updatedBy: authUser?._id,
      $push: {
        logs: await historyLine("approve", `approved ${KITCHEN_MODULES[module].label}`, authUser),
      },
    },
    { new: true },
  );

  if (!result) {
    throw new AppError(httpStatus.CONFLICT, "This log has already been approved");
  }

  return populateLog(KitchenLog.findById(id));
};

const deleteKitchenLogFromDB = async (id: string) => {
  const result = await KitchenLog.findByIdAndDelete(id);

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Kitchen log not found");
  }

  return result;
};

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

// Completed logs of one module over a date range, oldest first. The page lays
// them out like the paper sheet of that module.
const getKitchenReportFromDB = async (query: Record<string, unknown>) => {
  const { companyId, employeeId } = query;
  const module = query.module as TKitchenModule;

  if (!companyId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Company id is required");
  }
  moduleConfig(module);
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

  const logs = await populateLog(
    KitchenLog.find({
      companyId,
      module,
      status: "completed",
      ...(employeeId ? { employeeId } : {}),
      logDate: { $gte: from.toDate(), $lte: to.toDate() },
    }).sort("logDate createdAt"),
  );

  return { module, logs };
};

export const KitchenLogServices = {
  getAllKitchenLogFromDB,
  getApprovalCountsFromDB,
  getKitchenBoardFromDB,
  getSingleKitchenLogFromDB,
  getKitchenReportFromDB,
  startKitchenLogIntoDB,
  saveKitchenLogProgressIntoDB,
  stopKitchenLogIntoDB,
  completeKitchenLogIntoDB,
  discardKitchenLogFromDB,
  createKitchenLogIntoDB,
  updateKitchenLogIntoDB,
  approveKitchenLogIntoDB,
  deleteKitchenLogFromDB,
};
