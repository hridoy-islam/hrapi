import { RequestHandler } from "express";
;
import httpStatus from "http-status";

import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { EmployeeTrainingServices } from "./employeeTraining.service";

const getAllEmployeeTraining: RequestHandler = catchAsync(async (req, res) => {
  const result = await EmployeeTrainingServices.getAllEmployeeTrainingFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "EmployeeTraining retrived succesfully",
    data: result,
  });
});
const getSingleEmployeeTraining = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await EmployeeTrainingServices.getSingleEmployeeTrainingFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Single EmployeeTraining is retrieved succesfully",
    data: result,
  });
});

const updateEmployeeTraining = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await EmployeeTrainingServices.updateEmployeeTrainingIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "EmployeeTraining is updated succesfully",
    data: result,
  });
});

const createEmployeeTraining = catchAsync(async (req, res) => {
  
  const result = await EmployeeTrainingServices.createEmployeeTrainingIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "EmployeeTraining Created succesfully",
    data: result,
  });
});



export const EmployeeTrainingControllers = {

    getAllEmployeeTraining,
    getSingleEmployeeTraining,
    createEmployeeTraining,
    updateEmployeeTraining,    
};

