import { Types } from "mongoose";

export interface TrainingModule {
    _id: Types.ObjectId;
    name: string;
    description?: string;
    isRecurring: boolean;
    validityDays?: number;        // How long it stays valid
    reminderBeforeDays?: number; // When to remind before expiry
    
  }