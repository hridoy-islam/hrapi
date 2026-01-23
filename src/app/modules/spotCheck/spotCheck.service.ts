import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { SpotCheck } from "./spotCheck.model";
import { TSpotCheck } from "./spotCheck.interface";
import { SpotCheckSearchableFields } from "./spotCheck.constant";
import { User } from "../user/user.model";
import moment from "moment";
import { ScheduleCheck } from "../scheduleCheck/scheduleCheck.model";

const getAllSpotCheckFromDB = async (query: Record<string, unknown>) => {
  const SpotCheckQuery = new QueryBuilder(SpotCheck.find().populate("logs.updatedBy", "firstName lastName initial name"), query)
    .search(SpotCheckSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await SpotCheckQuery.countTotal();
  const result = await SpotCheckQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleSpotCheckFromDB = async (id: string) => {
  const result = await SpotCheck.findById(id);
  return result;
};

const updateSpotCheckIntoDB = async (
  id: string,
  payload: Partial<TSpotCheck> & { updatedBy?: string; document?: string; note?: string }
) => {
  const spotCheck = await SpotCheck.findById(id);
  if (!spotCheck) {
    throw new AppError(httpStatus.NOT_FOUND, "SpotCheck not found");
  }

  const { updatedBy, document, note, ...updateData } = payload;

  const updateQuery: any = {
    $set: { ...updateData },
    $push: {},
    $unset: {},
  };

  if (updateData.completionDate) {
    // 1. Create Log Entry
    const newLogEntry = {
      title: `Spot Check completed for ${moment(
        spotCheck.scheduledDate
      ).format("DD MMM YYYY")}`,
      date: new Date(),
      updatedBy: updatedBy,
      document: document || "",
      note: note || "",
    };

    updateQuery.$push.logs = newLogEntry;

    // 2. Clear active spot check note
    updateQuery.$set.spotCheckNote = "";

    // 3. Calculate next scheduled date
    const employee = await User.findById(spotCheck.employeeId);

    let durationToAdd = 30;

    if (employee && employee.company) {
      const scheduleSettings = await ScheduleCheck.findOne({
        companyId: employee.company,
      });

      if (scheduleSettings && scheduleSettings.spotCheckDuration > 0) {
        durationToAdd = scheduleSettings.spotCheckDuration;
      }
    }

    const nextScheduledDate = moment(spotCheck.scheduledDate)
      .add(durationToAdd, "days")
      .toDate();

    updateQuery.$set.scheduledDate = nextScheduledDate;
  } else {
    if (note !== undefined) {
      updateQuery.$set.spotCheckNote = note;
    }
  }

  // Cleanup empty operators
  if (Object.keys(updateQuery.$push).length === 0) delete updateQuery.$push;
  if (Object.keys(updateQuery.$unset).length === 0) delete updateQuery.$unset;

  const result = await SpotCheck.findByIdAndUpdate(id, updateQuery, {
    new: true,
    runValidators: true,
  });

  return result;
};


const createSpotCheckIntoDB = async (
  payload: Partial<TSpotCheck> & { updatedBy?: string; note?: string; document?: string }
) => {
  const { updatedBy, note, document, ...spotCheckData } = payload;

  // 1. Prepare Initial Log
  const scheduledDateStr = spotCheckData.scheduledDate
    ? moment(spotCheckData.scheduledDate).format("DD MMM YYYY")
    : "Not Set";

  const initialLog = {
    title: `Spot Check Scheduled for ${scheduledDateStr}`,
    date: new Date(),
    updatedBy: updatedBy,
    document: document || "",
    note: note,
  };

  // 2. Create Record with Log
  const result = await SpotCheck.create({
    ...spotCheckData,
    logs: [initialLog],
    spotCheckNote: note || "",
  });

  return result;
};




export const SpotCheckServices = {
  getAllSpotCheckFromDB,
  getSingleSpotCheckFromDB,
  updateSpotCheckIntoDB,
  createSpotCheckIntoDB
  
};
