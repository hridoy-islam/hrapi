import httpStatus from "http-status";

import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";
import { PresetTask } from "./presetTask.model";
import { TPresetTask } from "./presetTask.interface";
import { PresetTaskSearchableFields } from "./presetTask.constant";

const getAllPresetTaskFromDB = async (query: Record<string, unknown>) => {
  const presetTaskQuery = new QueryBuilder(PresetTask.find(), query)
    .search(PresetTaskSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await presetTaskQuery.countTotal();
  const result = await presetTaskQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSinglePresetTaskFromDB = async (id: string) => {
  const result = await PresetTask.findById(id);
  return result;
};

const createPresetTaskIntoDB = async (payload: TPresetTask) => {
  try {
    const result = await PresetTask.create(payload);
    return result;
  } catch (error: any) {
    console.error("Error in createPresetTaskIntoDB:", error);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to create Preset Task"
    );
  }
};

const updatePresetTaskIntoDB = async (
  id: string,
  payload: Partial<TPresetTask>
) => {
  const presetTask = await PresetTask.findById(id);

  if (!presetTask) {
    throw new AppError(httpStatus.NOT_FOUND, "Preset Task not found");
  }

  const result = await PresetTask.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};

const deletePresetTaskFromDB = async (id: string) => {
  const presetTask = await PresetTask.findById(id);

  if (!presetTask) {
    throw new AppError(httpStatus.NOT_FOUND, "Preset Task not found");
  }

  const result = await PresetTask.findByIdAndDelete(id);
  return result;
};

export const PresetTaskServices = {
  getAllPresetTaskFromDB,
  getSinglePresetTaskFromDB,
  createPresetTaskIntoDB,
  updatePresetTaskIntoDB,
  deletePresetTaskFromDB,
};
