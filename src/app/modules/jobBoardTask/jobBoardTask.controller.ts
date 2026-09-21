import { RequestHandler } from "express";
import httpStatus from "http-status";

import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { JobBoardTaskServices } from "./jobBoardTask.service";

const getAllJobBoardTask: RequestHandler = catchAsync(async (req, res) => {
  const result = await JobBoardTaskServices.getAllJobBoardTaskFromDB(
    req.query,
    req.user
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Tasks retrived succesfully",
    data: result,
  });
});

const getSingleJobBoardTask = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await JobBoardTaskServices.getSingleJobBoardTaskFromDB(
    id,
    req.user
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task is retrieved succesfully",
    data: result,
  });
});

const createJobBoardTask = catchAsync(async (req, res) => {
  const result = await JobBoardTaskServices.createJobBoardTaskIntoDB(
    req.body,
    req.user?._id
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task created succesfully",
    data: result,
  });
});

const updateJobBoardTask = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await JobBoardTaskServices.updateJobBoardTaskIntoDB(
    id,
    req.body,
    req.user?._id
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task is updated succesfully",
    data: result,
  });
});

const deleteJobBoardTask = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await JobBoardTaskServices.deleteJobBoardTaskFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Task deleted successfully",
    data: result,
  });
});

export const JobBoardTaskControllers = {
  getAllJobBoardTask,
  getSingleJobBoardTask,
  createJobBoardTask,
  updateJobBoardTask,
  deleteJobBoardTask,
};
