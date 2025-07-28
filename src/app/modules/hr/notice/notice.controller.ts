import { RequestHandler } from "express";
;
import httpStatus from "http-status";

import { NoticeServices } from "./notice.service";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";

const getAllNotice: RequestHandler = catchAsync(async (req, res) => {
  const result = await NoticeServices.getAllNoticeFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notices retrived succesfully",
    data: result,
  });
});
const getSingleNotice = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await NoticeServices.getSingleNoticeFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notice is retrieved succesfully",
    data: result,
  });
});

const updateNotice = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await NoticeServices.updateNoticeIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notice is updated succesfully",
    data: result,
  });
});

const createNotice = catchAsync(async (req, res) => {
  
  const result = await NoticeServices.createNoticeIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notice Created succesfully",
    data: result,
  });
});



export const NoticeControllers = {
    getAllNotice,
    getSingleNotice,
    updateNotice,
    createNotice
};

