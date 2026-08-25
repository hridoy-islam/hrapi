import { RequestHandler } from "express";
;
import httpStatus from "http-status";


import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { PayslipDocServices } from "./payslipDoc.service";


const getAllPayslipDoc: RequestHandler = catchAsync(async (req, res) => {
  const result = await PayslipDocServices.getAllPayslipDocFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payslip documents retrieved successfully",
    data: result,
  });
});
const getSinglePayslipDoc = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PayslipDocServices.getSinglePayslipDocFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payslip document is retrieved successfully",
    data: result,
  });
});



const updatePayslipDoc = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PayslipDocServices.updatePayslipDocIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payslip document is updated successfully",
    data: result,
  });
});

const createPayslipDoc = catchAsync(async (req, res) => {
  
  const result = await PayslipDocServices.createPayslipDocIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payslip document created successfully",
    data: result,
  });
});

const deletePayslipDoc = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PayslipDocServices.deletePayslipDocFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payslip document deleted successfully",
    data: result,
  });
});


const copyPayslipDoc = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { targetFolderId } = req.body || {};
  const result = await PayslipDocServices.copyPayslipDocIntoDB(
    id,
    targetFolderId ?? null
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Payslip document copied successfully",
    data: result,
  });
});

const movePayslipDoc = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { targetFolderId } = req.body || {};
  const result = await PayslipDocServices.movePayslipDocIntoDB(
    id,
    targetFolderId ?? null
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payslip document moved successfully",
    data: result,
  });
});


export const PayslipDocControllers = {
  getAllPayslipDoc,
  getSinglePayslipDoc,
  updatePayslipDoc,
  createPayslipDoc,
  deletePayslipDoc,
  copyPayslipDoc,
  movePayslipDoc,
};

