import { RequestHandler } from "express";
import httpStatus from "http-status";

import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { DailyWorkFlowServices } from "./dailyWorkFlow.service";

const getAllDailyWorkFlow: RequestHandler = catchAsync(async (req, res) => {
  const result = await DailyWorkFlowServices.getAllDailyWorkFlowFromDB(
    req.query
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Daily Work Flows retrieved succesfully",
    data: result,
  });
});

const getSingleDailyWorkFlow = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await DailyWorkFlowServices.getSingleDailyWorkFlowFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Daily Work Flow is retrieved succesfully",
    data: result,
  });
});

const updateDailyWorkFlow = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await DailyWorkFlowServices.updateDailyWorkFlowIntoDB(
    id,
    req.body
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Daily Work Flow is updated succesfully",
    data: result,
  });
});

const createDailyWorkFlow = catchAsync(async (req, res) => {
  const result = await DailyWorkFlowServices.createDailyWorkFlowIntoDB(
    req.body
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Daily Work Flow Created succesfully",
    data: result,
  });
});

const deleteDailyWorkFlow = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await DailyWorkFlowServices.deleteDailyWorkFlowFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Daily Work Flow is deleted succesfully",
    data: result,
  });
});

export const DailyWorkFlowControllers = {
  getAllDailyWorkFlow,
  getSingleDailyWorkFlow,
  updateDailyWorkFlow,
  createDailyWorkFlow,
  deleteDailyWorkFlow,
};
