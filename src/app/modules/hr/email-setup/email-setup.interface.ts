/* eslint-disable no-unused-vars */
import {  Types } from "mongoose";


export interface TEmail {
  _id: Types.ObjectId;
  email: string;  
  password: string;
  host: string;
  port: number;
  encryption: string;
  authentication: boolean
}
