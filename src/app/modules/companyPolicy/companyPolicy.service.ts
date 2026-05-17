import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { CompanyPolicy } from "./companyPolicy.model";
import { TCompanyPolicy } from "./companyPolicy.interface";
import { CompanyPolicySearchableFields } from "./companyPolicy.constant";
import mongoose from "mongoose";
import moment from "../../utils/moment-setup"
import { ScheduleCheck } from "../scheduleCheck/scheduleCheck.model";



const getAllCompanyPolicyFromDB = async (query: Record<string, unknown>) => {
  const { companyId, searchTerm, page = 1, limit = 10 } = query;
  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  let policyCheckInterval = 30;
  if (companyId) {
    const schedule = await ScheduleCheck.findOne({ companyId });
    if (schedule && schedule.policyCheckDate) {
      policyCheckInterval = schedule.policyCheckDate;
    }
  }

  const now = moment().startOf("day").toDate();
  const thresholdDate = moment()
    .startOf("day")
    .add(policyCheckInterval, "days")
    .toDate();

  const basePipeline: any[] = [];

  const matchStage: any = {};
  if (companyId) {
    matchStage.companyId = new mongoose.Types.ObjectId(companyId as string);
  }
  if (searchTerm) {
    matchStage.$or = [{ title: { $regex: searchTerm, $options: "i" } }];
  }
  if (Object.keys(matchStage).length > 0) {
    basePipeline.push({ $match: matchStage });
  }

  basePipeline.push({
    $addFields: {
      statusPriority: {
        $switch: {
          branches: [
            {
              // Expired
              case: {
                $and: [
                  { $gt: ["$expiryDate", null] },
                  { $lt: ["$expiryDate", now] },
                ],
              },
              then: 1,
            },
            {
              // Expiring soon
              case: {
                $and: [
                  { $gt: ["$expiryDate", null] },
                  { $lte: ["$expiryDate", thresholdDate] },
                ],
              },
              then: 2,
            },
          ],
          default: 3, // Active
        },
      },
      // Only populated for expired & expiring soon groups
      expiryDateForSort: {
        $cond: {
          if: {
            $and: [
              { $gt: ["$expiryDate", null] },
              { $lte: ["$expiryDate", thresholdDate] },
            ],
          },
          then: "$expiryDate",
          else: null,
        },
      },
    },
  });

  // Exclude logs from the result
  basePipeline.push({
    $project: { logs: 0 },
  });

  basePipeline.push({
    $sort: {
      statusPriority: 1,   // 1 (expired) → 2 (expiring soon) → 3 (active)
      expiryDateForSort: 1, // ASC for expired & expiring soon groups
      createdAt: -1,        // Latest first for active (and as tiebreaker)
    },
  });

  const dataPipeline = [
    ...basePipeline,
    { $skip: skip },
    { $limit: limitNumber },
  ];
  const countPipeline = [...basePipeline, { $count: "total" }];

  const [aggregatedResult, countResult] = await Promise.all([
    CompanyPolicy.aggregate(dataPipeline),
    CompanyPolicy.aggregate(countPipeline),
  ]);

  const total = countResult[0]?.total || 0;

  return {
    meta: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPage: Math.ceil(total / limitNumber),
    },
    result: aggregatedResult,
  };
};

const getSingleCompanyPolicyFromDB = async (id: string) => {
   const result = await CompanyPolicy.findById(id).populate({
    path: 'logs.updatedBy',
    select: 'name firstName lastName',
  });

  return result;
};

const createCompanyPolicyIntoDB = async (
  payload: Partial<TCompanyPolicy> & { date?: Date; updatedBy?: string }
) => {
  const { date, updatedBy, ...formData } = payload;

  // 2. Create the initial log entry
  const initialLog = {
    title: "Company Policy Record Initiated",
    date: new Date(),
    updatedBy: updatedBy,
    document: (formData as any).document || "", 
  };

  // 3. Prepare the document data with the log array
  const docData = {
    ...formData,
    updatedBy,
    logs: [initialLog],
  };

  // 4. Create the record
  const result = await CompanyPolicy.create(docData);
  return result;
};

const updateCompanyPolicyIntoDB = async (
  id: string,
  payload: Partial<TCompanyPolicy> & { date?: Date; updatedBy?: string; title?: string }
) => {
  // 1. Check if CompanyPolicy exists
  const companyPolicy = await CompanyPolicy.findById(id);
  if (!companyPolicy) {
    throw new AppError(httpStatus.NOT_FOUND, "CompanyPolicy not found");
  }

 
  const { date, updatedBy, title, ...updateData } = payload;

  const newLogEntry = {
    title: "Company Policy Details Updated",
    date: new Date(),
    updatedBy: updatedBy,
    document: (updateData as any).document || "",
  };

  const result = await CompanyPolicy.findByIdAndUpdate(
    id,
    {
      $set: updateData,
      $push: { logs: newLogEntry },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  return result;
};


const deleteCompanyPolicyFromDB = async (id: string) => {
  const policy = await CompanyPolicy.findById(id);
  if(!policy){
    throw new AppError(httpStatus.NOT_FOUND, "CompanyPolicy not found");
  }
  const result = await CompanyPolicy.findByIdAndDelete(id);
  return result;
};


export const CompanyPolicyServices = {
  getAllCompanyPolicyFromDB,
  getSingleCompanyPolicyFromDB,
  updateCompanyPolicyIntoDB,
  createCompanyPolicyIntoDB,
  deleteCompanyPolicyFromDB
  
};
