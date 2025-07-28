import { Types } from "mongoose";


export interface TRecruitment {
  _id: Types.ObjectId;
  applicantId: Types.ObjectId; // linked applicant
  availableFrom: Date;
  startDate: Date;
  wtrDocumentUrl?: string; // WTR = Working Time Regulation Document
  area: string;
  isFullTime: boolean;
  carTravelAllowance: boolean;
  employmentType:
    | "full-time"
    | "part-time"
    | "contractor"
    | "temporary"
    | "intern"; // Enum
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
