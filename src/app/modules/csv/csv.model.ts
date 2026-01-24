import mongoose, { Schema } from "mongoose";
import { TCSV } from "./csv.interface";

const attendanceSchema = new Schema(
  {
    startDate: { type: String },
    startTime: { type: String },
    endDate: { type: String },
    endTime: { type: String },
    email: { type: String },
    phone: { type: String },
    name: { type: String },
    note: { type: String },
    duration: { type: Number },
    userId:{type: mongoose.Schema.Types.ObjectId,
      ref: "User",}
  }
);

const csvSchema = new Schema<TCSV>(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    attendances: {
      type: [attendanceSchema],
     
    },
  },
  {
    timestamps: true,
  }
);

const CSV = mongoose.model<TCSV>("CSV", csvSchema);

export default CSV;
