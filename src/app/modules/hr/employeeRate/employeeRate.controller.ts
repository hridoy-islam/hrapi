import { RequestHandler } from "express";
;
import httpStatus from "http-status";


import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { EmployeeRateServices } from "./employeeRate.service";


const getAllEmployeeRate: RequestHandler = catchAsync(async (req, res) => {
  const result = await EmployeeRateServices.getAllEmployeeRateFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "EmployeeRates retrived succesfully",
    data: result,
  });
});
const getSingleEmployeeRate = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await EmployeeRateServices.getSingleEmployeeRateFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "EmployeeRate is retrieved succesfully",
    data: result,
  });
});

const updateEmployeeRate = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await EmployeeRateServices.updateEmployeeRateIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "EmployeeRate is updated succesfully",
    data: result,
  });
});

const createEmployeeRate = catchAsync(async (req, res) => {
  
  const result = await EmployeeRateServices.createEmployeeRateIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "EmployeeRate Created succesfully",
    data: result,
  });
});

const deleteEmployeeRate = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await EmployeeRateServices.deleteEmployeeRateFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "EmployeeRate deleted successfully",
    data: result,
  });
});


export const EmployeeRateControllers = {
    getAllEmployeeRate,
    getSingleEmployeeRate,
    updateEmployeeRate,
    createEmployeeRate,
    deleteEmployeeRate
};

