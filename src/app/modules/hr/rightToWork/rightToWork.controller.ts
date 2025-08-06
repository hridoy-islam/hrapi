import { RequestHandler } from "express";
;
import httpStatus from "http-status";

import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { RightToWorkServices } from "./rightToWork.service";

const getAllRightToWork: RequestHandler = catchAsync(async (req, res) => {
  const result = await RightToWorkServices.getAllRightToWorkFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "RightToWork retrived succesfully",
    data: result,
  });
});
const getSingleRightToWork = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await RightToWorkServices.getSingleRightToWorkFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Single RightToWork is retrieved succesfully",
    data: result,
  });
});

const updateRightToWork = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await RightToWorkServices.updateRightToWorkIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "RightToWork is updated succesfully",
    data: result,
  });
});

const createRightToWork = catchAsync(async (req, res) => {
  
  const result = await RightToWorkServices.createRightToWorkIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "RightToWork Created succesfully",
    data: result,
  });
});



export const RightToWorkControllers = {

    getAllRightToWork,
    getSingleRightToWork,
    createRightToWork,
    updateRightToWork,    
};

