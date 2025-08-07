import { RequestHandler } from "express";
;
import httpStatus from "http-status";


import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { BankHolidayServices } from "./bank-holiday.service";


const getAllBankHoliday: RequestHandler = catchAsync(async (req, res) => {
  const result = await BankHolidayServices.getAllBankHolidayFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "BankHolidays retrived succesfully",
    data: result,
  });
});
const getSingleBankHoliday = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await BankHolidayServices.getSingleBankHolidayFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "BankHoliday is retrieved succesfully",
    data: result,
  });
});

const updateBankHoliday = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await BankHolidayServices.updateBankHolidayIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "BankHoliday is updated succesfully",
    data: result,
  });
});
const deleteBankHoliday = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await BankHolidayServices.deleteBankHolidayIntoDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "BankHoliday is deleted succesfully",
    data: result,
  });
});

const createBankHoliday = catchAsync(async (req, res) => {
  
  const result = await BankHolidayServices.createBankHolidayIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "BankHoliday Created succesfully",
    data: result,
  });
});



export const BankHolidayControllers = {
    getAllBankHoliday,
    getSingleBankHoliday,
    updateBankHoliday,
    createBankHoliday,
    deleteBankHoliday
};

