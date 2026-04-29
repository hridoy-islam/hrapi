import { model, Schema } from "mongoose";
import { TMeetingMins } from "./meetingMins.interface";




const LogEntrySchema = new Schema({
  title: { type: String },
  date: { type: Date },
  documents: [{ type: String }],
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  note: { type: String },
  Acknowledgement:[{ type: Schema.Types.ObjectId, ref: "User" }]
});


const MeetingMinsSchema = new Schema<TMeetingMins>(
  {
    employeeId: [{ type: Schema.Types.ObjectId, required: true, ref: "User" }],
    title: {
      type: String,
      required: true,
    },
    companyId:{ type: Schema.Types.ObjectId, required: true, ref: "User" },
    nextMeetingDate: { type: Date },
    logs: [LogEntrySchema],
  },
  { timestamps: true },
);

export const MeetingMins = model<TMeetingMins>(
  "MeetingMins",
  MeetingMinsSchema,
);
