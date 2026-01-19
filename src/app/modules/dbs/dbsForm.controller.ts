import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { DbsFormServices } from "./dbsForm.service";

const getAllDbsForm: RequestHandler = catchAsync(async (req, res) => {
  const result = await DbsFormServices.getAllDbsFormFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "DbsForms retrived succesfully",
    data: result,
  });
});
const getSingleDbsForm = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await DbsFormServices.getSingleDbsFormFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "DbsForm is retrieved succesfully",
    data: result,
  });
});

const updateDbsForm = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await DbsFormServices.updateDbsFormIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "DbsForm is updated succesfully",
    data: result,
  });
});

const createDbsForm: RequestHandler = catchAsync(async (req, res) => {
  const result = await DbsFormServices.createDbsFormIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "DbsForm created successfully",
    data: result,
  });
});

export const DbsFormControllers = {
  getAllDbsForm,
  getSingleDbsForm,
  updateDbsForm,
  createDbsForm
  
};
