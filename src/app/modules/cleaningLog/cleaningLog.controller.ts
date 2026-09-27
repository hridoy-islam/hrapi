import httpStatus from "http-status";

import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { CleaningLogServices } from "./cleaningLog.service";

const getAllCleaningLog = catchAsync(async (req, res) => {
  const result = await CleaningLogServices.getAllCleaningLogFromDB(
    req.query,
    req.user
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Cleaning logs retrieved succesfully",
    data: result,
  });
});

const getSingleCleaningLog = catchAsync(async (req, res) => {
  const result = await CleaningLogServices.getSingleCleaningLogFromDB(
    req.params.id,
    req.user
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Cleaning log retrieved succesfully",
    data: result,
  });
});

const createCleaningLog = catchAsync(async (req, res) => {
  const result = await CleaningLogServices.createCleaningLogIntoDB(
    req.body,
    req.user
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Cleaning log submitted succesfully",
    data: result,
  });
});

const updateCleaningLog = catchAsync(async (req, res) => {
  const result = await CleaningLogServices.updateCleaningLogIntoDB(
    req.params.id,
    req.body,
    req.user
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Cleaning log updated succesfully",
    data: result,
  });
});

const deleteCleaningLog = catchAsync(async (req, res) => {
  const result = await CleaningLogServices.deleteCleaningLogFromDB(
    req.params.id
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Cleaning log deleted succesfully",
    data: result,
  });
});

export const CleaningLogControllers = {
  getAllCleaningLog,
  getSingleCleaningLog,
  createCleaningLog,
  updateCleaningLog,
  deleteCleaningLog,
};
