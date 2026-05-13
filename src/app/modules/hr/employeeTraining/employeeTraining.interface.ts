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


  assignedDate: Date;
  expireDate?: Date;
  certificate?: string; 
  status: 'pending' | 'in-progress' | 'completed' | 'expired';
  isOptional: boolean; // New field to indicate if the training is optional or mandatory
  // --- HISTORY ---
  // Only stores records when a course is marked "completed"
  completionHistory: TCompletionRecord[];
}