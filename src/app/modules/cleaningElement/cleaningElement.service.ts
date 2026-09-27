/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";

import AppError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { CleaningElement } from "./cleaningElement.model";
import { TCleaningElement } from "./cleaningElement.interface";
import { CleaningArea } from "../cleaningArea/cleaningArea.model";

const getAllCleaningElementFromDB = async (query: Record<string, unknown>) => {
  const filter: Record<string, unknown> = {};

  const { companyId, areaId } = query;
  if (companyId) filter.companyId = companyId;
  if (areaId) filter.areaId = areaId;

  // Oldest first, so the checklist reads in the order it was written
  const elementQuery = new QueryBuilder(CleaningElement.find(filter), {
    sort: "createdAt",
    ...query,
  })
    .search(["element", "performanceParameter"])
    .sort()
    .paginate()
    .fields();

  const meta = await elementQuery.countTotal();
  const result = await elementQuery.modelQuery;

  return { meta, result };
};

const createCleaningElementIntoDB = async (
  payload: Partial<TCleaningElement>
) => {
  const area = await CleaningArea.findById(payload.areaId);

  if (!area) {
    throw new AppError(httpStatus.NOT_FOUND, "Area not found");
  }

  // The element always sits in the same company as its area
  return CleaningElement.create({ ...payload, companyId: area.companyId });
};

const updateCleaningElementIntoDB = async (
  id: string,
  payload: Partial<TCleaningElement>
) => {
  const {
    companyId: _ignoredCompany,
    areaId: _ignoredArea,
    ...data
  } = payload as any;

  const result = await CleaningElement.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Element not found");
  }

  return result;
};

const deleteCleaningElementFromDB = async (id: string) => {
  const result = await CleaningElement.findByIdAndDelete(id);

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Element not found");
  }

  return result;
};

export const CleaningElementServices = {
  getAllCleaningElementFromDB,
  createCleaningElementIntoDB,
  updateCleaningElementIntoDB,
  deleteCleaningElementFromDB,
};
