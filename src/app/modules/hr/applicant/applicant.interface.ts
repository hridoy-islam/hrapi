import { Types } from "mongoose";

export interface TApplicant {
  _id: Types.ObjectId;
  vacancyId: Types.ObjectId; // reference to vacnancy
  // stage - 1  // Personal Details
  profilePictureUrl?: string; // Uploaded profile photo URL (optional)
  
  // Personal Details
  title: string; // Mr, Mrs, Miss, etc.
  firstName: string;
  initial?: string; // Middle initial (optional)
  lastName: string;
  dateOfBirth: Date;

  // Official Numbers
  nationalInsuranceNumber?: string;
  nhsNumber?: string;

  // Application Details
  applicationDate: Date;
  availableFromDate: Date;
  employmentType: string; // Full-time, Part-time, Temp, etc.
  position: string; // Desired job position
  source: string; // Where the candidate came from (e.g., Referral, Indeed)
  branch: string; // Office location
  

  // Stage -2 
  // Contact Information

  homePhone?: string;
  mobilePhone?: string;
  otherPhone?: string;
  email: string;
  address: string;
  cityOrTown: string;
  stateOrProvince: string;
  postCode: string;
  country: string;

  // stage -3 
  // Demographic Information
  gender: string; // Male, Female, Other
  maritalStatus: string; // Single, Married, etc.
  ethnicOrigin?: string; // Ethnic background

  // Disability Information
  hasDisability: boolean;
  disabilityDetails?: string;
  needsReasonableAdjustment: boolean;
  reasonableAdjustmentDetails?: string;

  status:
    | "applied"
    | "shortlisted"
    | "interviewing"
    | "offered"
    | "hired"
    | "rejected";
  notes?: string; // for recruiter to add comments during stages

  // stage -4 --Review Application
}
