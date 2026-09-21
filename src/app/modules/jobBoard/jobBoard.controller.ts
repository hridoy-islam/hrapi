import { RequestHandler } from "express";
import httpStatus from "http-status";

import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { JobBoardServices } from "./jobBoard.service";

const getAllJobBoard: RequestHandler = catchAsync(async (req, res) => {
  const result = await JobBoardServices.getAllJobBoardFromDB(
    req.query,
    req.user
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Job boards retrived succesfully",
    data: result,
  });
});

const getSingleJobBoard = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await JobBoardServices.getSingleJobBoardFromDB(id, req.user);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Job board is retrieved succesfully",
    data: result,
  });
});

// An employee always reads their own access, never anybody else's
const getStaffJobBoardAccess = catchAsync(async (req, res) => {
  const employeeId =
    req.user?.role === "employee"
      ? req.user?._id
      : (req.query.employeeId as string) || req.user?._id;

  const result = await JobBoardServices.getStaffJobBoardAccessFromDB(
    employeeId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Job board access is retrieved succesfully",
    data: result,
  });
});

const createJobBoard = catchAsync(async (req, res) => {
  const result = await JobBoardServices.createJobBoardIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Job board created succesfully",
    data: result,
  });
});

const updateJobBoard = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await JobBoardServices.updateJobBoardIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Job board is updated succesfully",
    data: result,
  });
});

const assignEmployees = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await JobBoardServices.assignEmployeesIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Employee assigned to the job board succesfully",
    data: result,
  });
});

const removeEmployee = catchAsync(async (req, res) => {
  const { id, employeeId } = req.params;
  const result = await JobBoardServices.removeEmployeeFromDB(id, employeeId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Employee removed from the job board succesfully",
    data: result,
  });
});

const deleteJobBoard = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await JobBoardServices.deleteJobBoardFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Job board deleted successfully",
    data: result,
  });
});

export const JobBoardControllers = {
  getAllJobBoard,
  getSingleJobBoard,
  getStaffJobBoardAccess,
  createJobBoard,
  updateJobBoard,
  assignEmployees,
  removeEmployee,
  deleteJobBoard,
};
