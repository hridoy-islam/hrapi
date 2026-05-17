import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { HealthAndSafetyServices } from "./healthAndSafety.service";

const getAllHealthAndSafety: RequestHandler = catchAsync(async (req, res) => {
  const result = await HealthAndSafetyServices.getAllHealthAndSafetyFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "HealthAndSafetys retrived succesfully",
    data: result,
  });
});
const getSingleHealthAndSafety = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await HealthAndSafetyServices.getSingleHealthAndSafetyFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "HealthAndSafety is retrieved succesfully",
    data: result,
  });
});

const updateHealthAndSafety = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await HealthAndSafetyServices.updateHealthAndSafetyIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "HealthAndSafety is updated succesfully",
    data: result,
  });
});

const createHealthAndSafety: RequestHandler = catchAsync(async (req, res) => {
  const result = await HealthAndSafetyServices.createHealthAndSafetyIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "HealthAndSafety created successfully",
    data: result,
  });
});


const deleteHealthAndSafety = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await HealthAndSafetyServices.deleteHealthAndSafetyFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "HealthAndSafety is deleted succesfully",
    data: result,
  });
});


export const HealthAndSafetyControllers = {
  getAllHealthAndSafety,
  getSingleHealthAndSafety,
  updateHealthAndSafety,
  createHealthAndSafety,
  deleteHealthAndSafety
  
};
