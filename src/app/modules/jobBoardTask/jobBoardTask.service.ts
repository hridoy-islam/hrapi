/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";

import AppError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { JobBoardTask } from "./jobBoardTask.model";
import { TJobBoardTask } from "./jobBoardTask.interface";
import { JobBoardTaskSearchableFields } from "./jobBoardTask.constant";
import { JobBoard } from "../jobBoard/jobBoard.model";

const employeeSelect = "firstName lastName initial name email image";

const getDocuments = (doc: any): string[] => {
  if (Array.isArray(doc)) return doc.filter(Boolean);
  if (typeof doc === "string" && doc) return [doc];
  return [];
};

const populateTask = (query: any) =>
  query
    .populate("taskDoneBy", employeeSelect)
    .populate("completedBy", employeeSelect)
    .populate("jobBoardId", "title");

const getAllJobBoardTaskFromDB = async (query: Record<string, unknown>) => {
  const filter: Record<string, unknown> = {};

  const { companyId, jobBoardId, taskDoneBy, isCompleted } = query;
  if (companyId) filter.companyId = companyId;
  if (jobBoardId) filter.jobBoardId = jobBoardId;
  if (taskDoneBy) filter.taskDoneBy = taskDoneBy;
  if (isCompleted === "true" || isCompleted === "false") {
    filter.isCompleted = isCompleted === "true";
  }

  // The range always targets taskDate. No range given means the current
  // month, which is what the list opens on.
  const startOfRange = query.fromDate
    ? new Date(`${String(query.fromDate).slice(0, 10)}T00:00:00.000Z`)
    : new Date(
        Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)
      );

  const endOfRange = query.toDate
    ? new Date(`${String(query.toDate).slice(0, 10)}T23:59:59.999Z`)
    : new Date(
        Date.UTC(
          new Date().getUTCFullYear(),
          new Date().getUTCMonth() + 1,
          0,
          23,
          59,
          59,
          999
        )
      );

  filter.taskDate = { $gte: startOfRange, $lte: endOfRange };

  const taskQuery = new QueryBuilder(populateTask(JobBoardTask.find(filter)), {
    sort: "-taskDate",
    ...query,
  })
    .search(JobBoardTaskSearchableFields)
    .sort()
    .paginate()
    .fields();

  const meta = await taskQuery.countTotal();
  const result = await taskQuery.modelQuery;

  return { meta, result };
};

const getSingleJobBoardTaskFromDB = async (id: string) => {
  const result = await populateTask(JobBoardTask.findById(id));

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Task not found");
  }

  return result;
};

const createJobBoardTaskIntoDB = async (payload: Partial<TJobBoardTask>) => {
  const jobBoard = await JobBoard.findById(payload.jobBoardId);

  if (!jobBoard) {
    throw new AppError(httpStatus.NOT_FOUND, "Job board not found");
  }

  try {
    const result = await JobBoardTask.create({
      ...payload,
      companyId: payload.companyId || jobBoard.companyId,
      taskDate: payload.taskDate || new Date(),
      documents: getDocuments(payload.documents),
      isCompleted: payload.isCompleted || false,
    });

    return getSingleJobBoardTaskFromDB(String(result._id));
  } catch (error: any) {
    if (error instanceof AppError) throw error;

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to create task"
    );
  }
};

const updateJobBoardTaskIntoDB = async (
  id: string,
  payload: Partial<TJobBoardTask> & { completedBy?: any }
) => {
  const task = await JobBoardTask.findById(id);

  if (!task) {
    throw new AppError(httpStatus.NOT_FOUND, "Task not found");
  }

  const updateData: Record<string, unknown> = { ...payload };

  if ("documents" in payload) {
    updateData.documents = getDocuments(payload.documents);
  }

  // Completing and re-opening keep the sign-off fields in step
  if ("isCompleted" in payload) {
    if (payload.isCompleted) {
      const doneBy = payload.taskDoneBy || task.taskDoneBy;

      if (!doneBy || !doneBy.length) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Please select who has completed this task"
        );
      }

      updateData.completedAt = new Date();
      updateData.completedBy = payload.completedBy || task.completedBy;
    } else {
      updateData.completedAt = null;
      updateData.completedBy = null;
    }
  }

  await JobBoardTask.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  return getSingleJobBoardTaskFromDB(id);
};

const deleteJobBoardTaskFromDB = async (id: string) => {
  const task = await JobBoardTask.findById(id);

  if (!task) {
    throw new AppError(httpStatus.NOT_FOUND, "Task not found");
  }

  const result = await JobBoardTask.findByIdAndDelete(id);

  return result;
};

export const JobBoardTaskServices = {
  getAllJobBoardTaskFromDB,
  getSingleJobBoardTaskFromDB,
  createJobBoardTaskIntoDB,
  updateJobBoardTaskIntoDB,
  deleteJobBoardTaskFromDB,
};
