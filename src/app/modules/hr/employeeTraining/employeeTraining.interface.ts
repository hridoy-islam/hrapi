import { Types } from "mongoose";

// The Record for a FINISHED training cycle
export interface TCompletionRecord {
  assignedDate: Date;
  expireDate?: Date;
  completedAt: Date;
  certificate?: string; // The certificate earned for THIS specific cycle
}

export interface TEmployeeTraining {
  employeeId: Types.ObjectId;
  trainingId: Types.ObjectId;

  // --- CURRENT / ACTIVE CYCLE DETAILS ---
  // These fields are overwritten every time you re-assign the course
  assignedDate: Date;
  expireDate?: Date;
  certificate?: string; 
  status: 'pending' | 'in-progress' | 'completed' | 'expired';

  // --- HISTORY ---
  // Only stores records when a course is marked "completed"
  completionHistory: TCompletionRecord[];
}