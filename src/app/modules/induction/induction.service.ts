import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { Induction } from "./induction.model";
import { TInduction } from "./induction.interface";
import { InductionSearchableFields } from "./induction.constant";
import moment from "moment";

const getAllInductionFromDB = async (query: Record<string, unknown>) => {
  const InductionQuery = new QueryBuilder(Induction.find().populate("logs.updatedBy", "firstName lastName initial name"), query)
    .search(InductionSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await InductionQuery.countTotal();
  const result = await InductionQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleInductionFromDB = async (id: string) => {
  const result = await Induction.findById(id);
  return result;
};

const updateInductionIntoDB = async (
  id: string,
  payload: Partial<TInduction> & { updatedBy?: string; document?: string }
) => {
  const induction = await Induction.findById(id);
  if (!induction) {
    throw new AppError(httpStatus.NOT_FOUND, "Induction record not found");
  }

  // Extract separate fields
  const { updatedBy, document, ...updateData } = payload;

  const updateQuery: any = {
    $set: { ...updateData },
    $push: {},
    $unset: {},
  };

  // --- LOGIC A: 'No Promotion' is Checkmarked ---
  if (updateData.noPromotion === true) {
    
    // 1. Create Log Entry
    const newLogEntry = {
      title: "Induction Review: No Promotion",
      date: new Date(),
      updatedBy: updatedBy,
      document: document || "",
    };
    updateQuery.$push.logs = newLogEntry;

    // 2. CRITICAL: Prevent inductionDate from updating
    // We remove it from the $set object so the DB retains the old date
    delete updateQuery.$set.inductionDate;
    
    // 3. Set the status
    updateQuery.$set.noPromotion = true;
    updateQuery.$set.action = ""; // Clear any pending actions
  }

  // --- LOGIC B: Action is 'promotion' (and noPromotion is false/undefined) ---
  else if (updateData.action === 'promotion') {
    
    // 1. Get Dates for the Log
    const oldDate = induction.inductionDate 
      ? moment(induction.inductionDate).format('DD MMM YYYY') 
      : "N/A";

    const newDateRaw = updateData.inductionDate;
    const newDate = newDateRaw 
      ? moment(newDateRaw).format('DD MMM YYYY') 
      : "N/A";

    // 2. Create Log Title
    const logTitle = `Promoted: Induction date changed from ${oldDate} to ${newDate}`;

    // 3. Create Log Entry
    const newLogEntry = {
      title: logTitle,
      date: new Date(),
      updatedBy: updatedBy,
      document: document || "",
    };

    updateQuery.$push.logs = newLogEntry;

    // 4. Update the main inductionDate
    if (newDateRaw) {
        updateQuery.$set.inductionDate = newDateRaw;
    }

    // 5. Cleanup flags
    updateQuery.$set.action = "";
    updateQuery.$set.noPromotion = false; // Ensure this is false if they are promoted
  }

  // Cleanup empty operators
  if (Object.keys(updateQuery.$push).length === 0) delete updateQuery.$push;
  if (Object.keys(updateQuery.$unset).length === 0) delete updateQuery.$unset;

  const result = await Induction.findByIdAndUpdate(
    id,
    updateQuery,
    {
      new: true,
      runValidators: true,
    }
  );

  return result;
};


const createInductionIntoDB = async (
  payload: Partial<TInduction> & { updatedBy?: string; document?: string }
) => {
  const { updatedBy, document, ...inductionData } = payload;

  // 1. Prepare Initial Log
  const scheduledDateStr = inductionData.inductionDate 
    ? moment(inductionData.inductionDate).format('DD MMM YYYY') 
    : "Not Set";

  const initialLog = {
    title: `Induction Scheduled for ${scheduledDateStr}`,
    date: new Date(),
    updatedBy: updatedBy,
    document: document || "",
  };

  // 2. Create Record with Log
  const result = await Induction.create({
    ...inductionData,
    logs: [initialLog],
    noPromotion: false 
  });

  return result;
};



export const InductionServices = {
  getAllInductionFromDB,
  getSingleInductionFromDB,
  updateInductionIntoDB,
  createInductionIntoDB
  
};
