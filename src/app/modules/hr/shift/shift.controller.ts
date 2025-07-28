import { RequestHandler } from "express";
;
import httpStatus from "http-status";


import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { ShiftServices } from "./shift.service";


const getAllShift: RequestHandler = catchAsync(async (req, res) => {
  const result = await ShiftServices.getAllShiftFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Shifts retrived succesfully",
    data: result,
  });
});
const getSingleShift = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ShiftServices.getSingleShiftFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Shift is retrieved succesfully",
    data: result,
  });
});

const updateShift = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ShiftServices.updateShiftIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Shift is updated succesfully",
    data: result,
  });
});

const createShift = catchAsync(async (req, res) => {
  
  const result = await ShiftServices.createShiftIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Shift Created succesfully",
    data: result,
  });
});

const deleteShift = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ShiftServices.deleteShiftFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Shift deleted successfully",
    data: result,
  });
});


export const ShiftControllers = {
    getAllShift,
    getSingleShift,
    updateShift,
    createShift,
    deleteShift
};

