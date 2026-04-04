import { RequestHandler } from "express";
;
import httpStatus from "http-status";


import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { DocusignCredentialsServices } from "./docusignCredentials.service";

const getAllDocusignCredentials: RequestHandler = catchAsync(async (req, res) => {
  const result = await DocusignCredentialsServices.getDocusignCredentialsFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "DocusignCredentials retrived succesfully",
    data: result,
  });
});

// const getSingleNotice = catchAsync(async (req, res) => {
//   const { id } = req.params;
//   const result = await NoticeServices.getSingleNoticeFromDB(id);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "DocusignCredentials is retrieved succesfully",
//     data: result,
//   });
// });

const updateDocusignCredentials = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await DocusignCredentialsServices.updateDocusignCredentialsIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "DocusignCredentials is updated succesfully",
    data: result,
  });
});

const createDocusignCredentials = catchAsync(async (req, res) => {
  
  const result = await DocusignCredentialsServices.createDocusignCredentialsIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "DocusignCredentials Created succesfully",
    data: result,
  });
});



export const DocusignCredentialsControllers = {
    getAllDocusignCredentials,
    createDocusignCredentials,
    updateDocusignCredentials
    
};

