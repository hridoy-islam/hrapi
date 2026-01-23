import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { QACheckServices } from "./QACheck.service";

const getAllQACheck: RequestHandler = catchAsync(async (req, res) => {
  const result = await QACheckServices.getAllQACheckFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "QAChecks retrived succesfully",
    data: result,
  });
});
const getSingleQACheck = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await QACheckServices.getSingleQACheckFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "QACheck is retrieved succesfully",
    data: result,
  });
});

const updateQACheck = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await QACheckServices.updateQACheckIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "QACheck is updated succesfully",
    data: result,
  });
});

const createQACheck: RequestHandler = catchAsync(async (req, res) => {
  const result = await QACheckServices.createQACheckIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "QACheck created successfully",
    data: result,
  });
});

export const QACheckControllers = {
  getAllQACheck,
  getSingleQACheck,
  updateQACheck,
  createQACheck
  
};
