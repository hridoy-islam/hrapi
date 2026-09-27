import httpStatus from "http-status";

import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { CleaningAccessServices } from "./cleaningAccess.service";

const getCompanyAccess = catchAsync(async (req, res) => {
  const result = await CleaningAccessServices.getCompanyAccessFromDB(
    req.query.companyId as string
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Cleaning employees retrieved succesfully",
    data: result,
  });
});

// An employee always reads their own access, never anybody else's
const getStaffAccess = catchAsync(async (req, res) => {
  const employeeId =
    req.user?.role === "employee"
      ? req.user?._id
      : (req.query.employeeId as string) || req.user?._id;

  const result = await CleaningAccessServices.getStaffAccessFromDB(employeeId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Cleaning access retrieved succesfully",
    data: result,
  });
});

const assignEmployees = catchAsync(async (req, res) => {
  const result = await CleaningAccessServices.assignEmployeesIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Employee assigned to the cleaning module succesfully",
    data: result,
  });
});

const removeEmployee = catchAsync(async (req, res) => {
  const { companyId, employeeId } = req.params;
  const result = await CleaningAccessServices.removeEmployeeFromDB(
    companyId,
    employeeId
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Employee removed from the cleaning module succesfully",
    data: result,
  });
});

export const CleaningAccessControllers = {
  getCompanyAccess,
  getStaffAccess,
  assignEmployees,
  removeEmployee,
};
