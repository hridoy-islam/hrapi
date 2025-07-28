import { RequestHandler } from "express";
;
import httpStatus from "http-status";

import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { VacancyServices } from "./vacancy.service";

const getAllVacancy: RequestHandler = catchAsync(async (req, res) => {
  const result = await VacancyServices.getAllVacancyFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Vacancy retrived succesfully",
    data: result,
  });
});
const getSingleVacancy = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await VacancyServices.getSingleVacancyFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Single Vacancy is retrieved succesfully",
    data: result,
  });
});

const updateVacancy = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await VacancyServices.updateVacancyIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Vacancy is updated succesfully",
    data: result,
  });
});

const createVacancy = catchAsync(async (req, res) => {
  
  const result = await VacancyServices.createVacancyIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Vacancy Created succesfully",
    data: result,
  });
});



export const VacancyControllers = {

    getAllVacancy,
    getSingleVacancy,
    createVacancy,
    updateVacancy,    
};

