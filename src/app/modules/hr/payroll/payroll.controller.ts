import { RequestHandler } from "express";
import httpStatus from "http-status";

import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { PayrollServices } from "./payroll.service";

const getAllPayroll: RequestHandler = catchAsync(async (req, res) => {
  const result = await PayrollServices.getPayrollFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payrolls retrieved successfully",
    data: result,
  });
});

const getSinglePayroll = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PayrollServices.getSinglePayrollFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payroll is retrieved successfully",
    data: result,
  });
});

const deleteSinglePayroll = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PayrollServices.deletePayrollIntoDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payroll is deleted successfully",
    data: result,
  });
});

const updatePayroll = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PayrollServices.updatePayrollIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payroll is updated successfully",
    data: result,
  });
});

// ─── BACKGROUND JOB: Create Payroll ─────────────────────────────────────────
const createPayroll = catchAsync(async (req, res) => {
  // ✅ Call the ENQUEUE service, not the heavy DB service
  const result = await PayrollServices.enqueueCreatePayroll(req.body);
  
  sendResponse(res, {
    statusCode: httpStatus.ACCEPTED, // 202 Accepted
    success: true,
    message: result.message,
    data: result,
  });
});

// ─── BACKGROUND JOB: Regenerate Payroll ─────────────────────────────────────
const regeneratePayroll = catchAsync(async (req, res) => {
  // ✅ Call the ENQUEUE service, not the heavy DB service
  const result = await PayrollServices.enqueueRegeneratePayroll(req.body);

  sendResponse(res,{
    success: true,
    statusCode: httpStatus.ACCEPTED, // 202 Accepted
    message: result.message,
    data: result,
  });
});

const getPayrollByBatch = catchAsync(async (req, res) => {
  const result = await PayrollServices.getCompanyPayrollByBatchFromDB(req.query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payroll batches retrieved successfully",
    data: result.result,  // array of batches
  });
});

export const PayrollControllers = {
    createPayroll,
    getAllPayroll,
    getSinglePayroll,
    updatePayroll,
    getPayrollByBatch,
    regeneratePayroll,
    deleteSinglePayroll
};