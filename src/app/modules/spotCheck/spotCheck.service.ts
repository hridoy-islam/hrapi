import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { SpotCheck } from "./spotCheck.model";
import { TSpotCheck } from "./spotCheck.interface";
import { SpotCheckSearchableFields } from "./spotCheck.constant";

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

const updateSpotCheckIntoDB = async (id: string, payload: Partial<TSpotCheck>& { date?: Date; updatedBy?: string }) => {
  const spotCheck = await SpotCheck.findById(id);
  if (!spotCheck) {
    throw new AppError(httpStatus.NOT_FOUND, "SpotCheck not found");
  }

 const {  date, updatedBy, ...updateData } = payload;

  const newLogEntry = {
    title: "DBS Details Updated",
    date:  new Date(),
    updatedBy: updatedBy,
    document: updateData.dbsDocumentUrl||'',
  };

  
  const result = await SpotCheck.findByIdAndUpdate(
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


const createSpotCheckIntoDB = async (payload: Partial<TSpotCheck> & { date?: Date; updatedBy?: string }) => {
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

  const result = await SpotCheck.create(docData);
  return result;
};




export const SpotCheckServices = {
  getAllSpotCheckFromDB,
  getSingleSpotCheckFromDB,
  updateSpotCheckIntoDB,
  createSpotCheckIntoDB
  
};
