import httpStatus from "http-status";

import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { CleaningAreaServices } from "./cleaningArea.service";

const getAllCleaningArea = catchAsync(async (req, res) => {
  const result = await CleaningAreaServices.getAllCleaningAreaFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Areas retrieved succesfully",
    data: result,
  });
});

const getSingleCleaningArea = catchAsync(async (req, res) => {
  const result = await CleaningAreaServices.getSingleCleaningAreaFromDB(
    req.params.id
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Area retrieved succesfully",
    data: result,
  });
});

const createCleaningArea = catchAsync(async (req, res) => {
  const result = await CleaningAreaServices.createCleaningAreaIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Area created succesfully",
    data: result,
  });
});

const updateCleaningArea = catchAsync(async (req, res) => {
  const result = await CleaningAreaServices.updateCleaningAreaIntoDB(
    req.params.id,
    req.body
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Area updated succesfully",
    data: result,
  });
});

const deleteCleaningArea = catchAsync(async (req, res) => {
  const result = await CleaningAreaServices.deleteCleaningAreaFromDB(
    req.params.id
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Area deleted succesfully",
    data: result,
  });
});

export const CleaningAreaControllers = {
  getAllCleaningArea,
  getSingleCleaningArea,
  createCleaningArea,
  updateCleaningArea,
  deleteCleaningArea,
};
