import httpStatus from "http-status";
import { Types } from "mongoose";

import QueryBuilder from "../../../builder/QueryBuilder";
import AppError from "../../../errors/AppError";
import { CompanyDailyWorkFlowAccess } from "./manageEmployee.model";
import { ICompanyDailyWorkFlowAccess } from "./manageEmployee.interface";

const getAllCompanyDailyWorkFlowAccessFromDB = async (
  query: Record<string, unknown>
) => {
  const accessQuery = new QueryBuilder(
    CompanyDailyWorkFlowAccess.find(),
    query
  )
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await accessQuery.countTotal();
  const result = await accessQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleCompanyDailyWorkFlowAccessFromDB = async (id: string) => {
  const result = await CompanyDailyWorkFlowAccess.findById(id);
  return result;
};

const getCompanyDailyWorkFlowAccessByCompanyFromDB = async (
  companyId: string
) => {
  if (!Types.ObjectId.isValid(companyId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid company id");
  }

  const result = await CompanyDailyWorkFlowAccess.findOne({
    companyId,
  }).populate("employees", "firstName lastName");

  return result;
};

const createCompanyDailyWorkFlowAccessIntoDB = async (
  payload: ICompanyDailyWorkFlowAccess
) => {
  try {
    const existing = await CompanyDailyWorkFlowAccess.findOne({
      companyId: payload.companyId,
    });

    if (existing) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Daily work flow access already exists for this company"
      );
    }

    const result = await CompanyDailyWorkFlowAccess.create(payload);
    return result;
  } catch (error: any) {
    console.error("Error in createCompanyDailyWorkFlowAccessIntoDB:", error);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to create company daily work flow access"
    );
  }
};

const upsertCompanyDailyWorkFlowAccessByCompanyIntoDB = async (
  companyId: string,
  payload: Partial<ICompanyDailyWorkFlowAccess>
) => {
  if (!Types.ObjectId.isValid(companyId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid company id");
  }

  const result = await CompanyDailyWorkFlowAccess.findOneAndUpdate(
    { companyId },
    { $set: payload, $setOnInsert: { companyId } },
    { new: true, runValidators: true, upsert: true }
  );

  return result;
};

const updateCompanyDailyWorkFlowAccessIntoDB = async (
  id: string,
  payload: Partial<ICompanyDailyWorkFlowAccess>
) => {
  const access = await CompanyDailyWorkFlowAccess.findById(id);

  if (!access) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Company daily work flow access not found"
    );
  }

  const result = await CompanyDailyWorkFlowAccess.findByIdAndUpdate(
    id,
    payload,
    {
      new: true,
      runValidators: true,
    }
  );

  return result;
};

const deleteCompanyDailyWorkFlowAccessFromDB = async (id: string) => {
  const access = await CompanyDailyWorkFlowAccess.findById(id);

  if (!access) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Company daily work flow access not found"
    );
  }

  const result = await CompanyDailyWorkFlowAccess.findByIdAndDelete(id);
  return result;
};

export const ManageEmployeeServices = {
  getAllCompanyDailyWorkFlowAccessFromDB,
  getSingleCompanyDailyWorkFlowAccessFromDB,
  getCompanyDailyWorkFlowAccessByCompanyFromDB,
  createCompanyDailyWorkFlowAccessIntoDB,
  upsertCompanyDailyWorkFlowAccessByCompanyIntoDB,
  updateCompanyDailyWorkFlowAccessIntoDB,
  deleteCompanyDailyWorkFlowAccessFromDB,
};
