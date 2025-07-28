import bcrypt from "bcrypt";
import { Schema, model } from "mongoose";
import config from "../../config";
import { TUser, UserModel } from "./user.interface";
import { UserStatus } from "./user.constant";

const RightToWorkSchema = new Schema({
  hasExpiry: {
    type: Boolean,
  },
  expiryDate: {
    type: Date,
  },
});

const PayrollSchema = new Schema({
  payrollNumber: {
    type: String,
  },
  paymentMethod: {
    type: String,
    
  },
});

const EqualityInformationSchema = new Schema({
  nationality: {
    type: String,
  },
  religion: {
    type: String,
  },
  hasDisability: {
    type: Boolean,
  },
  disabilityDetails: {
    type: String,
  },
});

const AddressSchema = new Schema({
  line1: { type: String },
  line2: { type: String },
  city: { type: String },
  state: { type: String },
  postCode: { type: String },
  country: { type: String }
});

const BeneficiarySchema = new Schema({
  fullName: { type: String },
  relationship: { type: String },
  email: { type: String },
  mobile: { type: String },
  sameAddress: { type: Boolean, default: false },
  address: {
    type: AddressSchema,
    validate: {
      validator: function (value: any) {
        // If sameAddress is false, address must be a non-empty object
        if (!this.sameAddress) {
          return value && Object.keys(value).length > 0;
        }
        return true;
      },
      message: 'Address is required when sameAddress is false.'
    }
  }
});


const userSchema = new Schema<TUser, UserModel>(
  {
    name: { type: String },

    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: 0,
    },
    role: {
      type: String,
      enum: ["user", "admin", "company", "employee"],
      default: "user",
    },
    image: {
      type: String,
    },
    status: {
      type: String,
      enum: UserStatus,
      default: "active",
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    colleagues: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    authorized: {
      type: Boolean,
      default: false,
    },
    address: {
      type: String,
    },
    phone: {
      type: String,
    },
    googleUid: {
      type: String,
    },
    otp: {
      type: String,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    accountNo: { type: String },
    sortCode: { type: String },
    otpExpires: { type: Date, required: false },

    beneficiary: { type: BeneficiarySchema },

    title: {
      type: String,
    },
    firstName: {
      type: String,
    },
    initial: {
      type: String,
    },
    lastName: {
      type: String,
    },
    dateOfBirth: {
      type: Date,
    },
    nationalInsuranceNumber: {
      type: String,
    },
    nhsNumber: {
      type: String,
    },
    applicationDate: {
      type: Date,
    },
    availableFromDate: {
      type: Date,
    },
    employmentType: {
      type: String,
    },
    position: {
      type: String,
    },
    source: {
      type: String,
    },
    branch: {
      type: String,
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
    cityOrTown: {
      type: String,
    },
    stateOrProvince: {
      type: String,
    },
    postCode: {
      type: String,
    },
    country: {
      type: String,
    },
    gender: {
      type: String,
    },
    maritalStatus: {
      type: String,
    },
    ethnicOrigin: {
      type: String,
    },
    hasDisability: {
      type: Boolean,
    },
    disabilityDetails: {
      type: String,
    },
    needsReasonableAdjustment: {
      type: Boolean,
    },
    reasonableAdjustmentDetails: {
      type: String,
    },
    notes: {
      type: String,
    },
    recruitmentId: {
      type: Schema.Types.ObjectId,
      ref: "Recruitment",
    },
    applicantId: {
      type: Schema.Types.ObjectId,
      ref: "Applicant",
    },
    availableFrom: {
      type: Date,
    },
    startDate: {
      type: Date,
    },
    wtrDocumentUrl: {
      type: String,
    },
    area: {
      type: String,
    },
    isFullTime: {
      type: Boolean,
    },
    carTravelAllowance: {
      type: Boolean,
    },
    recruitmentEmploymentType: {
      type: String,
      enum: ["full-time", "part-time", "contractor", "temporary", "intern"],
    },
    rightToWork: {
      type: RightToWorkSchema,
    },
    payroll: {
      type: PayrollSchema,
    },
    equalityInformation: {
      type: EqualityInformationSchema,
    },
    detailedBeneficiary: {
      type: BeneficiarySchema,
    },

    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
    },
    trainingId: [
      {
        type: Schema.Types.ObjectId,
        ref: "Training",
      },
    ],
    designationId: {
      type: Schema.Types.ObjectId,
      ref: "Designation",
    },
  },
  {
    timestamps: true,
  }
);

// Middleware to hash the password before saving
userSchema.pre("save", async function (next) {
  const user = this; // doc
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(
      user.password,
      Number(config.bcrypt_salt_rounds)
    );
  }
  next();
});

// set '' after saving password
userSchema.post("save", function (doc, next) {
  doc.password = "";
  next();
});

userSchema.statics.isUserExists = async function (email: string) {
  return await User.findOne({ email }).select("+password");
};

userSchema.statics.isPasswordMatched = async function (
  plainTextPassword,
  hashedPassword
) {
  return await bcrypt.compare(plainTextPassword, hashedPassword);
};

userSchema.statics.isJWTIssuedBeforePasswordChanged = function (
  passwordChangedTimestamp: Date,
  jwtIssuedTimestamp: number
) {
  const passwordChangedTime =
    new Date(passwordChangedTimestamp).getTime() / 1000;
  return passwordChangedTime > jwtIssuedTimestamp;
};

export const User = model<TUser, UserModel>("User", userSchema);