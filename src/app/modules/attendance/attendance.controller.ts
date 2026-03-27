import { RequestHandler } from "express";
;
import httpStatus from "http-status";

import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
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
  
  const { actionUserId, ...payload } = req.body;

  // Pass id, payload, and actionUserId to the service
  const result = await AttendanceServices.updateAttendanceIntoDB(
    id, 
    payload, 
    actionUserId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Attendance is updated succesfully",
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

const getCompanyEmployeesLatestAttendance = catchAsync(async (req, res) => {
  const result = await AttendanceServices.getCompanyEmployeesLatestAttendance(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Company employees latest attendance retrieved successfully",
    data: result,
  });
});


const getCompanyServiceUsersLatestAttendance = catchAsync(async (req, res) => {
  const result = await AttendanceServices.getCompanyServiceUsersLatestAttendance(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Company service users latest attendance retrieved successfully",
    data: result,
  });
});

const getCompanyVisitorsLatestAttendance = catchAsync(async (req, res) => {
  const result = await AttendanceServices.getCompanyVisitorsLatestAttendance(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Company visitors latest attendance retrieved successfully",
    data: result,
  });
});
export const AttendanceControllers = {
    createAttendance,
    getAllAttendance,
    getSingleAttendance,
    
    updateAttendance,
    getCompanyEmployeesLatestAttendance,
    getCompanyServiceUsersLatestAttendance,
    getCompanyVisitorsLatestAttendance
};

