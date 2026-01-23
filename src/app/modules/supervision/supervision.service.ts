import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { Supervision } from "./supervision.model";
import { TSupervision } from "./supervision.interface";
import { SupervisionSearchableFields } from "./supervision.constant";
import { User } from "../user/user.model";
import { ScheduleCheck } from "../scheduleCheck/scheduleCheck.model";
import moment from "moment";

const getAllSupervisionFromDB = async (query: Record<string, unknown>) => {
  const SupervisionQuery = new QueryBuilder(Supervision.find().populate("logs.updatedBy", "firstName lastName initial name"), query)
    .search(SupervisionSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await SupervisionQuery.countTotal();
  const result = await SupervisionQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleSupervisionFromDB = async (id: string) => {
  const result = await Supervision.findById(id);
  return result;
};

const updateSupervisionIntoDB = async (
  id: string,
  payload: Partial<TSupervision> & { updatedBy?: string; document?: string; note?: string }
) => {
  const supervision = await Supervision.findById(id);
  if (!supervision) {
    throw new AppError(httpStatus.NOT_FOUND, "Supervision record not found");
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
      title: `Supervision completed for ${moment(
    supervision.scheduledDate
  ).format("DD MMM YYYY")}`,
      date: new Date(),
      updatedBy: updatedBy,
      document: document || "",
      note: note || "",
    };
    updateQuery.$push.logs = newLogEntry;

    // 2. Clear the active session note
    updateQuery.$set.sessionNote = "";

    // 3. Calculate Next Scheduled Date
    const employee = await User.findById(supervision.employeeId);
    
    let durationToAdd = 30; 

    if (employee && employee.company) {
      const scheduleSettings = await ScheduleCheck.findOne({ companyId: employee.company });

      // If settings exist and supervisionDuration is > 0, use it.
      if (scheduleSettings && scheduleSettings.supervisionDuration > 0) {
        durationToAdd = scheduleSettings.supervisionDuration;
      }
    }

    const nextScheduledDate = moment(supervision.scheduledDate)
      .add(durationToAdd, 'days')
      .toDate();

    updateQuery.$set.scheduledDate = nextScheduledDate;
  } 
  
  else {
    if (note !== undefined) {
      updateQuery.$set.sessionNote = note;
    }
  }

  // Cleanup empty operators
  if (Object.keys(updateQuery.$push).length === 0) delete updateQuery.$push;
  if (Object.keys(updateQuery.$unset).length === 0) delete updateQuery.$unset;

  const result = await Supervision.findByIdAndUpdate(
    id,
    updateQuery,
    {
      new: true,
      runValidators: true,
    }
  );

  return result;
};

const createSupervisionIntoDB = async (
  payload: Partial<TSupervision> & { updatedBy?: string; note?: string, document?: string; }
) => {
  const { updatedBy, note,document, ...supervisionData } = payload;

  // 1. Prepare Initial Log
  const scheduledDateStr = supervisionData.scheduledDate 
    ? moment(supervisionData.scheduledDate).format('DD MMM YYYY') 
    : "Not Set";

  const initialLog = {
    title: `Supervision Scheduled for ${scheduledDateStr}`,
    date: new Date(),
    updatedBy: updatedBy,
    document: document||"", 
    note: note,
  };

  // 2. Create Record with Log
  const result = await Supervision.create({
    ...supervisionData,
    logs: [initialLog],
    sessionNote: note || "" // Set initial session note if provided
  });

  return result;
};



export const SupervisionServices = {
  getAllSupervisionFromDB,
  getSingleSupervisionFromDB,
  updateSupervisionIntoDB,
  createSupervisionIntoDB
  
};
