import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { HealthAndSafety } from "./healthAndSafety.model";
import { THealthAndSafety } from "./healthAndSafety.interface";
import { HealthAndSafetySearchableFields } from "./healthAndSafety.constant";
import { ScheduleCheck } from "../scheduleCheck/scheduleCheck.model";
import moment from "../../utils/moment-setup"
import mongoose from "mongoose";

const getAllHealthAndSafetyFromDB = async (query: Record<string, unknown>) => {
  const { companyId, searchTerm, page = 1, limit = 10 } = query;
  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  let healthAndSafetyCheckInterval = 30;
  if (companyId) {
    const schedule = await ScheduleCheck.findOne({ companyId });
    if (schedule && schedule.healthAndSafetyCheckDate) {
      healthAndSafetyCheckInterval = schedule.healthAndSafetyCheckDate;
    }
  }

  const now = moment().startOf("day").toDate();
  const thresholdDate = moment()
    .startOf("day")
    .add(healthAndSafetyCheckInterval, "days")
    .toDate();

  const basePipeline: any[] = [];

  const matchStage: any = {};
  if (companyId) {
    matchStage.companyId = new mongoose.Types.ObjectId(companyId as string);
  }
  if (searchTerm) {
    matchStage.$or = HealthAndSafetySearchableFields.map((field) => ({
      [field]: { $regex: searchTerm, $options: "i" },
    }));
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
      // Only used for expired & expiring soon groups
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
    HealthAndSafety.aggregate(dataPipeline),
    HealthAndSafety.aggregate(countPipeline),
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
const getSingleHealthAndSafetyFromDB = async (id: string) => {
   const result = await HealthAndSafety.findById(id).populate({
    path: 'logs.updatedBy',
    select: 'name firstName lastName',
  });

  return result;
};

const createHealthAndSafetyIntoDB = async (
  payload: Partial<THealthAndSafety> & { date?: Date; updatedBy?: string }
) => {
  const { date, updatedBy, ...formData } = payload;

  // 2. Create the initial log entry
  const initialLog = {
    title: "Health And Safety Record Initiated",
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
  const result = await HealthAndSafety.create(docData);
  return result;
};

const updateHealthAndSafetyIntoDB = async (
  id: string,
  payload: Partial<THealthAndSafety> & { date?: Date; updatedBy?: string; title?: string }
) => {
  // 1. Check if HealthAndSafety exists
  const healthAndSafety = await HealthAndSafety.findById(id);
  if (!healthAndSafety) {
    throw new AppError(httpStatus.NOT_FOUND, "Health And Safety not found");
  }

 
  const { date, updatedBy, title, ...updateData } = payload;

  const newLogEntry = {
    title: "Health And Safety Details Updated",
    date: new Date(),
    updatedBy: updatedBy,
    document: (updateData as any).document || "",
  };

  const result = await HealthAndSafety.findByIdAndUpdate(
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


const deleteHealthAndSafetyFromDB = async (id: string) => {
  const policy = await HealthAndSafety.findById(id);
  if(!policy){
    throw new AppError(httpStatus.NOT_FOUND, "HealthAndSafety not found");
  }
  const result = await HealthAndSafety.findByIdAndDelete(id);
  return result;
};


export const HealthAndSafetyServices = {
  getAllHealthAndSafetyFromDB,
  getSingleHealthAndSafetyFromDB,
  updateHealthAndSafetyIntoDB,
  createHealthAndSafetyIntoDB,
  deleteHealthAndSafetyFromDB
  
};
