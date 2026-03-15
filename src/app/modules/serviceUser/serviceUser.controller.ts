import { RequestHandler } from "express";
;
import httpStatus from "http-status";


import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ServiceUserServices } from "./serviceUser.service";

const getAllServiceUser: RequestHandler = catchAsync(async (req, res) => {
  const result = await ServiceUserServices.getServiceUserFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "ServiceUser retrived succesfully",
    data: result,
  });
});

// const getSingleNotice = catchAsync(async (req, res) => {
//   const { id } = req.params;
//   const result = await NoticeServices.getSingleNoticeFromDB(id);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "ServiceUser is retrieved succesfully",
//     data: result,
//   });
// });

const updateServiceUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ServiceUserServices.updateServiceUserIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "ServiceUser is updated succesfully",
    data: result,
  });
});

const createServiceUser = catchAsync(async (req, res) => {
  
  const result = await ServiceUserServices.createServiceUserIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "ServiceUser Created succesfully",
    data: result,
  });
});



export const ServiceUserControllers = {
    getAllServiceUser,
    createServiceUser,
    updateServiceUser
    
};

