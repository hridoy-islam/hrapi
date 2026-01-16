import { RequestHandler } from "express";
;
import httpStatus from "http-status";



import { SubscriptionPlanServices } from "./subscriptionPlan.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";


const getAllSubscriptionPlan: RequestHandler = catchAsync(async (req, res) => {
  const result = await SubscriptionPlanServices.getAllSubscriptionPlanFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "SubscriptionPlans retrived succesfully",
    data: result,
  });
});
const getSingleSubscriptionPlan = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SubscriptionPlanServices.getSingleSubscriptionPlanFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "SubscriptionPlan is retrieved succesfully",
    data: result,
  });
});

const updateSubscriptionPlan = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SubscriptionPlanServices.updateSubscriptionPlanIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "SubscriptionPlan is updated succesfully",
    data: result,
  });
});

const createSubscriptionPlan = catchAsync(async (req, res) => {
  
  const result = await SubscriptionPlanServices.createSubscriptionPlanIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "SubscriptionPlan Created succesfully",
    data: result,
  });
});

const deleteSubscriptionPlan = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SubscriptionPlanServices.deleteSubscriptionPlanFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "SubscriptionPlan deleted successfully",
    data: result,
  });
});


export const SubscriptionPlanControllers = {
    getAllSubscriptionPlan,
    getSingleSubscriptionPlan,
    updateSubscriptionPlan,
    createSubscriptionPlan,
    deleteSubscriptionPlan
};

