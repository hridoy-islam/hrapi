/* eslint-disable @typescript-eslint/no-this-alias */
import bcrypt from "bcrypt";
import { Schema, model } from "mongoose";

import { TDepartment } from "./department.interface";

const departmentSchema = new Schema<TDepartment>(
  {
    departmentName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    parentDepartmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
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
    index: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const Department = model<TDepartment>("Department", departmentSchema);
