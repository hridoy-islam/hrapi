/* eslint-disable no-unused-vars */
import {  Types } from "mongoose";


export interface TDepartment {
  _id: Types.ObjectId;
  departmentName: string;  
  description: string;  
  status: "inactive" | "active";
}
