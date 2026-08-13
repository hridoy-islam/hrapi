import { RequestHandler } from "express";
;
import httpStatus from "http-status";


import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AuditServices } from "./audit.service";


const getAllAudit: RequestHandler = catchAsync(async (req, res) => {
  const result = await AuditServices.getAllAuditFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Audits retrived succesfully",
    data: result,
  });
});
const getSingleAudit = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await AuditServices.getSingleAuditFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Audit is retrieved succesfully",
    data: result,
  });
});



const updateAudit = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await AuditServices.updateAuditIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Audit is updated succesfully",
    data: result,
  });
});

const createAudit = catchAsync(async (req, res) => {
  
  const result = await AuditServices.createAuditIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Audit Created succesfully",
    data: result,
  });
});

const deleteAudit = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await AuditServices.deleteAuditFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Audit deleted successfully",
    data: result,
  });
});


export const AuditControllers = {
  getAllAudit,
  getSingleAudit,
  updateAudit,
  createAudit,
  deleteAudit,
};

