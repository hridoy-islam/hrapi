import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { DisciplinaryServices } from "./disciplinary.service";

const getAllDisciplinary: RequestHandler = catchAsync(async (req, res) => {
  const result = await DisciplinaryServices.getAllDisciplinaryFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Disciplinarys retrived succesfully",
    data: result,
  });
});
const getSingleDisciplinary = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await DisciplinaryServices.getSingleDisciplinaryFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Disciplinary is retrieved succesfully",
    data: result,
  });
});

const updateDisciplinary = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await DisciplinaryServices.updateDisciplinaryIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Disciplinary is updated succesfully",
    data: result,
  });
});

const createDisciplinary: RequestHandler = catchAsync(async (req, res) => {
  const result = await DisciplinaryServices.createDisciplinaryIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Disciplinary created successfully",
    data: result,
  });
});

export const DisciplinaryControllers = {
  getAllDisciplinary,
  getSingleDisciplinary,
  updateDisciplinary,
  createDisciplinary
  
};
