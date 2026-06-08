import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { DbsForm } from "./dbsForm.model";
import { TDbsForm } from "./dbsForm.interface";
import { DbsFormSearchableFields } from "./dbsForm.constant";

const getAllDbsFormFromDB = async (query: Record<string, unknown>) => {
  const DbsFormQuery = new QueryBuilder(DbsForm.find().populate("logs.updatedBy", "firstName lastName initial name"), query)
    .search(DbsFormSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await DbsFormQuery.countTotal();
  const result = await DbsFormQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleDbsFormFromDB = async (id: string) => {
  const result = await DbsForm.findById(id);
  return result;
};

const updateDbsFormIntoDB = async (id: string, payload: Partial<TDbsForm>& { date?: Date; updatedBy?: string }) => {
  const dbsForm = await DbsForm.findById(id);
  if (!dbsForm) {
    throw new AppError(httpStatus.NOT_FOUND, "DbsForm not found");
  }

 const {  date, updatedBy, ...updateData } = payload;

  const newLogEntry = {
    title: "DBS Details Updated",
    date:  new Date(),
    updatedBy: updatedBy,
    document: updateData.dbsDocumentUrl||'',
  };

  
  const result = await DbsForm.findByIdAndUpdate(
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


const createDbsFormIntoDB = async (payload: Partial<TDbsForm> & { date?: Date; updatedBy?: string }) => {
 const {  date, updatedBy, ...formData } = payload;


  const initialLog = {
    title:  `DBS Record Initiated`,
    date:  new Date(),
    updatedBy: updatedBy, 
    document: formData.dbsDocumentUrl||'',
  };

  
  const docData = {
    ...formData,
    updatedBy, 
    logs: [initialLog],
  };

  const result = await DbsForm.create(docData);
  return result;
};


const updateDbsFormLogIntoDB = async (
  id: string,
  logId: string,
  payload: { document: string[] }
) => {
  const dbsForm = await DbsForm.findById(id);

  if (!dbsForm) {
    throw new AppError(httpStatus.NOT_FOUND, "DBS Form not found");
  }

  // Find the subdocument entry inside the logs array using Mongoose's .id() method
  const log = (dbsForm.logs as any)?.id(logId);

  if (!log) {
    throw new AppError(httpStatus.NOT_FOUND, "Log entry not found");
  }

  // Update the document array inside the target log
  log.document = payload.document;

  // Persist changes to the database
  const result = await dbsForm.save();
  return result;
};

export const DbsFormServices = {
  getAllDbsFormFromDB,
  getSingleDbsFormFromDB,
  updateDbsFormIntoDB,
  createDbsFormIntoDB,
  updateDbsFormLogIntoDB
  
};
