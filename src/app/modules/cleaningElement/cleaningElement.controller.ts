import httpStatus from "http-status";

import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { CleaningElementServices } from "./cleaningElement.service";

const getAllCleaningElement = catchAsync(async (req, res) => {
  const result = await CleaningElementServices.getAllCleaningElementFromDB(
    req.query
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Elements retrieved succesfully",
    data: result,
  });
});

const createCleaningElement = catchAsync(async (req, res) => {
  const result = await CleaningElementServices.createCleaningElementIntoDB(
    req.body
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Element created succesfully",
    data: result,
  });
});

const updateCleaningElement = catchAsync(async (req, res) => {
  const result = await CleaningElementServices.updateCleaningElementIntoDB(
    req.params.id,
    req.body
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Element updated succesfully",
    data: result,
  });
});

const deleteCleaningElement = catchAsync(async (req, res) => {
  const result = await CleaningElementServices.deleteCleaningElementFromDB(
    req.params.id
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Element deleted succesfully",
    data: result,
  });
});

export const CleaningElementControllers = {
  getAllCleaningElement,
  createCleaningElement,
  updateCleaningElement,
  deleteCleaningElement,
};
