import { Types } from "mongoose";

export interface TPresetTask {
  _id: Types.ObjectId;
  title: string;
  companyId: Types.ObjectId;
}

export interface PresetTask {
  _id: string;
  title: string;
  companyId: string;
  createdAt?: string;
  updatedAt?: string;
}
