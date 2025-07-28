import { Schema, model } from "mongoose";
import { TEmployeeRate } from "./employeeRate.interface";

const RateSchema = new Schema(
  {
    rate: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  { _id: false }
);

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const EmployeeRateSchema = new Schema<TEmployeeRate>(
  {
    shiftId: [{
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Shift",
    }],
    employeeId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Employee",
    },
    rates: {
      type: Map,
      of: RateSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

EmployeeRateSchema.pre("validate", function (next) {
  if (!this.rates || this.rates.size === 0) {
    this.rates = new Map();
    for (const day of daysOfWeek) {
      this.rates.set(day, { rate: 0 });
    }
  }
  next();
});

export const EmployeeRate = model<TEmployeeRate>("EmployeeRate", EmployeeRateSchema);
