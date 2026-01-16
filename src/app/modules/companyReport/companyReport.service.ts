import httpStatus from "http-status";


import { CompanyReport } from "./companyReport.model";
import { TCompanyReport } from "./companyReport.interface";
import { CompanyReportSearchableFields } from "./companyReport.constant";
import AppError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import moment from "moment";


const getAllCompanyReportFromDB = async (query: Record<string, unknown>) => {
  const { startDate, endDate, ...otherQueryParams } = query;
  const customFilter: Record<string, unknown> = {};


  if (startDate && endDate) {
    customFilter.createdAt = {
      $gte: moment(startDate as string).toDate(),
      $lte: moment(endDate as string).toDate(),
    };
  }

  const userQuery = new QueryBuilder(
    CompanyReport.find(customFilter).populate({
      path: "companyId",
      select: "name",
    }),
    otherQueryParams 
  )
    .search(CompanyReportSearchableFields)
    .filter(otherQueryParams) 
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
const getSingleCompanyReportFromDB = async (id: string) => {
  const result = await CompanyReport.findById(id);
  return result;
};


const createCompanyReportIntoDB = async (payload: TCompanyReport) => {
    try {
      
      const result = await CompanyReport.create(payload);
      return result;
    } catch (error: any) {
      console.error("Error in createCompanyReportIntoDB:", error);
  
      // Throw the original error or wrap it with additional context
      if (error instanceof AppError) {
        throw error;
      }
  
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message || "Failed to create CompanyReport");
    }
  };


const updateCompanyReportIntoDB = async (id: string, payload: Partial<TCompanyReport>) => {
  const companyReport = await CompanyReport.findById(id);

  if (!companyReport) {
    throw new AppError(httpStatus.NOT_FOUND, "CompanyReport not found");
  }

  // Toggle `isDeleted` status for the selected user only
  // const newStatus = !user.isDeleted;

  // // Check if the user is a company, but only update the selected user
  // if (user.role === "company") {
  //   payload.isDeleted = newStatus;
  // }

  // Update only the selected user
  const result = await CompanyReport.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};



const deleteCompanyReportFromDB = async (id: string) => {
  const companyReport = await CompanyReport.findById(id);

  if (!companyReport) {
    throw new AppError(httpStatus.NOT_FOUND, "CompanyReport not found");
  }

  await CompanyReport.findByIdAndDelete(id);

  return { message: "CompanyReport deleted successfully" };
};



export const CompanyReportServices = {
    getAllCompanyReportFromDB,
    getSingleCompanyReportFromDB,
    updateCompanyReportIntoDB,
    createCompanyReportIntoDB,
    deleteCompanyReportFromDB
  
};



  