import mongoose, { model, Schema } from "mongoose";
import { TApplicant } from "./applicant.interface";
import { string } from "zod";

const applicantSchema = new Schema<TApplicant>(
  {
    vacancyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Vacancy"
    },
    profilePictureUrl: {
      type: String,
    },
    title: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    initial: {
      type: String,
    },

    lastName: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    nationalInsuranceNumber: {
      type: String,
    },
    nhsNumber: {
      type: String,
    },
    applicationDate: {
      type: Date,
      required: true,
    },
    availableFromDate: {
      type: Date,
      required: true,
    },
    employmentType: {
      type: String,
      required: true,
    },
    position: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      required: true,
    },
    branch: {
      type: String,
      required: true,
    },
    homePhone: {
      type: String,
    },
    mobilePhone: {
      type: String,
    },
    otherPhone: {
      type: String,
    },
    email: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    cityOrTown: {
      type: String,
      required: true,
    },
    stateOrProvince: {
      type: String,
      required: true,
    },
    postCode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    maritalStatus: {
      type: String,
      required: true,
    },
    ethnicOrigin: {
      type: String,
    },
    hasDisability: {
      type: Boolean,
      required: true,
    },
    disabilityDetails: {
      type: String,
    },

    needsReasonableAdjustment: {
      type: Boolean,
      required: true,
    },
    reasonableAdjustmentDetails: {
      type: String,
    },
    status: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Applicant = model<TApplicant>("Applicant", applicantSchema);
