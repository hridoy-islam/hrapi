/* eslint-disable no-unused-vars */
import { Types } from "mongoose";

export interface TServiceUser {
  _id: Types.ObjectId;
  name: string;
  room: string;
  phone: string;
  email: string;
  status: "inactive" | "active";
  companyId: Types.ObjectId;
 
}
