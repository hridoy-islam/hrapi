import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { PassportServices } from "./passport.service";

const getAllPassport: RequestHandler = catchAsync(async (req, res) => {
  const result = await PassportServices.getAllPassportFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Passports retrived succesfully",
    data: result,
  });
});
const getSinglePassport = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PassportServices.getSinglePassportFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Passport is retrieved succesfully",
    data: result,
  });
});

const updatePassport = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PassportServices.updatePassportIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Passport is updated succesfully",
    data: result,
  });
});

const createPassport: RequestHandler = catchAsync(async (req, res) => {
  const result = await PassportServices.createPassportIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Passport created successfully",
    data: result,
  });
});

export const PassportControllers = {
  getAllPassport,
  getSinglePassport,
  updatePassport,
  createPassport
  
};
