import { RequestHandler } from "express";
;
import httpStatus from "http-status";


import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { SickNoteServices } from "./sickNote.service";

const getAllSickNote: RequestHandler = catchAsync(async (req, res) => {
  const result = await SickNoteServices.getSickNoteFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "SickNote retrived succesfully",
    data: result,
  });
});

// const getSingleNotice = catchAsync(async (req, res) => {
//   const { id } = req.params;
//   const result = await NoticeServices.getSingleNoticeFromDB(id);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "SickNote is retrieved succesfully",
//     data: result,
//   });
// });

const updateSickNote = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SickNoteServices.updateSickNoteIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "SickNote is updated succesfully",
    data: result,
  });
});


const getSingleSickNote = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SickNoteServices.getSingleSickNoteFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "SickNote is retrieved succesfully",
    data: result,
  });
});

const createSickNote = catchAsync(async (req, res) => {
  
  const result = await SickNoteServices.createSickNoteIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "SickNote Created succesfully",
    data: result,
  });
});



export const SickNoteControllers = {
  getAllSickNote,
  createSickNote,
  updateSickNote,
  getSingleSickNote,
};

