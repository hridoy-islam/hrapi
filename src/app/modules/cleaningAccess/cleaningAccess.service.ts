/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";

import AppError from "../../errors/AppError";
import { CleaningAccess } from "./cleaningAccess.model";

const employeeSelect =
  "firstName lastName initial name email image designationId";

const toIdArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter(Boolean) as string[];
  if (typeof value === "string" && value) return [value];
  return [];
};

const populateAccess = (query: any) =>
  query.populate({
    path: "employeeId",
    select: employeeSelect,
    populate: { path: "designationId", select: "title" },
  });

// A company without a record simply has nobody assigned yet
const getCompanyAccessFromDB = async (companyId: string) => {
  if (!companyId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Company id is required");
  }

  const result = await populateAccess(CleaningAccess.findOne({ companyId }));

  return result || { companyId, employeeId: [] };
};

// Whether an employee is on the cleaning module of any company
const getStaffAccessFromDB = async (employeeId: string) => {
  if (!employeeId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Employee id is required");
  }

  const access = await CleaningAccess.findOne({ employeeId }).select(
    "companyId"
  );

  return {
    employeeId,
    hasCleaningAccess: Boolean(access),
    companyId: access?.companyId || null,
  };
};

// Assigning is additive, so sending one id never drops the others
const assignEmployeesIntoDB = async (payload: any) => {
  const { companyId } = payload || {};
  const employeeIds = toIdArray(payload?.employeeId);

  if (!companyId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Company id is required");
  }

  if (!employeeIds.length) {
    throw new AppError(httpStatus.BAD_REQUEST, "No employee was selected");
  }

  await CleaningAccess.findOneAndUpdate(
    { companyId },
    { $addToSet: { employeeId: { $each: employeeIds } } },
    { upsert: true, new: true }
  );

  return getCompanyAccessFromDB(companyId);
};

const removeEmployeeFromDB = async (companyId: string, employeeId: string) => {
  const access = await CleaningAccess.findOne({ companyId });

  const isAssigned = access?.employeeId?.some(
    (assigned: any) => String(assigned) === String(employeeId)
  );

  if (!access || !isAssigned) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This employee is not assigned to the cleaning module"
    );
  }

  await CleaningAccess.updateOne(
    { companyId },
    { $pull: { employeeId: employeeId } }
  );

  return getCompanyAccessFromDB(companyId);
};

// Used by the log service to keep unassigned employees out
const isEmployeeAssigned = async (companyId: string, employeeId: string) => {
  const access = await CleaningAccess.exists({ companyId, employeeId });
  return Boolean(access);
};

export const CleaningAccessServices = {
  getCompanyAccessFromDB,
  getStaffAccessFromDB,
  assignEmployeesIntoDB,
  removeEmployeeFromDB,
  isEmployeeAssigned,
};
