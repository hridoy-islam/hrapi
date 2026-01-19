/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';

export interface TAppraisal {
  userId: Types.ObjectId;
  dbsDocumentUrl: string;
  disclosureNumber: string;
  dateOfIssue: Date;
  expiryDate: Date;
}