import { RequestHandler } from "express";
;
import httpStatus from "http-status";


import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { CompanyBranchServices } from "./companyBranch.service";


const getAllCompanyBranch: RequestHandler = catchAsync(async (req, res) => {
  const result = await CompanyBranchServices.getAllCompanyBranchFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Company Branchs retrived succesfully",
    data: result,
  });
});
const getSingleCompanyBranch = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CompanyBranchServices.getSingleCompanyBranchFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Company Branch is retrieved succesfully",
    data: result,
  });
});

const updateCompanyBranch = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CompanyBranchServices.updateCompanyBranchIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Company Branch is updated succesfully",
    data: result,
  });
});

const createCompanyBranch = catchAsync(async (req, res) => {
  
  const result = await CompanyBranchServices.createCompanyBranchIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Company Branch Created succesfully",
    data: result,
  });
});

const deleteCompanyBranch = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CompanyBranchServices.deleteCompanyBranchFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Company Branch deleted successfully",
    data: result,
  });
});


export const CompanyBranchControllers = {
    getAllCompanyBranch,
    getSingleCompanyBranch,
    updateCompanyBranch,
    createCompanyBranch,
    deleteCompanyBranch
};

