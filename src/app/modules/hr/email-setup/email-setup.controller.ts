import { RequestHandler } from "express";
;
import httpStatus from "http-status";


import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";

import { EmailServices } from "./email-setup.service";

const getAllEmail: RequestHandler = catchAsync(async (req, res) => {
  const result = await EmailServices.getEmailFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Emails retrived succesfully",
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

const updateEmail = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await EmailServices.updateEmailIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Email is updated succesfully",
    data: result,
  });
});

const createEmail  = catchAsync(async (req, res) => {
  
  const result = await EmailServices.createEmailIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Email Created succesfully",
    data: result,
  });
});



export const EmailControllers = {
    createEmail,
    getAllEmail,
    updateEmail
    
};

