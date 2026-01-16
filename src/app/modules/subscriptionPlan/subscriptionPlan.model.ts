import { Schema, model } from "mongoose";
import { TSubscriptionPlan } from "./subscriptionPlan.interface";

const SubscriptionPlanSchema = new Schema<TSubscriptionPlan>(
  {
    title: {
      type: String,
      required: true,
    },
    deviceNumber: {
      type: Number,
      required: true,
    },
    employeeNumber: {
      type: Number,
      required: true,
    },
    price:{
        type: Number,
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

export const SubscriptionPlan = model<TSubscriptionPlan>(
  "SubscriptionPlan",
  SubscriptionPlanSchema
);
