/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";

import AppError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { JobBoard } from "./jobBoard.model";
import { TJobBoard } from "./jobBoard.interface";
import { JobBoardSearchableFields } from "./jobBoard.constant";
import { JobBoardTask } from "../jobBoardTask/jobBoardTask.model";

const employeeSelect =
  "firstName lastName initial name email image designationId";

const toIdArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter(Boolean) as string[];
  if (typeof value === "string" && value) return [value];
  return [];
};

const getAllJobBoardFromDB = async (query: Record<string, unknown>) => {
  const filter: Record<string, unknown> = {};

  const { companyId, status, employeeId } = query;
  if (companyId) filter.companyId = companyId;
  if (status) filter.status = status;
  if (employeeId) filter.employeeId = employeeId;

  const jobBoardQuery = new QueryBuilder(
    JobBoard.find(filter).populate({
      path: "employeeId",
      select: employeeSelect,
      populate: { path: "designationId", select: "title" },
    }),
    query
  )
    .search(JobBoardSearchableFields)
    .sort()
    .paginate()
    .fields();

  const meta = await jobBoardQuery.countTotal();
  const result = await jobBoardQuery.modelQuery;

  // Task counters, so the list view shows everything at a glance
  const boardIds = result.map((board: any) => board._id);
  const counts = await JobBoardTask.aggregate([
    { $match: { jobBoardId: { $in: boardIds } } },
    {
      $group: {
        _id: "$jobBoardId",
        totalTask: { $sum: 1 },
        completedTask: { $sum: { $cond: ["$isCompleted", 1, 0] } },
      },
    },
  ]);

  const countMap = new Map(
    counts.map((item: any) => [String(item._id), item])
  );

  const resultWithCounts = result.map((board: any) => {
    const stat = countMap.get(String(board._id));
    return {
      ...board.toObject(),
      totalTask: stat?.totalTask || 0,
      completedTask: stat?.completedTask || 0,
      pendingTask: (stat?.totalTask || 0) - (stat?.completedTask || 0),
    };
  });

  return { meta, result: resultWithCounts };
};

const getSingleJobBoardFromDB = async (id: string) => {
  const result = await JobBoard.findById(id).populate({
    path: "employeeId",
    select: employeeSelect,
    populate: { path: "designationId", select: "title" },
  });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Job board not found");
  }

  return result;
};

const createJobBoardIntoDB = async (payload: Partial<TJobBoard>) => {
  try {
    const result = await JobBoard.create({
      ...payload,
      employeeId: toIdArray(payload.employeeId),
      status: payload.status || "active",
    });

    return getSingleJobBoardFromDB(String(result._id));
  } catch (error: any) {
    if (error instanceof AppError) throw error;

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to create job board"
    );
  }
};

const updateJobBoardIntoDB = async (id: string, payload: Partial<TJobBoard>) => {
  const jobBoard = await JobBoard.findById(id);

  if (!jobBoard) {
    throw new AppError(httpStatus.NOT_FOUND, "Job board not found");
  }

  await JobBoard.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return getSingleJobBoardFromDB(id);
};

// Assigning employees is additive, so sending one id never drops the others
const assignEmployeesIntoDB = async (id: string, payload: any) => {
  const employeeIds = toIdArray(payload?.employeeId);

  if (!employeeIds.length) {
    throw new AppError(httpStatus.BAD_REQUEST, "No employee was selected");
  }

  const jobBoard = await JobBoard.findById(id);

  if (!jobBoard) {
    throw new AppError(httpStatus.NOT_FOUND, "Job board not found");
  }

  await JobBoard.findByIdAndUpdate(id, {
    $addToSet: { employeeId: { $each: employeeIds } },
  });

  return getSingleJobBoardFromDB(id);
};

const removeEmployeeFromDB = async (id: string, employeeId: string) => {
  const jobBoard = await JobBoard.findById(id);

  if (!jobBoard) {
    throw new AppError(httpStatus.NOT_FOUND, "Job board not found");
  }

  const isAssigned = jobBoard.employeeId?.some(
    (assigned: any) => String(assigned) === String(employeeId)
  );

  if (!isAssigned) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This employee is not assigned to the job board"
    );
  }

  await JobBoard.findByIdAndUpdate(id, {
    $pull: { employeeId: employeeId },
  });

  return getSingleJobBoardFromDB(id);
};

const deleteJobBoardFromDB = async (id: string) => {
  const jobBoard = await JobBoard.findById(id);

  if (!jobBoard) {
    throw new AppError(httpStatus.NOT_FOUND, "Job board not found");
  }

  // The tasks belong to the board, so they go with it
  await JobBoardTask.deleteMany({ jobBoardId: id });
  const result = await JobBoard.findByIdAndDelete(id);

  return result;
};

export const JobBoardServices = {
  getAllJobBoardFromDB,
  getSingleJobBoardFromDB,
  createJobBoardIntoDB,
  updateJobBoardIntoDB,
  assignEmployeesIntoDB,
  removeEmployeeFromDB,
  deleteJobBoardFromDB,
};
