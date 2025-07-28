import { RequestHandler } from "express";
;
import httpStatus from "http-status";

import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { AttendanceServices } from "./attendance.service";

const getAllAttendance: RequestHandler = catchAsync(async (req, res) => {
  const result = await AttendanceServices.getAttendanceFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Attendances retrived succesfully",
    data: result,
  });
});

const getSingleAttendance = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await AttendanceServices.getSingleAttendanceFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Attendance is retrieved succesfully",
    data: result,
  });
});

const updateAttendance = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await AttendanceServices.updateAttendanceIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Attendance is updated succesfully",
    data: result,
  });
});


const clockOutAttendance = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await AttendanceServices.updateAttendanceIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Clocked Out succesfully",
    data: result,
  });
});

const createAttendance = catchAsync(async (req, res) => {
  
  const result = await AttendanceServices.createAttendanceIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Attendance Created succesfully",
    data: result,
  });
});

export const AttendanceControllers = {
    createAttendance,
    getAllAttendance,
    getSingleAttendance,
    clockOutAttendance,
    updateAttendance
};

