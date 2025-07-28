/* eslint-disable no-unused-vars */
import { Model, Types } from "mongoose";
import { USER_ROLE } from "./user.constant";

export interface RightToWork {
  hasExpiry?: boolean;
  expiryDate?: Date;
}

export interface Payroll {
  payrollNumber?: string;
  paymentMethod?: "bank-transfer" | "cheque" | "cash";
}

export interface EqualityInformation {
  nationality?: string;
  religion?: string;
  hasDisability?: boolean;
  disabilityDetails?: string;
}

export interface Address {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postCode?: string;
  country?: string;
}

export interface BeneficiaryDetails {
  fullName?: string;
  relationship?: string;
  email?: string;
  mobile?: string;
  sameAddress?: boolean;
  address?: Address;
}

export interface TUser {
  _id: Types.ObjectId;
  email: string;
  password: string;
  role: "user" | "admin" | "company" | "creator" | "director";
  status: "block" | "active";
  company?: Types.ObjectId;
  colleagues?: Types.ObjectId[];
  isDeleted: boolean;
  authorized: boolean;
  address?: string;
  image?: string;
  phone?: string;
  googleUid?: string;
  otp?: string;
  refreshToken?: string;
  otpExpires: Date | null;
  accountNo?: string;
  sortCode?: string;
  beneficiary?: string;

  // Fields from Employee model
  profilePictureUrl?: string;
  title?: string;
  firstName?: string;
  initial?: string;
  lastName?: string;
  dateOfBirth?: Date;
  nationalInsuranceNumber?: string;
  nhsNumber?: string;
  applicationDate?: Date;
  availableFromDate?: Date;
  employmentType?: string;
  position?: string;
  source?: string;
  branch?: string;
  homePhone?: string;
  mobilePhone?: string;
  otherPhone?: string;
  cityOrTown?: string;
  stateOrProvince?: string;
  postCode?: string;
  country?: string;
  gender?: string;
  maritalStatus?: string;
  ethnicOrigin?: string;
  hasDisability?: boolean;
  disabilityDetails?: string;
  needsReasonableAdjustment?: boolean;
  reasonableAdjustmentDetails?: string;
  notes?: string;
  recruitmentId?: Types.ObjectId;
  applicantId?: Types.ObjectId;
  availableFrom?: Date;
  startDate?: Date;
  wtrDocumentUrl?: string;
  area?: string;
  isFullTime?: boolean;
  carTravelAllowance?: boolean;
  recruitmentEmploymentType?: "full-time" | "part-time" | "contractor" | "temporary" | "intern";
  rightToWork?: RightToWork;
  payroll?: Payroll;
  equalityInformation?: EqualityInformation;
  detailedBeneficiary?: BeneficiaryDetails;
  departmentId:Types.ObjectId;
  trainingId: Types.ObjectId[];
  designationId: Types.ObjectId
}

export interface UserModel extends Model<TUser> {
  //instance methods for checking if the user exist
  isUserExists(email: string): Promise<TUser>;
  //instance methods for checking if passwords are matched
  isPasswordMatched(
    plainTextPassword: string,
    hashedPassword: string
  ): Promise<boolean>;
  // isJWTIssuedBeforePasswordChanged(
  //   passwordChangedTimestamp: Date,
  //   jwtIssuedTimestamp: number,
  // ): boolean;
}

export type TUserRole = keyof typeof USER_ROLE;