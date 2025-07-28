import { z } from "zod";

const loginValidationSchema = z.object({
  body: z.object({
    email: z.string({ required_error: "Email is required." }),
    password: z.string({ required_error: "Password is required" }),
  }),
});

const forgetPasswordValidationSchema = z.object({
  body: z.object({
    email: z.string({
      required_error: "User email is required!",
    }),
  }),
});

const createUserValidationSchema = z.object({
  body: z.object({
    // name: z.string({ required_error: "User Name is Required" }),
    email: z.string({ required_error: "User Email is Required" }),
    // password: z.string({ required_error: "Password required" }),
  }),
});

const googleValidationSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "User Name is Required" }),
    email: z.string({ required_error: "User Email is Required" }),
    password: z.string({ required_error: "Password is Required" }),
    googleUid: z.string({ required_error: "google UID required" }),
    image: z.string().optional(),
    phone: z.string().optional(),
  }),
});

const validateOtpSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    otp: z.string().length(4, "OTP must be exactly 4 digits"),
  }),
});

const verifyEmailAccount = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    otp: z.string().length(4, "OTP must be exactly 4 digits"),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid Email Address"),
    newPassword: z.string({ required_error: "Password is Required" }),
  }),
});

const emailSentOtpSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid Email Address"),
  }),
});

const refreshTokenZodSchema = z.object({
  cookies: z.object({
    refreshToken: z.string({
      required_error: "Refresh Token is required",
    }),
  }),
});

export const AuthValidations = {
  loginValidationSchema,
  forgetPasswordValidationSchema,
  createUserValidationSchema,
  googleValidationSchema,
  validateOtpSchema,
  verifyEmailAccount,
  resetPasswordSchema,
  emailSentOtpSchema,
  refreshTokenZodSchema,
};
