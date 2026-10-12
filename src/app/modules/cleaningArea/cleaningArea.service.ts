/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";

import AppError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { CleaningArea } from "./cleaningArea.model";
import { TCleaningArea } from "./cleaningArea.interface";
import {
  CleaningAreaSearchableFields,
  cleaningPeriod,
  OPEN_LOG_STATUSES,
} from "./cleaningArea.constant";
import { CleaningElement } from "../cleaningElement/cleaningElement.model";
import { CleaningLog } from "../cleaningLog/cleaningLog.model";

// The log that holds each area for the period `date` falls in: `completion`
// once it is done, `inProgress` while someone is still working on it.
// `excludeLogId` leaves out the log being edited, so it does not block itself.
const completionsFor = async (
  areas: any[],
  date: Date | string,
  excludeLogId?: string,
) => {
  const completions = new Map<string, any>();
  const inProgress = new Map<string, any>();

  await Promise.all(
    ["daily", "monthly"].map(async (type) => {
      const areaIds = areas
        .filter((area) => area.type === type)
        .map((area) => area._id);
      if (areaIds.length === 0) return;

      const logs = await CleaningLog.find({
        areaId: { $in: areaIds },
        createdAt: cleaningPeriod(type, date),
        ...(excludeLogId ? { _id: { $ne: excludeLogId } } : {}),
      })
        .select("areaId employeeId status sessions durationSeconds createdAt completedAt")
        .populate("employeeId", "firstName lastName name email")
        .sort("createdAt");

      // The first log of the period is the one that holds it
      logs.forEach((log: any) => {
        const key = String(log.areaId);
        if (completions.has(key) || inProgress.has(key)) return;

        if (OPEN_LOG_STATUSES.includes(log.status)) {
          inProgress.set(key, {
            logId: log._id,
            employeeId: log.employeeId,
            status: log.status,
            startedAt: log.createdAt,
          });
        } else {
          completions.set(key, {
            logId: log._id,
            employeeId: log.employeeId,
            completedAt: log.completedAt || log.createdAt,
          });
        }
      });
    }),
  );

  return { completions, inProgress };
};

const getAllCleaningAreaFromDB = async (query: Record<string, unknown>) => {
  const filter: Record<string, unknown> = {};

  const { companyId, type } = query;
  if (companyId) filter.companyId = companyId;
  if (type) filter.type = type;

  const areaQuery = new QueryBuilder(CleaningArea.find(filter), {
    sort: "areaName",
    ...query,
  })
    .search(CleaningAreaSearchableFields)
    .sort()
    .paginate()
    .fields();

  const meta = await areaQuery.countTotal();
  const result = await areaQuery.modelQuery;

  // Element counters, so the area tables show what each area holds
  const areaIds = result.map((area: any) => area._id);
  const counts = await CleaningElement.aggregate([
    { $match: { areaId: { $in: areaIds } } },
    { $group: { _id: "$areaId", totalElement: { $sum: 1 } } },
  ]);

  const countMap = new Map(
    counts.map((item: any) => [String(item._id), item.totalElement]),
  );

  // Asked for by the log form, so it can lock areas already done or being
  // worked on this day (daily) or month (monthly)
  const holds =
    String(query.withCompletion) === "true"
      ? await completionsFor(
          result,
          (query.completionDate as string) || new Date(),
          query.excludeLogId as string | undefined,
        )
      : null;

  const resultWithCounts = result.map((area: any) => ({
    ...area.toObject(),
    totalElement: countMap.get(String(area._id)) || 0,
    ...(holds
      ? {
          completion: holds.completions.get(String(area._id)) || null,
          inProgress: holds.inProgress.get(String(area._id)) || null,
        }
      : {}),
  }));

  return { meta, result: resultWithCounts };
};

const getSingleCleaningAreaFromDB = async (id: string) => {
  const result = await CleaningArea.findById(id);

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Area not found");
  }

  return result;
};

const createCleaningAreaIntoDB = async (payload: Partial<TCleaningArea>) => {
  if (!payload.companyId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Company id is required");
  }

  return CleaningArea.create(payload);
};

const updateCleaningAreaIntoDB = async (
  id: string,
  payload: Partial<TCleaningArea>,
) => {
  // The owning company never moves
  const { companyId: _ignoredCompany, ...data } = payload as any;

  const result = await CleaningArea.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Area not found");
  }

  return result;
};

const deleteCleaningAreaFromDB = async (id: string) => {
  const area = await CleaningArea.findById(id);

  if (!area) {
    throw new AppError(httpStatus.NOT_FOUND, "Area not found");
  }

  // Elements belong to the area, so they go with it. Submitted logs keep
  // their own copy of the area and element text and are left untouched.
  await CleaningElement.deleteMany({ areaId: id });
  return CleaningArea.findByIdAndDelete(id);
};

export const CleaningAreaServices = {
  getAllCleaningAreaFromDB,
  getSingleCleaningAreaFromDB,
  createCleaningAreaIntoDB,
  updateCleaningAreaIntoDB,
  deleteCleaningAreaFromDB,
};
