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

const getSpotCheckStatusList: RequestHandler = catchAsync(async (req, res) => {
  const { companyId } = req.params;
  const result = await ScheduleCheckStatuServices.getSpotCheckComplianceList(companyId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Spot Check compliance list retrieved successfully",
    data: result,
  });
});

const getSupervisionStatusList: RequestHandler = catchAsync(async (req, res) => {
  const { companyId } = req.params;
  const result = await ScheduleCheckStatuServices.getSupervisionComplianceList(companyId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Supervision compliance list retrieved successfully",
    data: result,
  });
});

const getTrainingStatusList: RequestHandler = catchAsync(async (req, res) => {
  const { companyId } = req.params;
  const result = await ScheduleCheckStatuServices.getTrainingComplianceList(companyId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Training compliance list retrieved successfully",
    data: result,
  });
});


const getInductionStatusList: RequestHandler = catchAsync(async (req, res) => {
  const { companyId } = req.params;
  const result = await ScheduleCheckStatuServices.getInductionComplianceList(companyId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Induction compliance list retrieved successfully",
    data: result,
  });
});

const getDisciplinaryStatusList: RequestHandler = catchAsync(async (req, res) => {
  const { companyId } = req.params;
  const result = await ScheduleCheckStatuServices.getDisciplinaryComplianceList(companyId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Disciplinary compliance list retrieved successfully",
    data: result,
  });
});
const getQAStatusList: RequestHandler = catchAsync(async (req, res) => {
  const { companyId } = req.params;
  const result = await ScheduleCheckStatuServices.getQaComplianceList(companyId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Quality Assurance compliance list retrieved successfully",
    data: result,
  });
});


const getRequiredDocumentStatusList: RequestHandler = catchAsync(async (req, res) => {
  const { companyId } = req.params;
  const result =
    await ScheduleCheckStatuServices.getEmployeeDocumentComplianceList(companyId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Quality Assurance compliance list retrieved successfully",
    data: result,
  });
});

// --- Employee Matrix: Training ---
const getTrainingMatrixList: RequestHandler = catchAsync(async (req, res) => {
  const { companyId } = req.params;
  const { trainingId, employeeId, status } = req.query;
  const result = await ScheduleCheckStatuServices.getTrainingMatrix(companyId, {
    trainingId: trainingId as string | undefined,
    employeeId: employeeId as string | undefined,
    status: status as string | undefined,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Employee training matrix retrieved successfully",
    data: result,
  });
});

const getRtwMatrixList: RequestHandler = catchAsync(async (req, res) => {
  const { companyId } = req.params;
  const { employeeId, status } = req.query;
  const result = await ScheduleCheckStatuServices.getRtwMatrix(companyId, {
    employeeId: employeeId as string | undefined,
    status: status as string | undefined,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Employee RTW matrix retrieved successfully",
    data: result,
  });
});

// --- Visa Matrix ---
const getVisaMatrixList: RequestHandler = catchAsync(async (req, res) => {
  const { companyId } = req.params;
  const { employeeId, status } = req.query;
  const result = await ScheduleCheckStatuServices.getVisaMatrix(companyId, {
    employeeId: employeeId as string | undefined,
    status: status as string | undefined,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Employee Visa matrix retrieved successfully",
    data: result,
  });
});


// --- Immigration Matrix ---
const getImmigrationMatrixList: RequestHandler = catchAsync(async (req, res) => {
  const { companyId } = req.params;
  const { employeeId, status } = req.query;
  const result = await ScheduleCheckStatuServices.getImmigrationMatrix(companyId, {
    employeeId: employeeId as string | undefined,
    status: status as string | undefined,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Employee Immigration matrix retrieved successfully",
    data: result,
  });
});



// --- Passport Matrix ---
const getPassportMatrixList: RequestHandler = catchAsync(async (req, res) => {
  const { companyId } = req.params;
  const { employeeId, status } = req.query;
  const result = await ScheduleCheckStatuServices.getPassportMatrix(companyId, {
    employeeId: employeeId as string | undefined,
    status: status as string | undefined,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Employee Passport matrix retrieved successfully",
    data: result,
  });
});


// --- DBS Matrix ---
const getDbsMatrixList: RequestHandler = catchAsync(async (req, res) => {
  const { companyId } = req.params;
  const { employeeId, status } = req.query;
  const result = await ScheduleCheckStatuServices.getDbsMatrix(companyId, {
    employeeId: employeeId as string | undefined,
    status: status as string | undefined,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Employee DBS matrix retrieved successfully",
    data: result,
  });
});

// --- Appraisal Matrix ---
const getAppraisalMatrixList: RequestHandler = catchAsync(async (req, res) => {
  const { companyId } = req.params;
  const { employeeId, status } = req.query;
  const result = await ScheduleCheckStatuServices.getAppraisalMatrix(companyId, {
    employeeId: employeeId as string | undefined,
    status: status as string | undefined,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Employee Appraisal matrix retrieved successfully",
    data: result,
  });
});


// --- Spot Check Matrix ---
const getSpotCheckMatrixList: RequestHandler = catchAsync(async (req, res) => {
  const { companyId } = req.params;
  const { employeeId, status } = req.query;
  const result = await ScheduleCheckStatuServices.getSpotCheckMatrix(companyId, {
    employeeId: employeeId as string | undefined,
    status: status as string | undefined,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Employee Spot Check matrix retrieved successfully",
    data: result,
  });
});

// --- Supervision Matrix ---
const getSupervisionMatrixList: RequestHandler = catchAsync(async (req, res) => {
  const { companyId } = req.params;
  const { employeeId, status } = req.query;
  const result = await ScheduleCheckStatuServices.getSupervisionMatrix(companyId, {
    employeeId: employeeId as string | undefined,
    status: status as string | undefined,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Employee Supervision matrix retrieved successfully",
    data: result,
  });
});

// --- QA Matrix ---
const getQaMatrixList: RequestHandler = catchAsync(async (req, res) => {
  const { companyId } = req.params;
  const { employeeId, status } = req.query;
  const result = await ScheduleCheckStatuServices.getQaMatrix(companyId, {
    employeeId: employeeId as string | undefined,
    status: status as string | undefined,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Employee QA matrix retrieved successfully",
    data: result,
  });
});


// --- Induction Matrix ---
const getInductionMatrixList: RequestHandler = catchAsync(async (req, res) => {
  const { companyId } = req.params;
  const { employeeId, status } = req.query;
  const result = await ScheduleCheckStatuServices.getInductionMatrix(companyId, {
    employeeId: employeeId as string | undefined,
    status: status as string | undefined,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Employee Induction matrix retrieved successfully",
    data: result,
  });
});



// --- Disciplinary Matrix ---
const getDisciplinaryMatrixList: RequestHandler = catchAsync(async (req, res) => {
  const { companyId } = req.params;
  const { employeeId, status } = req.query;
  const result = await ScheduleCheckStatuServices.getDisciplinaryMatrix(companyId, {
    employeeId: employeeId as string | undefined,
    status: status as string | undefined,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Employee Disciplinary matrix retrieved successfully",
    data: result,
  });
});


// --- Required Documents Matrix ---
const getRequiredDocumentsMatrixList: RequestHandler = catchAsync(async (req, res) => {
  const { companyId } = req.params;
  const { employeeId, status, documentType } = req.query;
  const result = await ScheduleCheckStatuServices.getRequiredDocumentsMatrix(companyId, {
    employeeId: employeeId as string | undefined,
    status: status as string | undefined,
    documentType: documentType as string | undefined,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Employee Required Documents matrix retrieved successfully",
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
  getSpotCheckStatusList,
  getSupervisionStatusList,
  getTrainingStatusList,
  getInductionStatusList,
  getDisciplinaryStatusList,
  getQAStatusList,
  getRequiredDocumentStatusList,
  getTrainingMatrixList,
  getRtwMatrixList,
  getVisaMatrixList,
  getImmigrationMatrixList,
  getPassportMatrixList,
  getDbsMatrixList,
  getAppraisalMatrixList,
  getSpotCheckMatrixList,
  getSupervisionMatrixList,
  getQaMatrixList,
  getInductionMatrixList,
  getDisciplinaryMatrixList,
  getRequiredDocumentsMatrixList
};