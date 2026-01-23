import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { Disciplinary } from "./disciplinary.model";
import { TDisciplinary } from "./disciplinary.interface";
import { DisciplinarySearchableFields } from "./disciplinary.constant";
import moment from "moment";

const getAllDisciplinaryFromDB = async (query: Record<string, unknown>) => {
  const DisciplinaryQuery = new QueryBuilder(Disciplinary.find().populate("logs.updatedBy", "firstName lastName initial name"), query)
    .search(DisciplinarySearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await DisciplinaryQuery.countTotal();
  const result = await DisciplinaryQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleDisciplinaryFromDB = async (id: string) => {
  const result = await Disciplinary.findById(id);
  return result;
};

const updateDisciplinaryIntoDB = async (
  id: string,
  payload: Partial<TDisciplinary> & { updatedBy?: string; document?: string; note?: string }
) => {
  const disciplinary = await Disciplinary.findById(id);
  if (!disciplinary) {
    throw new AppError(httpStatus.NOT_FOUND, "Disciplinary record not found");
  }

  // Destructure payload
  const { updatedBy, document, note, ...updateData } = payload;

  const updateQuery: any = {
    $set: { ...updateData },
    $push: {},
    $unset: {},
  };

  // --- LOGIC A: Action is 'extendDate' ---
  if (updateData.action === 'extendDate') {
    
    // 1. Get Old Date (From existing DB record)
    const oldDate = disciplinary.issueDeadline 
      ? moment(disciplinary.issueDeadline).format('DD/MM/YYYY') 
      : "N/A";

    // 2. Get New Date from the specific 'extendDeadline' field in payload
    const newDateRaw = updateData.extendDeadline; 
    const newDate = newDateRaw 
      ? moment(newDateRaw).format('DD/MM/YYYY') 
      : "N/A";

    // 3. Generate Dynamic Title for the log
    const extensionMessage = `Deadline extended from ${oldDate} to ${newDate}`;

    // 4. Update the actual issue deadline in the DB
    if (newDateRaw) {
      updateQuery.$set.issueDeadline = newDateRaw;
    }

    // 5. Create Log
    const newLogEntry = {
      title: extensionMessage,
      date: new Date(),
      updatedBy: updatedBy,
      document: document || "", 
      note: note || "", 
    };

    updateQuery.$push.logs = newLogEntry;
  }

  // --- LOGIC B: Action is 'resolved' ---
  else if (updateData.action === 'resolved') {
    
    const resolveDateStr = moment().format('DD MMM YYYY');
    const newLogEntry = {
      title: `Issue Resolved on ${resolveDateStr}`,
      date: new Date(),
      updatedBy: updatedBy,
      document: document || "",
      note: note || "",
    };

    updateQuery.$push.logs = newLogEntry;

    // Clean active fields so a new issue can be created later if needed
    updateQuery.$unset = {
      issueDeadline: "",
      extendDeadline: "",
      action: "",
    };

    // Remove these from $set to avoid conflicts with $unset
    delete updateQuery.$set.issueDeadline;
    delete updateQuery.$set.extendDeadline;
    delete updateQuery.$set.action;
  }

  // --- LOGIC C: General Updates (Re-opening or Standard Update) ---
  else {
const deadlineStr = updateData.issueDeadline
    ? moment(updateData.issueDeadline).format('DD MMM YYYY')
    : 'No deadline set';
    const logTitle = updateData.issueDeadline 
       ? `New Disciplinary Issue Created with deadline of ${deadlineStr}`
       : "";

    const newLogEntry = {
      title: logTitle,
      date: new Date(),
      updatedBy: updatedBy,
      document: document || "",
      note: note || "", 
    };

    updateQuery.$push.logs = newLogEntry;
  }

  // Cleanup empty operators
  if (Object.keys(updateQuery.$push).length === 0) delete updateQuery.$push;
  if (Object.keys(updateQuery.$unset).length === 0) delete updateQuery.$unset;

  const result = await Disciplinary.findByIdAndUpdate(
    id,
    updateQuery,
    {
      new: true,
      runValidators: true,
    }
  );

  return result;
};

const createDisciplinaryIntoDB = async (
  payload: Partial<TDisciplinary> & { updatedBy?: string; document?: string; note?: string }
) => {
  
  // Extract log-specific fields from payload
  const { updatedBy, document, note, ...coreData } = payload;
 const deadlineStr = coreData.issueDeadline
    ? moment(coreData.issueDeadline).format('DD/MM/YYYY')
    : 'No deadline set';
  // Create the initial log entry
  const initialLog = {
    title: `New Disciplinary Issue Created with deadline of ${deadlineStr}`,
    date: new Date(),
    updatedBy: updatedBy,
    document: document || "", // Store document in log
    note: note || "",         // Store note in log
  };

  // Prepare data for DB creation
  const newData = {
    ...coreData,
    logs: [initialLog], // Initialize logs array
  };

  const result = await Disciplinary.create(newData);
  return result;
};


export const DisciplinaryServices = {
  getAllDisciplinaryFromDB,
  getSingleDisciplinaryFromDB,
  updateDisciplinaryIntoDB,
  createDisciplinaryIntoDB
  
};
