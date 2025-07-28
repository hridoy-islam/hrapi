import { RequestHandler } from "express";
;
import httpStatus from "http-status";


import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { RecruitmentServices } from "./recruitment.service";

const getAllRecruitment: RequestHandler = catchAsync(async (req, res) => {
  const result = await RecruitmentServices.getAllRecruitmentFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Recruitments retrived succesfully",
    data: result,
  });
});
const getSingleRecruitment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await RecruitmentServices.getSingleRecruitmentFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Recruitment is retrieved succesfully",
    data: result,
  });
});

const updateRecruitment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await RecruitmentServices.updateRecruitmentIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Recruitment is updated succesfully",
    data: result,
  });
});

const createRecruitment = catchAsync(async (req, res) => {
  
  const result = await RecruitmentServices.createRecruitmentIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Recruitment Created succesfully",
    data: result,
  });
});



export const RecruitmentControllers = {
    getAllRecruitment,
    getSingleRecruitment,
    updateRecruitment,
    createRecruitment
};

