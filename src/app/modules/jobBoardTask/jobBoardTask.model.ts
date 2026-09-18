import { Schema, model } from "mongoose";
import {
  TJobBoardTask,
  TJobBoardTaskLog,
  TJobBoardTaskLogChange,
} from "./jobBoardTask.interface";

// A single field that moved, stored already formatted for display
const LogChangeSchema = new Schema<TJobBoardTaskLogChange>(
  {
    field: {
      type: String,
      required: true,
      trim: true,
    },

    from: {
      type: String,
      default: "",
    },

    to: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

// One entry of the task history - written on create, update and sign-off
const LogEntrySchema = new Schema<TJobBoardTaskLog>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: Date,
      required: true,
      default: Date.now,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    action: {
      type: String,
      enum: ["create", "update", "complete", "reopen"],
      required: true,
    },

    changes: {
      type: [LogChangeSchema],
      default: [],
    },

    // Who the task was signed off to at the time of the entry
    taskDoneBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    note: {
      type: String,
      trim: true,
    },

    documents: {
      type: [String],
      default: [],
    },
  },
  { _id: true }
);

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

    // History of the task, newest entry pushed on every change
    logs: {
      type: [LogEntrySchema],
      default: [],
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
