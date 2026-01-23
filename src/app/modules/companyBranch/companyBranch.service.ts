import httpStatus from "http-status";

import AppError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { CompanyBranch } from "./companyBranch.model";
import { TCompanyBranch } from "./companyBranch.interface";
import { CompanyBranchSearchableFields } from "./companyBranch.constant";


const getAllCompanyBranchFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(CompanyBranch.find(), query)
    .search(CompanyBranchSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await userQuery.countTotal();
  const result = await userQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleCompanyBranchFromDB = async (id: string) => {
  const result = await CompanyBranch.findById(id);
  return result;
};


const createCompanyBranchIntoDB = async (payload: TCompanyBranch) => {
    try {
      
      const result = await CompanyBranch.create(payload);
      return result;
    } catch (error: any) {
      console.error("Error in createCompanyBranchIntoDB:", error);
  
      // Throw the original error or wrap it with additional context
      if (error instanceof AppError) {
        throw error;
      }
  
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message || "Failed to create CompanyBranch");
    }
  };


const updateCompanyBranchIntoDB = async (id: string, payload: Partial<TCompanyBranch>) => {
  const companyBranch = await CompanyBranch.findById(id);

  if (!companyBranch) {
    throw new AppError(httpStatus.NOT_FOUND, "CompanyBranch not found");
  }

  // Toggle `isDeleted` status for the selected user only
  // const newStatus = !user.isDeleted;

  // // Check if the user is a company, but only update the selected user
  // if (user.role === "company") {
  //   payload.isDeleted = newStatus;
  // }

  // Update only the selected user
  const result = await CompanyBranch.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};



const deleteCompanyBranchFromDB = async (id: string) => {
  const companyBranch = await CompanyBranch.findById(id);

  if (!companyBranch) {
    throw new AppError(httpStatus.NOT_FOUND, "CompanyBranch not found");
  }

  await CompanyBranch.findByIdAndDelete(id);

  return { message: "CompanyBranch deleted successfully" };
};



export const CompanyBranchServices = {
    getAllCompanyBranchFromDB,
    getSingleCompanyBranchFromDB,
    updateCompanyBranchIntoDB,
    createCompanyBranchIntoDB,
    deleteCompanyBranchFromDB
  
};



  