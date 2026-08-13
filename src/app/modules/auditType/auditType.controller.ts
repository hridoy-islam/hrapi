import { RequestHandler } from "express";
;
import httpStatus from "http-status";



import { AuditTypeServices } from "./auditType.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";


const getAllAuditType: RequestHandler = catchAsync(async (req, res) => {
  const result = await AuditTypeServices.getAllAuditTypeFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "AuditTypes retrived succesfully",
    data: result,
  });
});
const getSingleAuditType = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await AuditTypeServices.getSingleAuditTypeFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "AuditType is retrieved succesfully",
    data: result,
  });
});

const updateAuditType = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await AuditTypeServices.updateAuditTypeIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "AuditType is updated succesfully",
    data: result,
  });
});

const createAuditType = catchAsync(async (req, res) => {
  
  const result = await AuditTypeServices.createAuditTypeIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "AuditType Created succesfully",
    data: result,
  });
});

const deleteAuditType = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await AuditTypeServices.deleteAuditTypeFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "AuditType deleted successfully",
    data: result,
  });
});


export const AuditTypeControllers = {
    getAllAuditType,
    getSingleAuditType,
    updateAuditType,
    createAuditType,
    deleteAuditType
};

