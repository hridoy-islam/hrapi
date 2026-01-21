import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { SpotCheckServices } from "./spotCheck.service";

const getAllSpotCheck: RequestHandler = catchAsync(async (req, res) => {
  const result = await SpotCheckServices.getAllSpotCheckFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "SpotChecks retrived succesfully",
    data: result,
  });
});
const getSingleSpotCheck = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SpotCheckServices.getSingleSpotCheckFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "SpotCheck is retrieved succesfully",
    data: result,
  });
});

const updateSpotCheck = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SpotCheckServices.updateSpotCheckIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "SpotCheck is updated succesfully",
    data: result,
  });
});

const createSpotCheck: RequestHandler = catchAsync(async (req, res) => {
  const result = await SpotCheckServices.createSpotCheckIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "SpotCheck created successfully",
    data: result,
  });
});

export const SpotCheckControllers = {
  getAllSpotCheck,
  getSingleSpotCheck,
  updateSpotCheck,
  createSpotCheck
  
};
