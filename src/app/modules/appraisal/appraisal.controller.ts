import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { AppraisalServices } from "./appraisal.service";

const getAllAppraisal: RequestHandler = catchAsync(async (req, res) => {
  const result = await AppraisalServices.getAllAppraisalFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Appraisals retrived succesfully",
    data: result,
  });
});
const getSingleAppraisal = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await AppraisalServices.getSingleAppraisalFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Appraisal is retrieved succesfully",
    data: result,
  });
});

const updateAppraisal = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await AppraisalServices.updateAppraisalIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Appraisal is updated succesfully",
    data: result,
  });
});

const createAppraisal: RequestHandler = catchAsync(async (req, res) => {
  const result = await AppraisalServices.createAppraisalIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Appraisal created successfully",
    data: result,
  });
});

export const AppraisalControllers = {
  getAllAppraisal,
  getSingleAppraisal,
  updateAppraisal,
  createAppraisal
  
};
