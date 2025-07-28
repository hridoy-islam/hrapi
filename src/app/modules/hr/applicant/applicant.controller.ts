import { RequestHandler } from "express";
;
import httpStatus from "http-status";

import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { ApplicantServices } from "./applicant.service";

const getAllApplicant: RequestHandler = catchAsync(async (req, res) => {
  const result = await ApplicantServices.getAllApplicantFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Applicant retrived succesfully",
    data: result,
  });
});
const getSingleApplicant = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ApplicantServices.getSingleApplicantFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Applicant is retrieved succesfully",
    data: result,
  });
});

const updateApplicant = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ApplicantServices.updateApplicantIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Applicant is updated succesfully",
    data: result,
  });
});

const createApplicant = catchAsync(async (req, res) => {
  
  const result = await ApplicantServices.createApplicantIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Applicant Created succesfully",
    data: result,
  });
});



export const ApplicantControllers = {
    getAllApplicant,
    getSingleApplicant,
    updateApplicant,
    createApplicant
};

