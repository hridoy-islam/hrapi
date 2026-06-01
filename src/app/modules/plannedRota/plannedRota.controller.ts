import { RequestHandler } from "express";
import httpStatus from "http-status";

import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { RotaServices } from "./plannedRota.service";

const getAllPlannedRota: RequestHandler = catchAsync(async (req, res) => {
  const result = await RotaServices.getAllPlannedRotaFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Planned Rotas retrived succesfully",
    data: result,
  });
});

const getAllMissePlannedRota: RequestHandler = catchAsync(async (req, res) => {
  const result = await RotaServices.getAllMissedPlannedRotaFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Missed Planned  Rotas retrived succesfully",
    data: result,
  });
});


const getUpcomingPlannedRota: RequestHandler = catchAsync(async (req, res) => {
  const result = await RotaServices.getUpcomingPlannedRotaFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Planned Rotas retrived succesfully",
    data: result,
  });
});

const getAttendance: RequestHandler = catchAsync(async (req, res) => {
  const result = await RotaServices.createRotaAttendanceIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Attendance succesfully Recorded",
    data: result,
  });
});

const getSinglePlannedRota = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await RotaServices.getSinglePlannedRotaFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Rota is retrieved succesfully",
    data: result,
  });
});

const updatePlannedRota = catchAsync(async (req, res) => {
  const { id } = req.params;

  const { actionUserId, ...payload } = req.body;
  const result = await RotaServices.updatePlannedRotaIntoDB(id, payload, actionUserId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Rota is updated succesfully",
    data: result,
  });
});

const createPlannedRota = catchAsync(async (req, res) => {
  const result = await RotaServices.createPlannedRotaIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: " Planned Rota Created succesfully",
    data: result,
  });
});

const deletePlannedRota = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await RotaServices.deletePlannedRotaFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Planned Rota deleted successfully",
    data: result,
  });
});

const copyPlannedRota = catchAsync(async (req, res) => {
  const result = await RotaServices.copyPlannedRotaIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Planned Rotas copied successfully",
    data: result,
  });
});

const bulkAssignPlannedRota = catchAsync(async (req, res) => {
  const result = await RotaServices.bulkAssignPlannedRotaIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Bulk assign successful",
    data: result,
  });
});

export const RotaControllers = {
  getAllPlannedRota,
  getSinglePlannedRota,
  updatePlannedRota,
  createPlannedRota,
  deletePlannedRota,
  bulkAssignPlannedRota,
  copyPlannedRota,
  getUpcomingPlannedRota,
  getAttendance,
  getAllMissePlannedRota
};
