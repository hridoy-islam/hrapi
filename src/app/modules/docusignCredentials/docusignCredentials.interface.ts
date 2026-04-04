/* eslint-disable no-unused-vars */
import { Types } from "mongoose";

export interface TDocusignCredentials {
  _id: Types.ObjectId;

  companyId: Types.ObjectId;

  clientId: string;
  userId: string;
  accountId: string;
  rsaPrivateKey: string;

  createdAt: Date;
  updatedAt: Date;
}