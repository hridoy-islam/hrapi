import httpStatus from "http-status";

import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { KitchenLogServices } from "./kitchenLog.service";

const getAllKitchenLog = catchAsync(async (req, res) => {
  const result = await KitchenLogServices.getAllKitchenLogFromDB(
    req.query,
    req.user
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Kitchen logs retrieved succesfully",
    data: result,
  });
});

const getApprovalCounts = catchAsync(async (req, res) => {
  const result = await KitchenLogServices.getApprovalCountsFromDB(
    req.query
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Approval counts retrieved succesfully",
    data: result,
  });
});

const getKitchenBoard = catchAsync(async (req, res) => {
  const result = await KitchenLogServices.getKitchenBoardFromDB(
    req.query,
    req.user
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Kitchen board retrieved succesfully",
    data: result,
  });
});

const getKitchenReport = catchAsync(async (req, res) => {
  const result = await KitchenLogServices.getKitchenReportFromDB(
    req.query
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Kitchen report retrieved succesfully",
    data: result,
  });
});

const getSingleKitchenLog = catchAsync(async (req, res) => {
  const result = await KitchenLogServices.getSingleKitchenLogFromDB(
    req.params.id,
    req.user
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Kitchen log retrieved succesfully",
    data: result,
  });
});

const startKitchenLog = catchAsync(async (req, res) => {
  const result = await KitchenLogServices.startKitchenLogIntoDB(
    req.body,
    req.user
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Kitchen log started succesfully",
    data: result,
  });
});

const saveKitchenLogProgress = catchAsync(async (req, res) => {
  const result = await KitchenLogServices.saveKitchenLogProgressIntoDB(
    req.params.id,
    req.body,
    req.user
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Kitchen log saved succesfully",
    data: result,
  });
});

const stopKitchenLog = catchAsync(async (req, res) => {
  const result = await KitchenLogServices.stopKitchenLogIntoDB(
    req.params.id,
    req.body,
    req.user
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Kitchen log stopped succesfully",
    data: result,
  });
});

const completeKitchenLog = catchAsync(async (req, res) => {
  const result = await KitchenLogServices.completeKitchenLogIntoDB(
    req.params.id,
    req.body,
    req.user
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Kitchen log completed succesfully",
    data: result,
  });
});

const discardKitchenLog = catchAsync(async (req, res) => {
  const result = await KitchenLogServices.discardKitchenLogFromDB(
    req.params.id,
    req.user
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Kitchen log discarded succesfully",
    data: result,
  });
});

const createKitchenLog = catchAsync(async (req, res) => {
  const result = await KitchenLogServices.createKitchenLogIntoDB(
    req.body,
    req.user
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Kitchen log created succesfully",
    data: result,
  });
});

const updateKitchenLog = catchAsync(async (req, res) => {
  const result = await KitchenLogServices.updateKitchenLogIntoDB(
    req.params.id,
    req.body,
    req.user
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Kitchen log updated succesfully",
    data: result,
  });
});

const approveKitchenLog = catchAsync(async (req, res) => {
  const result = await KitchenLogServices.approveKitchenLogIntoDB(
    req.params.id,
    req.body,
    req.user
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Kitchen log approved succesfully",
    data: result,
  });
});

const deleteKitchenLog = catchAsync(async (req, res) => {
  const result = await KitchenLogServices.deleteKitchenLogFromDB(
    req.params.id
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Kitchen log deleted succesfully",
    data: result,
  });
});

export const KitchenLogControllers = {
  getAllKitchenLog,
  getApprovalCounts,
  getKitchenBoard,
  getKitchenReport,
  getSingleKitchenLog,
  startKitchenLog,
  saveKitchenLogProgress,
  stopKitchenLog,
  completeKitchenLog,
  discardKitchenLog,
  createKitchenLog,
  updateKitchenLog,
  approveKitchenLog,
  deleteKitchenLog,
};
