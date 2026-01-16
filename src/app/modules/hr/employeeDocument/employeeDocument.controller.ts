import { RequestHandler } from "express";
;
import httpStatus from "http-status";


import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { EmployeeDocumentServices } from "./employeeDocument.service";


const getAllEmployeeDocument: RequestHandler = catchAsync(async (req, res) => {
  const result = await EmployeeDocumentServices.getAllEmployeeDocumentFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "EmployeeDocuments retrived succesfully",
    data: result,
  });
});
const getSingleEmployeeDocument = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await EmployeeDocumentServices.getSingleEmployeeDocumentFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "EmployeeDocument is retrieved succesfully",
    data: result,
  });
});

const updateEmployeeDocument = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await EmployeeDocumentServices.updateEmployeeDocumentIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "EmployeeDocument is updated succesfully",
    data: result,
  });
});

const createEmployeeDocument = catchAsync(async (req, res) => {
  
  const result = await EmployeeDocumentServices.createEmployeeDocumentIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "EmployeeDocument Created succesfully",
    data: result,
  });
});

const deleteEmployeeDocument = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await EmployeeDocumentServices.deleteEmployeeDocumentFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "EmployeeDocument deleted successfully",
    data: result,
  });
});


export const EmployeeDocumentControllers = {
    getAllEmployeeDocument,
    getSingleEmployeeDocument,
    updateEmployeeDocument,
    createEmployeeDocument,
    deleteEmployeeDocument
};

