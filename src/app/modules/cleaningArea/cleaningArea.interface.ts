import { Types } from "mongoose";

export type TCleaningType = "daily" | "monthly";

export interface TCleaningArea {
  companyId: Types.ObjectId;
  areaName: string;
  type: TCleaningType;
  roomNumber?: string;
}
