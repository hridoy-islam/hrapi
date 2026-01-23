import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { QACheck } from "./QACheck.model";
import { TQACheck } from "./QACheck.interface";
import { QACheckSearchableFields } from "./QACheck.constant";
import { User } from "../user/user.model";
import moment from "moment";
import { ScheduleCheck } from "../scheduleCheck/scheduleCheck.model";

const getAllQACheckFromDB = async (query: Record<string, unknown>) => {
  const QACheckQuery = new QueryBuilder(QACheck.find().populate("logs.updatedBy", "firstName lastName initial name"), query)
    .search(QACheckSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await QACheckQuery.countTotal();
  const result = await QACheckQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleQACheckFromDB = async (id: string) => {
  const result = await QACheck.findById(id);
  return result;
};

const updateQACheckIntoDB = async (
  id: string,
  payload: Partial<TQACheck> & { updatedBy?: string; document?: string; note?: string }
) => {
  const qaCheck = await QACheck.findById(id);
  if (!qaCheck) {
    throw new AppError(httpStatus.NOT_FOUND, "QA Check not found");
  }

  const { updatedBy, document, note, ...updateData } = payload;

  const updateQuery: any = {
    $set: { ...updateData },
    $push: {},
    $unset: {},
  };

  // Mark as completed if completionDate is set
  if (updateData.completionDate !== undefined) {
    // 1. Add completion log
    const newLogEntry = {
      title: `QA Check completed for ${moment(qaCheck.scheduledDate).format("DD MMM YYYY")}`,
      date: new Date(),
      updatedBy: updatedBy,
      document: document || "",
      note: note || "",
    };
    updateQuery.$push.logs = newLogEntry;

    // 2. Clear pending note
    updateQuery.$set.QACheckNote = "";

    // 3. Schedule next QA check
    const employee = await User.findById(qaCheck.employeeId);
    let durationToAdd = 30; // fallback

    if (employee?.company) {
      const scheduleSettings = await ScheduleCheck.findOne({
        companyId: employee.company,
      });

      if (scheduleSettings && scheduleSettings.qaCheckDuration > 0) {
        durationToAdd = scheduleSettings.qaCheckDuration;
      }
    }

    const nextScheduledDate = moment(qaCheck.scheduledDate)
      .add(durationToAdd, "days")
      .toDate();

    updateQuery.$set.scheduledDate = nextScheduledDate;

  } else {
    if (note !== undefined) {
      updateQuery.$set.QACheckNote = note;
    }
  }

  // Clean up empty operators
  if (Object.keys(updateQuery.$push).length === 0) delete updateQuery.$push;
  if (Object.keys(updateQuery.$unset).length === 0) delete updateQuery.$unset;

  const result = await QACheck.findByIdAndUpdate(id, updateQuery, {
    new: true,
    runValidators: true,
  });

  return result;
};


const createQACheckIntoDB = async (
  payload: Partial<TQACheck> & { updatedBy?: string; note?: string; document?: string }
) => {
  const { updatedBy, note, document, ...QACheckData } = payload;

  const scheduledDateStr = QACheckData.scheduledDate
    ? moment(QACheckData.scheduledDate).format("DD MMM YYYY")
    : "Not Set";

  const initialLog = {
    title: `QA Check scheduled for ${scheduledDateStr}`,
    date: new Date(),
    updatedBy: updatedBy,
    document: document || "",
    note: note || "",
  };

  const result = await QACheck.create({
    ...QACheckData,
    logs: [initialLog],
    QACheckNote: note || "", 
  });

  return result;
};




export const QACheckServices = {
  getAllQACheckFromDB,
  getSingleQACheckFromDB,
  updateQACheckIntoDB,
  createQACheckIntoDB
  
};
