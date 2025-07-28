/* eslint-disable @typescript-eslint/no-this-alias */
import bcrypt from "bcrypt";
import { Schema, model } from "mongoose";

import { TEmail } from "./email-setup.interface";


const EmailSchema = new Schema<TEmail>(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    host: {
      type: String,
      required: true,
    },
    port: {
      type: Number,
      required: true,
    },
    encryption: {
      type: String,
      required: true,
    },
    authentication: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Email = model<TEmail>("Email", EmailSchema);
