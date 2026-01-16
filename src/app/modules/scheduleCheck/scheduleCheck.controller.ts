import { RequestHandler } from "express";
;
import httpStatus from "http-status";



import { ScheduleCheckServices } from "./scheduleCheck.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";


const getAllScheduleCheck: RequestHandler = catchAsync(async (req, res) => {
  const result = await ScheduleCheckServices.getAllScheduleCheckFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "ScheduleChecks retrived succesfully",
    data: result,
  });
});
const getSingleScheduleCheck = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ScheduleCheckServices.getSingleScheduleCheckFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "ScheduleCheck is retrieved succesfully",
    data: result,
  });
});

const updateScheduleCheck = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ScheduleCheckServices.updateScheduleCheckIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "ScheduleCheck is updated succesfully",
    data: result,
  });
});

const createScheduleCheck = catchAsync(async (req, res) => {
  
  const result = await ScheduleCheckServices.createScheduleCheckIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "ScheduleCheck Created succesfully",
    data: result,
  });
});

const deleteScheduleCheck = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ScheduleCheckServices.deleteScheduleCheckFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "ScheduleCheck deleted successfully",
    data: result,
  });
});


export const ScheduleCheckControllers = {
    getAllScheduleCheck,
    getSingleScheduleCheck,
    updateScheduleCheck,
    createScheduleCheck,
    deleteScheduleCheck
};

