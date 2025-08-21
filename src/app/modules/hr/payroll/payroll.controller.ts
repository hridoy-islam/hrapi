import { RequestHandler } from "express";
;
import httpStatus from "http-status";

import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { PayrollServices } from "./payroll.service";

const getAllPayroll: RequestHandler = catchAsync(async (req, res) => {
  const result = await PayrollServices.getPayrollFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payrolls retrived succesfully",
    data: result,
  });
});

const getSinglePayroll = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PayrollServices.getSinglePayrollFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payroll is retrieved succesfully",
    data: result,
  });
});

const updatePayroll = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PayrollServices.updatePayrollIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payroll is updated succesfully",
    data: result,
  });
});




const createPayroll = catchAsync(async (req, res) => {
  
  const result = await PayrollServices.createPayrollIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payroll Created succesfully",
    data: result,
  });
});

export const PayrollControllers = {
    createPayroll,
    getAllPayroll,
    getSinglePayroll,
    updatePayroll
};

