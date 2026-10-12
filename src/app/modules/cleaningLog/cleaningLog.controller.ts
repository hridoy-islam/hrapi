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

const getActiveCleaningLogs = catchAsync(async (req, res) => {
  const result = await CleaningLogServices.getActiveCleaningLogsFromDB(
    req.query,
    req.user
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Active cleaning sessions retrieved succesfully",
    data: result,
  });
});

const getCleaningReport = catchAsync(async (req, res) => {
  const result = await CleaningLogServices.getCleaningReportFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Cleaning report retrieved succesfully",
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
    message: "Cleaning log created succesfully",
    data: result,
  });
});

const startCleaningLog = catchAsync(async (req, res) => {
  const result = await CleaningLogServices.startCleaningLogIntoDB(
    req.body,
    req.user
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Cleaning started succesfully",
    data: result,
  });
});

const pauseCleaningLog = catchAsync(async (req, res) => {
  const result = await CleaningLogServices.pauseCleaningLogIntoDB(
    req.params.id,
    req.body,
    req.user
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Cleaning paused succesfully",
    data: result,
  });
});

const resumeCleaningLog = catchAsync(async (req, res) => {
  const result = await CleaningLogServices.resumeCleaningLogIntoDB(
    req.params.id,
    req.body,
    req.user
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Cleaning resumed succesfully",
    data: result,
  });
});

const stopCleaningLog = catchAsync(async (req, res) => {
  const result = await CleaningLogServices.stopCleaningLogIntoDB(
    req.params.id,
    req.body,
    req.user
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Cleaning stopped succesfully",
    data: result,
  });
});

const completeCleaningLog = catchAsync(async (req, res) => {
  const result = await CleaningLogServices.completeCleaningLogIntoDB(
    req.params.id,
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

const updateCleaningLogItems = catchAsync(async (req, res) => {
  const result = await CleaningLogServices.updateCleaningLogItemsIntoDB(
    req.params.id,
    req.body,
    req.user
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Checklist saved succesfully",
    data: result,
  });
});

const discardCleaningLog = catchAsync(async (req, res) => {
  const result = await CleaningLogServices.discardCleaningLogFromDB(
    req.params.id,
    req.user
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Cleaning session discarded succesfully",
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
  getActiveCleaningLogs,
  getCleaningReport,
  getSingleCleaningLog,
  createCleaningLog,
  startCleaningLog,
  pauseCleaningLog,
  resumeCleaningLog,
  stopCleaningLog,
  completeCleaningLog,
  updateCleaningLogItems,
  discardCleaningLog,
  updateCleaningLog,
  deleteCleaningLog,
};
