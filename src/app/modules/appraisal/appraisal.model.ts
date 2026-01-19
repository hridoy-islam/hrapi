/* eslint-disable no-unused-vars */
import { Schema, model, Types } from 'mongoose';
import { TAppraisal } from './appraisal.interface';

const AppraisalSchema = new Schema<TAppraisal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // DBS Certificate Details
    disclosureNumber: { type: String },
    dbsDocumentUrl: { type: String },
    dateOfIssue: { type: Date },
    expiryDate: { type: Date },
  },
  { timestamps: true }
);

export const Appraisal = model<TAppraisal>('Appraisal', AppraisalSchema);
