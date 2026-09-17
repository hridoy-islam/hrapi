import { Schema, model } from "mongoose";
import { TJobBoardTask } from "./jobBoardTask.interface";

const JobBoardTaskSchema = new Schema<TJobBoardTask>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    jobBoardId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "JobBoard",
    },

    taskName: {
      type: String,
      required: true,
      trim: true,
    },

    taskDate: {
      type: Date,
      required: true,
    },

    // A task can carry as many documents as needed
    documents: {
      type: [String],
      default: [],
    },

    note: {
      type: String,
      trim: true,
    },

    // Who carried the task out - a task can be done by several people
    taskDoneBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Who signed the task off
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    completedAt: {
      type: Date,
    },

    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

JobBoardTaskSchema.index({ jobBoardId: 1, taskDate: -1 });

export const JobBoardTask = model<TJobBoardTask>(
  "JobBoardTask",
  JobBoardTaskSchema
);
