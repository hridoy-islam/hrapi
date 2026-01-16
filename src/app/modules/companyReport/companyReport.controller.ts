import { RequestHandler } from "express";
;
import httpStatus from "http-status";



import { CompanyReportServices } from "./companyReport.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";


const getAllCompanyReport: RequestHandler = catchAsync(async (req, res) => {
  const result = await CompanyReportServices.getAllCompanyReportFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "CompanyReports retrived succesfully",
    data: result,
  });
});
const getSingleCompanyReport = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CompanyReportServices.getSingleCompanyReportFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "CompanyReport is retrieved succesfully",
    data: result,
  });
});

const updateCompanyReport = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CompanyReportServices.updateCompanyReportIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "CompanyReport is updated succesfully",
    data: result,
  });
});

const createCompanyReport = catchAsync(async (req, res) => {
  
  const result = await CompanyReportServices.createCompanyReportIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "CompanyReport Created succesfully",
    data: result,
  });
});

const deleteCompanyReport = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CompanyReportServices.deleteCompanyReportFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "CompanyReport deleted successfully",
    data: result,
  });
});


export const CompanyReportControllers = {
    getAllCompanyReport,
    getSingleCompanyReport,
    updateCompanyReport,
    createCompanyReport,
    deleteCompanyReport
};

