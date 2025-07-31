import { RequestHandler } from "express";
;
import httpStatus from "http-status";

import { LeaveServices } from "./leave.service";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";

const getAllLeave: RequestHandler = catchAsync(async (req, res) => {
  const result = await LeaveServices.getAllLeaveFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Leaves retrived succesfully",
    data: result,
  });
});
const getSingleLeave = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await LeaveServices.getSingleLeaveFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Leave is retrieved succesfully",
    data: result,
  });
});

const updateLeave = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await LeaveServices.updateLeaveIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Leave is updated succesfully",
    data: result,
  });
});

const createLeave = catchAsync(async (req, res) => {
  
  const result = await LeaveServices.createLeaveIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Leave Created succesfully",
    data: result,
  });
});



export const LeaveControllers = {
    getAllLeave,
    getSingleLeave,
    updateLeave,
    createLeave
};

