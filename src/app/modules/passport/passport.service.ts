import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { Passport } from "./passport.model";
import { TPassport } from "./passport.interface";
import { PassportSearchableFields } from "./passport.constant";

const getAllPassportFromDB = async (query: Record<string, unknown>) => {
  const PassportQuery = new QueryBuilder(Passport.find(), query)
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

const updatePassportIntoDB = async (id: string, payload: Partial<TPassport>) => {
  const passport = await Passport.findById(id);
  if (!passport) {
    throw new AppError(httpStatus.NOT_FOUND, "Passport not found");
  }

  const result = await Passport.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};


const createPassportIntoDB = async (payload: Partial<TPassport>) => {
  const result = await Passport.create(payload);
  return result;
};




export const PassportServices = {
  getAllPassportFromDB,
  getSinglePassportFromDB,
  updatePassportIntoDB,
  createPassportIntoDB
  
};
