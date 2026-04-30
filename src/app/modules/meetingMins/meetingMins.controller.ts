import { RequestHandler } from "express";
;
import httpStatus from "http-status";

import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { MeetingMinsServices } from "./meetingMins.service";

const getAllMeetingMins: RequestHandler = catchAsync(async (req, res) => {
  const result = await MeetingMinsServices.getAllMeetingMinsFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "MeetingMins retrived succesfully",
    data: result,
  });
});
const getAllUnAcknowledgeMeetingMins: RequestHandler = catchAsync(async (req, res) => {
  const { employeeId } = req.params;
  const result = await MeetingMinsServices.getUnacknowledgedMeetingsFromDB(employeeId,req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "UnAcknowledgement MeetingMins retrived succesfully",
    data: result,
  });
});
const getSingleMeetingMins = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await MeetingMinsServices.getSingleMeetingMinsFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Single MeetingMins is retrieved succesfully",
    data: result,
  });
});

const updateMeetingMins = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await MeetingMinsServices.updateMeetingMinsIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "MeetingMins is updated succesfully",
    data: result,
  });
});

const createMeetingMins = catchAsync(async (req, res) => {
  
  const result = await MeetingMinsServices.createMeetingMinsIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "MeetingMins Created succesfully",
    data: result,
  });
});

const acknowledgeMeetingLog: RequestHandler = catchAsync(async (req, res) => {
  const { meetingId, logId, employeeId } = req.params;

  const result =
    await MeetingMinsServices.acknowledgeMeetingLogIntoDB({
      meetingId,
      logId,
      employeeId,
    });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Meeting log acknowledged successfully",
    data: result,
  });
});
const uploadDocumentsToMeetingLogIntoDB: RequestHandler = catchAsync(async (req, res) => {
  const { meetingId, logId } = req.params;
  const { documents } = req.body;

  const result =
    await MeetingMinsServices.uploadDocumentsToMeetingLogIntoDB({
      meetingId,
      logId,
      documents
    });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Meeting log acknowledged successfully",
    data: result,
  });
});

export const MeetingMinsControllers = {

    getAllMeetingMins,
    getSingleMeetingMins,
    createMeetingMins,
    updateMeetingMins,  
    getAllUnAcknowledgeMeetingMins  ,
    acknowledgeMeetingLog,
    uploadDocumentsToMeetingLogIntoDB
};

