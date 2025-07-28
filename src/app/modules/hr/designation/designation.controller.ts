import { RequestHandler } from "express";
;
import httpStatus from "http-status";


import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { DesignationServices } from "./designation.service";


const getAllDesignation: RequestHandler = catchAsync(async (req, res) => {
  const result = await DesignationServices.getAllDesignationFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Designations retrived succesfully",
    data: result,
  });
});
const getSingleDesignation = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await DesignationServices.getSingleDesignationFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Designation is retrieved succesfully",
    data: result,
  });
});

const updateDesignation = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await DesignationServices.updateDesignationIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Designation is updated succesfully",
    data: result,
  });
});

const createDesignation = catchAsync(async (req, res) => {
  
  const result = await DesignationServices.createDesignationIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Designation Created succesfully",
    data: result,
  });
});



export const DesignationControllers = {
    getAllDesignation,
    getSingleDesignation,
    updateDesignation,
    createDesignation
};

