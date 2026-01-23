import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { InductionServices } from "./induction.service";

const getAllInduction: RequestHandler = catchAsync(async (req, res) => {
  const result = await InductionServices.getAllInductionFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Inductions retrived succesfully",
    data: result,
  });
});
const getSingleInduction = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await InductionServices.getSingleInductionFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Induction is retrieved succesfully",
    data: result,
  });
});

const updateInduction = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await InductionServices.updateInductionIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Induction is updated succesfully",
    data: result,
  });
});

const createInduction: RequestHandler = catchAsync(async (req, res) => {
  const result = await InductionServices.createInductionIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Induction created successfully",
    data: result,
  });
});

export const InductionControllers = {
  getAllInduction,
  getSingleInduction,
  updateInduction,
  createInduction
  
};
