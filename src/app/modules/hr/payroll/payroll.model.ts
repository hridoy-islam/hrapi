import { Schema, model, Types } from "mongoose";
import { TAttendanceLog, TPayroll } from "./payroll.interface";

const AttendanceLog = new Schema<TAttendanceLog>({
  attendanceId: {
    type: Schema.Types.ObjectId,
    ref: "Attendance",
  },
  rotaId: {
    type: Schema.Types.ObjectId,
    ref: "Rota",
  },
  payRate: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
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
    payrollNo: { type: String, required: true },
    fromDate: {
      type: Date,
      required: true,
    },
    toDate: {
      type: Date,
      required: true,
    },
    isContract: {
      type: Boolean,
      default: false,
    },
    contractAmount: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    attendanceList: [AttendanceLog],
  },
  {
    timestamps: true,
  },
);

export const Payroll = model<TPayroll>("Payroll", PayrollSchema);
