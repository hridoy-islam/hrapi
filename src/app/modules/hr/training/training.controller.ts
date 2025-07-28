import { RequestHandler } from "express";
import httpStatus from "http-status";

import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { TrainingServices } from "./training.service";

const getAllTraining: RequestHandler = catchAsync(async (req, res) => {
  const result = await TrainingServices.getAllTrainingFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Trainings retrived succesfully",
    data: result,
  });
});
const getSingleTraining = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TrainingServices.getSingleTrainingFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Training is retrieved succesfully",
    data: result,
  });
});

const updateTraining = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TrainingServices.updateTrainingIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Training is updated succesfully",
    data: result,
  });
});

const createTraining = catchAsync(async (req, res) => {
  const result = await TrainingServices.createTrainingIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Training Created succesfully",
    data: result,
  });
});

export const TrainingControllers = {
  getAllTraining,
  getSingleTraining,
  updateTraining,
  createTraining,
};
