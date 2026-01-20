import { RequestHandler } from "express";
import httpStatus from "http-status";
import { ScheduleCheckStatuServices } from "./scheduleCheckStatus.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

// --- 1. Get Overall Stats (Counts only) ---
const getAllScheduleCheckStatus: RequestHandler = catchAsync(async (req, res) => {
  const { companyId } = req.params;
  const result = await ScheduleCheckStatuServices.getCompanyComplianceStats(companyId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Schedule Check status retrieved successfully",
    data: result,
  });
});

// --- 2. Get Passport Non-Compliant List ---
const getPassportStatusList: RequestHandler = catchAsync(async (req, res) => {
  const { companyId } = req.params;
  const result = await ScheduleCheckStatuServices.getPassportComplianceList(companyId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Passport compliance list retrieved successfully",
    data: result,
  });
});

// --- 3. Get Visa Non-Compliant List ---
const getVisaStatusList: RequestHandler = catchAsync(async (req, res) => {
  const { companyId } = req.params;
  const result = await ScheduleCheckStatuServices.getVisaComplianceList(companyId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Visa compliance list retrieved successfully",
    data: result,
  });
});

// --- 4. Get DBS Non-Compliant List ---
const getDbsStatusList: RequestHandler = catchAsync(async (req, res) => {
  const { companyId } = req.params;
  const result = await ScheduleCheckStatuServices.getDbsComplianceList(companyId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "DBS compliance list retrieved successfully",
    data: result,
  });
});

// --- 5. Get Immigration Non-Compliant List ---
const getImmigrationStatusList: RequestHandler = catchAsync(async (req, res) => {
  const { companyId } = req.params;
  const result = await ScheduleCheckStatuServices.getImmigrationComplianceList(companyId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Immigration compliance list retrieved successfully",
    data: result,
  });
});

// --- 6. Get Appraisal Non-Compliant List ---
const getAppraisalStatusList: RequestHandler = catchAsync(async (req, res) => {
  const { companyId } = req.params;
  const result = await ScheduleCheckStatuServices.getAppraisalComplianceList(companyId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Appraisal compliance list retrieved successfully",
    data: result,
  });
});

// --- 7. Get RTW (Right To Work) Non-Compliant List ---
const getRtwStatusList: RequestHandler = catchAsync(async (req, res) => {
  const { companyId } = req.params;
  const result = await ScheduleCheckStatuServices.getRtwComplianceList(companyId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Right to Work compliance list retrieved successfully",
    data: result,
  });
});

export const ScheduleCheckStatusControllers = {
  getAllScheduleCheckStatus,
  getPassportStatusList,
  getVisaStatusList,
  getDbsStatusList,
  getImmigrationStatusList,
  getAppraisalStatusList,
  getRtwStatusList,
};