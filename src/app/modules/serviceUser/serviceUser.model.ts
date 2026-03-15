/* eslint-disable @typescript-eslint/no-this-alias */
import bcrypt from "bcrypt";
import { Schema, model } from "mongoose";

import { TServiceUser } from "./serviceUser.interface";

const ServiceUserSchema = new Schema<TServiceUser>(
  {
    name: {
      type: String,
      required: true,
    },
    room: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    email: {
      type: String,
    },
   
    status: {
      type: String,
      default: "active",
    },
    companyId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
   
  },
  {
    timestamps: true,
  },
);

export const ServiceUser = model<TServiceUser>("ServiceUser", ServiceUserSchema);
