import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { SupervisionServices } from "./supervision.service";

const getAllSupervision: RequestHandler = catchAsync(async (req, res) => {
  const result = await SupervisionServices.getAllSupervisionFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Supervisions retrived succesfully",
    data: result,
  });
});
const getSingleSupervision = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SupervisionServices.getSingleSupervisionFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Supervision is retrieved succesfully",
    data: result,
  });
});

const updateSupervision = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SupervisionServices.updateSupervisionIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Supervision is updated succesfully",
    data: result,
  });
});

const createSupervision: RequestHandler = catchAsync(async (req, res) => {
  const result = await SupervisionServices.createSupervisionIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Supervision created successfully",
    data: result,
  });
});

export const SupervisionControllers = {
  getAllSupervision,
  getSingleSupervision,
  updateSupervision,
  createSupervision
  
};
