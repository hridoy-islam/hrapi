import { Types } from "mongoose";

export interface TAudit {
  companyId: Types.ObjectId;

  documentTitle: string;

  title: string[];

  type: "folder" | "file";

  parentId: Types.ObjectId | null;

  ancestors: Types.ObjectId[];

  documentUrl?: string;

  createdAt?: Date;
  updatedAt?: Date;
}