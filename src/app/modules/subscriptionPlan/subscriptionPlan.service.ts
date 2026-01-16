import httpStatus from "http-status";


import { SubscriptionPlan } from "./subscriptionPlan.model";
import { TSubscriptionPlan } from "./subscriptionPlan.interface";
import { SubscriptionPlanSearchableFields } from "./subscriptionPlan.constant";
import AppError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";


const getAllSubscriptionPlanFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(SubscriptionPlan.find(), query)
    .search(SubscriptionPlanSearchableFields)
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

const getSingleSubscriptionPlanFromDB = async (id: string) => {
  const result = await SubscriptionPlan.findById(id);
  return result;
};


const createSubscriptionPlanIntoDB = async (payload: TSubscriptionPlan) => {
    try {
      
      const result = await SubscriptionPlan.create(payload);
      return result;
    } catch (error: any) {
      console.error("Error in createSubscriptionPlanIntoDB:", error);
  
      // Throw the original error or wrap it with additional context
      if (error instanceof AppError) {
        throw error;
      }
  
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message || "Failed to create SubscriptionPlan");
    }
  };


const updateSubscriptionPlanIntoDB = async (id: string, payload: Partial<TSubscriptionPlan>) => {
  const subscriptionPlan = await SubscriptionPlan.findById(id);

  if (!subscriptionPlan) {
    throw new AppError(httpStatus.NOT_FOUND, "SubscriptionPlan not found");
  }

  // Toggle `isDeleted` status for the selected user only
  // const newStatus = !user.isDeleted;

  // // Check if the user is a company, but only update the selected user
  // if (user.role === "company") {
  //   payload.isDeleted = newStatus;
  // }

  // Update only the selected user
  const result = await SubscriptionPlan.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};



const deleteSubscriptionPlanFromDB = async (id: string) => {
  const subscriptionPlan = await SubscriptionPlan.findById(id);

  if (!subscriptionPlan) {
    throw new AppError(httpStatus.NOT_FOUND, "SubscriptionPlan not found");
  }

  await SubscriptionPlan.findByIdAndDelete(id);

  return { message: "SubscriptionPlan deleted successfully" };
};



export const SubscriptionPlanServices = {
    getAllSubscriptionPlanFromDB,
    getSingleSubscriptionPlanFromDB,
    updateSubscriptionPlanIntoDB,
    createSubscriptionPlanIntoDB,
    deleteSubscriptionPlanFromDB
  
};



  