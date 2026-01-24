import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { CSVServices } from "./csv.service";
import AppError from "../../errors/AppError";

// Controller to create a new CSV
const createCSV: RequestHandler = catchAsync(async (req, res) => {
  const result = await CSVServices.createCSVIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "CSV created successfully",
    data: result,
  });
});

// Controller to delete an CSV by ID
const deleteCSV: RequestHandler = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CSVServices.deleteCSVFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "CSV deleted successfully",
    data: result,
  });
});

// Controller to update an CSV by ID
const updateCSV: RequestHandler = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { attendanceId } = req.body;

  // Validate required fields for transaction removal
  if (!attendanceId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Attendance ID is required");
  }

  // Call the service specifically for transaction removal
  const result = await CSVServices.removeAttendanceFromCSV(id, attendanceId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Attendance removed successfully",
    data: result,
  });
});


// Controller to retrieve all CSVs from the database
const getAllCSVs: RequestHandler = catchAsync(async (req, res) => {
  const result = await CSVServices.getAllCSVsFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "CSVs retrieved successfully",
    data: result,
  });
});

// Controller to retrieve a single CSV by ID
const getOneCSV: RequestHandler = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CSVServices.getOneCSVFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "CSV retrieved successfully",
    data: result,
  });
});

// Controller to retrieve all CSVs for a specific company
const getAllCompanyCSVs: RequestHandler = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CSVServices.getAllCompanyCSVsFromDB(id, req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Company CSVs retrieved successfully",
    data: result,
  });
});

export const CSVControllers = {
  createCSV,
  deleteCSV,
  updateCSV,
  getAllCSVs,
  getOneCSV,
  getAllCompanyCSVs,
};
 