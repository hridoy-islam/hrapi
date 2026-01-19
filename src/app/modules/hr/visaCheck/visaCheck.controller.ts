import { RequestHandler } from "express";
;
import httpStatus from "http-status";

import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { VisaCheckServices } from "./visaCheck.service";

const getAllVisaCheck: RequestHandler = catchAsync(async (req, res) => {
  const result = await VisaCheckServices.getAllVisaCheckFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "VisaCheck retrived succesfully",
    data: result,
  });
});
const getSingleVisaCheck = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await VisaCheckServices.getSingleVisaCheckFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Single VisaCheck is retrieved succesfully",
    data: result,
  });
});

const updateVisaCheck = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await VisaCheckServices.updateVisaCheckIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "VisaCheck is updated succesfully",
    data: result,
  });
});

const createVisaCheck = catchAsync(async (req, res) => {
  
  const result = await VisaCheckServices.createVisaCheckIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "VisaCheck Created succesfully",
    data: result,
  });
});



export const VisaCheckControllers = {

    getAllVisaCheck,
    getSingleVisaCheck,
    createVisaCheck,
    updateVisaCheck,    
};

