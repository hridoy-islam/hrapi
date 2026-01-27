import { Schema, model, Types } from "mongoose";
import { TAttendanceLog, TPayroll } from "./payroll.interface";

const AttendanceLog = new Schema<TAttendanceLog>({
  employementRateId: { type: Schema.Types.ObjectId, ref: "EmployeeRate" },
  shiftId: { type: Schema.Types.ObjectId, ref: "Shift" },
  startDate: {
    type: String,
  },
  startTime: {
    type: String,
  },
  endDate: {
    type: String,
  },
  endTime: {
    type: String,
  },
  payRate: { type: Number, default:0 },
  note: { type: String },
  bankHoliday: { type: Boolean, default: false },
  bankHolidayId: { type: Schema.Types.ObjectId, ref: "BankHoliday" },
});

const PayrollSchema = new Schema<TPayroll>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    companyId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    fromDate: {
      type: Date,
      required: true,
    },
    toDate: {
      type: Date,
      required: true,
    },
    note: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    totalHour: { type: Number },
    approvedBy: {
      type: Types.ObjectId,
      ref: "User",
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    attendanceList: [AttendanceLog],
  },
  {
    timestamps: true,
  },
);

export const Payroll = model<TPayroll>("Payroll", PayrollSchema);
