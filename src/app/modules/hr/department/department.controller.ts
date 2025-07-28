import { RequestHandler } from "express";
;
import httpStatus from "http-status";


import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { DepartmentServices } from "./department.service";

const getAllDepartment: RequestHandler = catchAsync(async (req, res) => {
  const result = await DepartmentServices.getDepartmentFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Department retrived succesfully",
    data: result,
  });
});

// const getSingleNotice = catchAsync(async (req, res) => {
//   const { id } = req.params;
//   const result = await NoticeServices.getSingleNoticeFromDB(id);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "Department is retrieved succesfully",
//     data: result,
//   });
// });

const updateDepartment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await DepartmentServices.updateDepartmentIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Department is updated succesfully",
    data: result,
  });
});

const createDepartment = catchAsync(async (req, res) => {
  
  const result = await DepartmentServices.createDepartmentIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Department Created succesfully",
    data: result,
  });
});



export const DepartmentControllers = {
    getAllDepartment,
    createDepartment,
    updateDepartment
    
};

