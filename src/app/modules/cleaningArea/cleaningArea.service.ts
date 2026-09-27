/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";

import AppError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { CleaningArea } from "./cleaningArea.model";
import { TCleaningArea } from "./cleaningArea.interface";
import { CleaningAreaSearchableFields } from "./cleaningArea.constant";
import { CleaningElement } from "../cleaningElement/cleaningElement.model";

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
    counts.map((item: any) => [String(item._id), item.totalElement])
  );

  const resultWithCounts = result.map((area: any) => ({
    ...area.toObject(),
    totalElement: countMap.get(String(area._id)) || 0,
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
  payload: Partial<TCleaningArea>
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
