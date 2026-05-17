import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { CompanyPolicyServices } from "./companyPolicy.service";

const getAllCompanyPolicy: RequestHandler = catchAsync(async (req, res) => {
  const result = await CompanyPolicyServices.getAllCompanyPolicyFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "CompanyPolicys retrived succesfully",
    data: result,
  });
});
const getSingleCompanyPolicy = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CompanyPolicyServices.getSingleCompanyPolicyFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "CompanyPolicy is retrieved succesfully",
    data: result,
  });
});

const updateCompanyPolicy = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CompanyPolicyServices.updateCompanyPolicyIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "CompanyPolicy is updated succesfully",
    data: result,
  });
});

const createCompanyPolicy: RequestHandler = catchAsync(async (req, res) => {
  const result = await CompanyPolicyServices.createCompanyPolicyIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "CompanyPolicy created successfully",
    data: result,
  });
});


const deleteCompanyPolicy = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CompanyPolicyServices.deleteCompanyPolicyFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "CompanyPolicy is deleted succesfully",
    data: result,
  });
});


export const CompanyPolicyControllers = {
  getAllCompanyPolicy,
  getSingleCompanyPolicy,
  updateCompanyPolicy,
  createCompanyPolicy,
  deleteCompanyPolicy
  
};
