/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";

import moment from "moment";

import AppError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { JobBoardTask } from "./jobBoardTask.model";
import {
  TJobBoardTask,
  TJobBoardTaskLogChange,
} from "./jobBoardTask.interface";
import { JobBoardTaskSearchableFields } from "./jobBoardTask.constant";
import { JobBoard } from "../jobBoard/jobBoard.model";
import { User } from "../user/user.model";

const employeeSelect = "firstName lastName initial name email image";

// The optional free text fields, with the label the history prints
const TEXT_FIELDS: { key: keyof TJobBoardTask; label: string }[] = [
  { key: "note", label: "Note" },
  { key: "remarks", label: "Remarks" },
  { key: "figure", label: "Figure" },
  { key: "concernPartyName", label: "Resident/Staff/Concern Party Name" },
  { key: "others", label: "Others" },
];

const textSnapshot = (source: any, fallback: any = {}) =>
  TEXT_FIELDS.reduce<Record<string, string>>((acc, { key }) => {
    acc[key] =
      (source?.[key] !== undefined ? source[key] : fallback?.[key]) || "";
    return acc;
  }, {});

const getDocuments = (doc: any): string[] => {
  if (Array.isArray(doc)) return doc.filter(Boolean);
  if (typeof doc === "string" && doc) return [doc];
  return [];
};

const populateTask = (query: any) =>
  query
    .populate("taskDoneBy", employeeSelect)
    .populate("completedBy", employeeSelect)
    .populate("jobBoardId", "title")
    .populate("logs.updatedBy", employeeSelect)
    .populate("logs.taskDoneBy", employeeSelect);

const formatDate = (date: any) =>
  date ? moment(date).format("DD MMM YYYY") : "-";

const formatDateTime = (date: any) =>
  date ? moment(date).format("DD MMM YYYY, h:mm A") : "-";

// Ids can arrive as strings, ObjectIds or already populated documents
const toIdList = (value: any): string[] => {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [value];
  return list.filter(Boolean).map((item: any) => String(item?._id || item));
};

const sameIdList = (a: string[], b: string[]) =>
  a.length === b.length && [...a].sort().join() === [...b].sort().join();

const displayName = (user: any) =>
  [user?.initial, user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim() ||
  user?.name ||
  user?.email ||
  "Unknown";

const namesOf = async (ids: string[]): Promise<string> => {
  if (!ids.length) return "-";

  const users = await User.find({ _id: { $in: ids } }).select(employeeSelect);

  return users.length ? users.map(displayName).join(", ") : "-";
};

// The person behind the change, blank when the request carried no user
const nameOf = async (id: any): Promise<string> => {
  if (!id) return "";

  const user = await User.findById(String(id?._id || id)).select(
    employeeSelect
  );

  return user ? displayName(user) : "";
};

// The boards an employee is on - the only tasks they are allowed to read
const assignedBoardIds = async (employeeId: string) => {
  const boards = await JobBoard.find({ employeeId }).select("_id");
  return boards.map((board) => String(board._id));
};

const getAllJobBoardTaskFromDB = async (
  query: Record<string, unknown>,
  authUser?: any
) => {
  const filter: Record<string, unknown> = {};

  const { companyId, jobBoardId, taskDoneBy, isCompleted } = query;
  if (companyId) filter.companyId = companyId;
  if (jobBoardId) filter.jobBoardId = jobBoardId;
  if (taskDoneBy) filter.taskDoneBy = taskDoneBy;
  if (isCompleted === "true" || isCompleted === "false") {
    filter.isCompleted = isCompleted === "true";
  }

  if (authUser?.role === "employee") {
    const boardIds = await assignedBoardIds(authUser._id);

    if (jobBoardId && !boardIds.includes(String(jobBoardId))) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You are not assigned to this job board"
      );
    }

    if (!jobBoardId) filter.jobBoardId = { $in: boardIds };
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

const getSingleJobBoardTaskFromDB = async (id: string, authUser?: any) => {
  const result = await populateTask(JobBoardTask.findById(id));

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Task not found");
  }

  if (authUser?.role === "employee") {
    const boardIds = await assignedBoardIds(authUser._id);
    const boardId = String(result.jobBoardId?._id || result.jobBoardId);

    if (!boardIds.includes(boardId)) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You are not assigned to this job board"
      );
    }
  }

  return result;
};

const createJobBoardTaskIntoDB = async (
  payload: Partial<TJobBoardTask> & { updatedBy?: any },
  actorId?: string
) => {
  const jobBoard = await JobBoard.findById(payload.jobBoardId);

  if (!jobBoard) {
    throw new AppError(httpStatus.NOT_FOUND, "Job board not found");
  }

  // The history is written here, never taken from the request
  const { logs: _ignoredLogs, updatedBy, ...taskData } = payload as any;
  const actor = actorId || updatedBy || null;

  const taskDate = payload.taskDate || new Date();
  const documents = getDocuments(payload.documents);

  const createdBy = await nameOf(actor);
  const createdAt = new Date();

  const createLog = {
    title: createdBy
      ? `Task created by ${createdBy} on ${formatDateTime(createdAt)}.`
      : `Task created on ${formatDateTime(createdAt)}.`,
    date: createdAt,
    updatedBy: actor,
    action: "create",
    changes: [],
    taskDoneBy: toIdList(payload.taskDoneBy),
    ...textSnapshot(payload),
    documents,
  };

  try {
    const result = await JobBoardTask.create({
      ...taskData,
      companyId: payload.companyId || jobBoard.companyId,
      taskDate,
      documents,
      isCompleted: payload.isCompleted || false,
      logs: [createLog],
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
  payload: Partial<TJobBoardTask> & { completedBy?: any; updatedBy?: any },
  actorId?: string
) => {
  const task = await JobBoardTask.findById(id);

  if (!task) {
    throw new AppError(httpStatus.NOT_FOUND, "Task not found");
  }

  // The history is written here, never taken from the request
  const { logs: _ignoredLogs, updatedBy, ...changeable } = payload as any;
  const updateData: Record<string, unknown> = { ...changeable };
  const actor = actorId || updatedBy || payload.completedBy || null;

  const changes: TJobBoardTaskLogChange[] = [];

  if (payload.taskName !== undefined && payload.taskName !== task.taskName) {
    changes.push({
      field: "Task name",
      from: task.taskName,
      to: payload.taskName,
    });
  }

  if (
    payload.taskDate !== undefined &&
    formatDate(payload.taskDate) !== formatDate(task.taskDate)
  ) {
    changes.push({
      field: "Task date",
      from: formatDate(task.taskDate),
      to: formatDate(payload.taskDate),
    });
  }

  TEXT_FIELDS.forEach(({ key, label }) => {
    const next = (payload as any)[key];
    if (next === undefined) return;

    const current = (task as any)[key] || "";
    if ((next || "") === current) return;

    changes.push({
      field: label,
      from: current || "-",
      to: next || "-",
    });
  });

  if ("documents" in payload) {
    const nextDocuments = getDocuments(payload.documents);
    const currentDocuments = getDocuments(task.documents);
    updateData.documents = nextDocuments;

    if (
      nextDocuments.length !== currentDocuments.length ||
      nextDocuments.some((doc, index) => doc !== currentDocuments[index])
    ) {
      changes.push({
        field: "Documents",
        from: `${currentDocuments.length} file(s)`,
        to: `${nextDocuments.length} file(s)`,
      });
    }
  }

  let doneByChanged = false;

  if (payload.taskDoneBy !== undefined) {
    const nextDoneBy = toIdList(payload.taskDoneBy);
    const currentDoneBy = toIdList(task.taskDoneBy);

    if (!sameIdList(nextDoneBy, currentDoneBy)) {
      doneByChanged = true;
      changes.push({
        field: "Worked by",
        from: await namesOf(currentDoneBy),
        to: await namesOf(nextDoneBy),
      });
    }
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

  const now = new Date();
  const doneByNow = toIdList(payload.taskDoneBy ?? task.taskDoneBy);
  const logsToAdd: any[] = [];

  const baseLog = {
    date: now,
    updatedBy: actor,
    changes,
    taskDoneBy: doneByNow,
    ...textSnapshot(payload, task),
    documents:
      "documents" in payload
        ? getDocuments(payload.documents)
        : getDocuments(task.documents),
  };

  const completionChanged =
    "isCompleted" in payload && Boolean(payload.isCompleted) !== task.isCompleted;

  // Every title reads as a full sentence, so the UI prints it as it stands
  const actorName = await nameOf(actor);
  const by = actorName ? ` by ${actorName}` : "";
  const on = ` on ${formatDateTime(now)}`;

  if (completionChanged && payload.isCompleted) {
    const workedBy = await namesOf(doneByNow);

    logsToAdd.push({
      ...baseLog,
      action: "complete",
      title:
        workedBy === "-"
          ? `Task completed — marked complete${by}${on}.`
          : actorName
            ? `Task completed — Work done by ${workedBy} and marked complete by ${actorName}${on}.`
            : `Task completed — Work done by ${workedBy}${on}.`,
    });
  } else if (completionChanged) {
    logsToAdd.push({
      ...baseLog,
      action: "reopen",
      title: `Task reopened${by}${on}.`,
    });
  } else if (changes.length) {
    // Nothing is logged when the request changes nothing
    const workedBy = doneByChanged ? await namesOf(doneByNow) : "-";

    logsToAdd.push({
      ...baseLog,
      action: "update",
      title:
        workedBy === "-"
          ? `Task updated${by}${on}.`
          : actorName
            ? `Task updated — Work done by ${workedBy} and marked complete by ${actorName}${on}.`
            : `Task updated — Work done by ${workedBy}${on}.`,
    });
  }

  await JobBoardTask.findByIdAndUpdate(
    id,
    {
      $set: updateData,
      ...(logsToAdd.length ? { $push: { logs: { $each: logsToAdd } } } : {}),
    },
    {
      new: true,
      runValidators: true,
    }
  );

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
