import { RequestHandler } from "express";
import httpStatus from "http-status";

import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { PresetTaskServices } from "./presetTask.service";

const getAllPresetTask: RequestHandler = catchAsync(async (req, res) => {
  const result = await PresetTaskServices.getAllPresetTaskFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Preset Tasks retrieved succesfully",
    data: result,
  });
});

const getSinglePresetTask = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PresetTaskServices.getSinglePresetTaskFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Preset Task is retrieved succesfully",
    data: result,
  });
});

const updatePresetTask = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PresetTaskServices.updatePresetTaskIntoDB(
    id,
    req.body
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Preset Task is updated succesfully",
    data: result,
  });
});

const createPresetTask = catchAsync(async (req, res) => {
  const result = await PresetTaskServices.createPresetTaskIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Preset Task Created succesfully",
    data: result,
  });
});

const deletePresetTask = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PresetTaskServices.deletePresetTaskFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Preset Task is deleted succesfully",
    data: result,
  });
});

export const PresetTaskControllers = {
  getAllPresetTask,
  getSinglePresetTask,
  updatePresetTask,
  createPresetTask,
  deletePresetTask,
};
