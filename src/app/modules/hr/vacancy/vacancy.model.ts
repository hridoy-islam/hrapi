import { model, Schema } from "mongoose";
import { TVacancy } from "./vacancy.interface";

const VacancySchema = new Schema<TVacancy>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String },
    employmentType: {
      type: String,      
      required: true,
    },
    salaryRange: {
      min: { type: Number },
      max: { type: Number },
      negotiable: Boolean,
    },
    skillsRequired: { type: String },
    applicationDeadline: { type: Date },
    postedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["active", "closed"], default: "active" },
  },

  { timestamps: true }
);

export const Vacancy = model<TVacancy>("Vacancy", VacancySchema);
