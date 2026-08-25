import { RequestHandler } from "express";
import httpStatus from "http-status";

import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { ManageEmployeeServices } from "./manageEmployee.service";

const getAllCompanyDailyWorkFlowAccess: RequestHandler = catchAsync(
  async (req, res) => {
    const result =
      await ManageEmployeeServices.getAllCompanyDailyWorkFlowAccessFromDB(
        req.query
      );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Company daily work flow accesses retrieved successfully",
      data: result,
    });
  }
);

const getSingleCompanyDailyWorkFlowAccess = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result =
    await ManageEmployeeServices.getSingleCompanyDailyWorkFlowAccessFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Company daily work flow access retrieved successfully",
    data: result,
  });
});

const getCompanyDailyWorkFlowAccessByCompany = catchAsync(async (req, res) => {
  const { companyId } = req.params;
  const result =
    await ManageEmployeeServices.getCompanyDailyWorkFlowAccessByCompanyFromDB(
      companyId
    );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Company daily work flow access retrieved successfully",
    data: result,
  });
});

const createCompanyDailyWorkFlowAccess = catchAsync(async (req, res) => {
  const result =
    await ManageEmployeeServices.createCompanyDailyWorkFlowAccessIntoDB(
      req.body
    );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Company daily work flow access created successfully",
    data: result,
  });
});

const upsertCompanyDailyWorkFlowAccessByCompany = catchAsync(
  async (req, res) => {
    const { companyId } = req.params;
    const result =
      await ManageEmployeeServices.upsertCompanyDailyWorkFlowAccessByCompanyIntoDB(
        companyId,
        req.body
      );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Company daily work flow access saved successfully",
      data: result,
    });
  }
);

const updateCompanyDailyWorkFlowAccess = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result =
    await ManageEmployeeServices.updateCompanyDailyWorkFlowAccessIntoDB(
      id,
      req.body
    );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Company daily work flow access updated successfully",
    data: result,
  });
});

const deleteCompanyDailyWorkFlowAccess = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result =
    await ManageEmployeeServices.deleteCompanyDailyWorkFlowAccessFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Company daily work flow access deleted successfully",
    data: result,
  });
});

export const ManageEmployeeControllers = {
  getAllCompanyDailyWorkFlowAccess,
  getSingleCompanyDailyWorkFlowAccess,
  getCompanyDailyWorkFlowAccessByCompany,
  createCompanyDailyWorkFlowAccess,
  upsertCompanyDailyWorkFlowAccessByCompany,
  updateCompanyDailyWorkFlowAccess,
  deleteCompanyDailyWorkFlowAccess,
};
