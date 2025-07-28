import { Types } from "mongoose";

export interface TEmployee {
  vacancyId: Types.ObjectId;
  profilePictureUrl?: string;
  title: string; 
  firstName: string;
  initial?: string;
  lastName: string;
  dateOfBirth: Date;
  nationalInsuranceNumber?: string;
  nhsNumber?: string;
  applicationDate: Date;
  availableFromDate: Date;
  employmentType: string; 
  position: string;
  source: string; 
  branch: string;
  homePhone?: string;
  mobilePhone?: string;
  otherPhone?: string;
  email: string;
  address: string;
  cityOrTown: string;
  stateOrProvince: string;
  postCode: string;
  country: string;
  gender: string; 
  maritalStatus: string; 
  ethnicOrigin?: string;
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
  notes?: string;
  recruitmentId: Types.ObjectId;
  applicantId: Types.ObjectId;
  availableFrom: Date;
  startDate: Date;
  wtrDocumentUrl?: string;
  area: string;
  isFullTime: boolean;
  carTravelAllowance: boolean;
  recruitmentEmploymentType:
    | "full-time"
    | "part-time"
    | "contractor"
    | "temporary"
    | "intern";

  rightToWork: {
    hasExpiry: boolean;
    expiryDate?: Date;
  };
  payroll: {
    payrollNumber: string;
    paymentMethod: "bank-transfer" | "cheque" | "cash";
  };
  equalityInformation: {
    nationality: string;
    religion: string;
    hasDisability: boolean;
    disabilityDetails?: string;
  };

  beneficiary: {
    fullName: string;
    relationship: string;
    email: string;
    mobile: string;
    sameAddress: boolean;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      postCode: string;
      country: string;
    };
  };
}