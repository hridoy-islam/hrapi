import { RequestHandler } from "express";
;
import httpStatus from "http-status";

import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { ImmigrationStatusServices } from "./immigrationStatus.service";

const getAllImmigrationStatus: RequestHandler = catchAsync(async (req, res) => {
  const result = await ImmigrationStatusServices.getAllImmigrationStatusFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "ImmigrationStatus retrived succesfully",
    data: result,
  });
});
const getSingleImmigrationStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ImmigrationStatusServices.getSingleImmigrationStatusFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Single ImmigrationStatus is retrieved succesfully",
    data: result,
  });
});

const updateImmigrationStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ImmigrationStatusServices.updateImmigrationStatusIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "ImmigrationStatus is updated succesfully",
    data: result,
  });
});

const createImmigrationStatus = catchAsync(async (req, res) => {
  
  const result = await ImmigrationStatusServices.createImmigrationStatusIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "ImmigrationStatus Created succesfully",
    data: result,
  });
});



export const ImmigrationStatusControllers = {

    getAllImmigrationStatus,
    getSingleImmigrationStatus,
    createImmigrationStatus,
    updateImmigrationStatus,    
};

