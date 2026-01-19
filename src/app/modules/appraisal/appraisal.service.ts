import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { Appraisal } from "./appraisal.model";
import { TAppraisal } from "./appraisal.interface";
import { AppraisalSearchableFields } from "./appraisal.constant";

const getAllAppraisalFromDB = async (query: Record<string, unknown>) => {
  const AppraisalQuery = new QueryBuilder(Appraisal.find(), query)
    .search(AppraisalSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await AppraisalQuery.countTotal();
  const result = await AppraisalQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleAppraisalFromDB = async (id: string) => {
  const result = await Appraisal.findById(id);
  return result;
};

const updateAppraisalIntoDB = async (id: string, payload: Partial<TAppraisal>) => {
  const appraisal = await Appraisal.findById(id);
  if (!appraisal) {
    throw new AppError(httpStatus.NOT_FOUND, "Appraisal not found");
  }

  const result = await Appraisal.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};


const createAppraisalIntoDB = async (payload: Partial<TAppraisal>) => {
  const result = await Appraisal.create(payload);
  return result;
};




export const AppraisalServices = {
  getAllAppraisalFromDB,
  getSingleAppraisalFromDB,
  updateAppraisalIntoDB,
  createAppraisalIntoDB
  
};
