import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { Supervision } from "./supervision.model";
import { TSupervision } from "./supervision.interface";
import { SupervisionSearchableFields } from "./supervision.constant";

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

const updateSupervisionIntoDB = async (id: string, payload: Partial<TSupervision>& { date?: Date; updatedBy?: string }) => {
  const supervision = await Supervision.findById(id);
  if (!supervision) {
    throw new AppError(httpStatus.NOT_FOUND, "Supervision not found");
  }

 const {  date, updatedBy, ...updateData } = payload;

  const newLogEntry = {
    title: "DBS Details Updated",
    date:  new Date(),
    updatedBy: updatedBy,
    document: updateData.dbsDocumentUrl||'',
  };

  
  const result = await Supervision.findByIdAndUpdate(
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


const createSupervisionIntoDB = async (payload: Partial<TSupervision> & { date?: Date; updatedBy?: string }) => {
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

  const result = await Supervision.create(docData);
  return result;
};




export const SupervisionServices = {
  getAllSupervisionFromDB,
  getSingleSupervisionFromDB,
  updateSupervisionIntoDB,
  createSupervisionIntoDB
  
};
