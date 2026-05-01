import { RequestHandler } from "express";
;
import httpStatus from "http-status";


import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { LeaverServices } from "./leaver.service";

const getAllLeaver: RequestHandler = catchAsync(async (req, res) => {
  const result = await LeaverServices.getAllLeaverFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Leavers retrived succesfully",
    data: result,
  });
});
const getSingleLeaver = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await LeaverServices.getSingleLeaverFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Leaver is retrieved succesfully",
    data: result,
  });
});
const deleteSingleLeaver = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await LeaverServices.deleteSingleLeaverFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Leaver is deleted succesfully",
    data: result,
  });
});

const updateLeaver = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await LeaverServices.updateLeaverIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Leaver is updated succesfully",
    data: result,
  });
});

const createLeaver = catchAsync(async (req, res) => {
  
  const result = await LeaverServices.createLeaverIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Leaver Created succesfully",
    data: result,
  });
});



export const LeaverControllers = {
    getAllLeaver,
    getSingleLeaver,
    updateLeaver,
    createLeaver,
    deleteSingleLeaver
};

