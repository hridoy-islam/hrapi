import { RequestHandler } from "express";
;
import httpStatus from "http-status";

import { HolidayServices } from "./holiday.service";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";

const getAllHoliday: RequestHandler = catchAsync(async (req, res) => {
  const result = await HolidayServices.getAllHolidayFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Holidays retrived succesfully",
    data: result,
  });
});
const getSingleHoliday = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await HolidayServices.getSingleHolidayFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Holiday is retrieved succesfully",
    data: result,
  });
});

const updateHoliday = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await HolidayServices.updateHolidayIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Holiday is updated succesfully",
    data: result,
  });
});

const createHoliday = catchAsync(async (req, res) => {
  
  const result = await HolidayServices.createHolidayIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Holiday Created succesfully",
    data: result,
  });
});



export const HolidayControllers = {
    getAllHoliday,
    getSingleHoliday,
    updateHoliday,
    createHoliday
};

