import { RequestHandler } from "express";
;
import httpStatus from "http-status";

import { AdminNoticeServices } from "./noticeAdmin.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

const getAllAdminNotice: RequestHandler = catchAsync(async (req, res) => {
  const result = await AdminNoticeServices.getAllAdminNoticeFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "AdminNotices retrived succesfully",
    data: result,
  });
});
const getSingleAdminNotice = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await AdminNoticeServices.getSingleAdminNoticeFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "AdminNotice is retrieved succesfully",
    data: result,
  });
});

const updateAdminNotice = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await AdminNoticeServices.updateAdminNoticeIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "AdminNotice is updated succesfully",
    data: result,
  });
});

const createAdminNotice = catchAsync(async (req, res) => {
  
  const result = await AdminNoticeServices.createAdminNoticeIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "AdminNotice Created succesfully",
    data: result,
  });
});



export const AdminNoticeControllers = {
    getAllAdminNotice,
    getSingleAdminNotice,
    updateAdminNotice,
    createAdminNotice
};

