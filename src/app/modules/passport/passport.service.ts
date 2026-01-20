import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { Passport } from "./passport.model";
import { TPassport } from "./passport.interface";
import { PassportSearchableFields } from "./passport.constant";

const getAllPassportFromDB = async (query: Record<string, unknown>) => {
  const PassportQuery = new QueryBuilder(Passport.find().populate("logs.updatedBy", "firstName lastName initial name"), query)
    .search(PassportSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await PassportQuery.countTotal();
  const result = await PassportQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSinglePassportFromDB = async (id: string) => {
  const result = await Passport.findById(id);
  return result;
};

const createPassportIntoDB = async (
  payload: Partial<TPassport> & { date?: Date; updatedBy?: string }
) => {
  const { date, updatedBy, ...formData } = payload;

  // 2. Create the initial log entry
  const initialLog = {
    title: "Passport Record Initiated",
    date: new Date(),
    updatedBy: updatedBy,
    document: (formData as any).document || "", 
  };

  // 3. Prepare the document data with the log array
  const docData = {
    ...formData,
    updatedBy,
    logs: [initialLog],
  };

  // 4. Create the record
  const result = await Passport.create(docData);
  return result;
};

const updatePassportIntoDB = async (
  id: string,
  payload: Partial<TPassport> & { date?: Date; updatedBy?: string; title?: string }
) => {
  // 1. Check if passport exists
  const passport = await Passport.findById(id);
  if (!passport) {
    throw new AppError(httpStatus.NOT_FOUND, "Passport not found");
  }

 
  const { date, updatedBy, title, ...updateData } = payload;

  const newLogEntry = {
    title: "Passport Details Updated",
    date: new Date(),
    updatedBy: updatedBy,
    document: (updateData as any).document || "",
  };

  const result = await Passport.findByIdAndUpdate(
    id,
    {
      $set: updateData,
      $push: { logs: newLogEntry },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  return result;
};


export const PassportServices = {
  getAllPassportFromDB,
  getSinglePassportFromDB,
  updatePassportIntoDB,
  createPassportIntoDB
  
};
