import httpStatus from "http-status";

import AppError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { Rota } from "./rota.model";
import { TRota } from "./rota.interface";
import { RotaSearchableFields } from "./rota.constant";
import moment from "moment";
import { EmployeeRate } from "../hr/employeeRate/employeeRate.model";
import { User } from "../user/user.model";


const getAllRotaFromDB = async (query: Record<string, unknown>) => {
  const { startDate, endDate, ...restQuery } = query;

  const dateFilter: Record<string, any> = {};
  
  if (startDate || endDate) {
    dateFilter.startDate = {};
    if (startDate) dateFilter.startDate.$gte = startDate;
    if (endDate) dateFilter.startDate.$lte = endDate;
  }

  const userQuery = new QueryBuilder(Rota.find(dateFilter), restQuery)
    .search(RotaSearchableFields)
    .filter(restQuery) 
    .sort()
    .paginate()
    .fields();

  const meta = await userQuery.countTotal();
  

  // const result = await userQuery.modelQuery.populate('shiftId').populate('employeeId');
  const result = await userQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleRotaFromDB = async (id: string) => {
  const result = await Rota.findById(id);
  return result;
};


const createRotaIntoDB = async (payload: TRota) => {
    try {
      
      const result = await Rota.create(payload);
      return result;
    } catch (error: any) {
      console.error("Error in createRotaIntoDB:", error);
  
      // Throw the original error or wrap it with additional context
      if (error instanceof AppError) {
        throw error;
      }
  
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message || "Failed to create Rota");
    }
  };


const updateRotaIntoDB = async (id: string, payload: Partial<TRota>) => {
  const notice = await Rota.findById(id);

  if (!notice) {
    throw new AppError(httpStatus.NOT_FOUND, "Rota not found");
  }

  
  // Update only the selected user
  const result = await Rota.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};



const deleteRotaFromDB = async (id: string) => {
  const rota = await Rota.findById(id);

  if (!rota) {
    throw new AppError(httpStatus.NOT_FOUND, "Rota not found");
  }

  await Rota.findByIdAndDelete(id);

  return { message: "Rota deleted successfully" };
};




const copyRotaIntoDB = async (payload: { 
  companyId: string, 
  type: 'week' | 'month', 
  sourceStart: string, 
  targetStart: string 
}) => {

  const { companyId, type, sourceStart, targetStart } = payload;

  const sourceStartMom = moment(sourceStart);
  const targetStartMom = moment(targetStart);

  let sourceEndMom;
  let targetEndMom;

  if (type === 'week') {
    sourceEndMom = moment(sourceStart).endOf('week');
    targetEndMom = moment(targetStart).endOf('week');
  } else {
    sourceEndMom = moment(sourceStart).endOf('month');
    targetEndMom = moment(targetStart).endOf('month');
  }

  const sourceRotas = await Rota.find({
    companyId,
    startDate: {
      $gte: sourceStartMom.format('YYYY-MM-DD'),
      $lte: sourceEndMom.format('YYYY-MM-DD')
    }
  }).lean();

  if (!sourceRotas.length) {
    throw new AppError(httpStatus.NOT_FOUND, "No shifts found in the source period to copy.");
  }

  const targetRotas = await Rota.find({
    companyId,
    startDate: {
      $gte: targetStartMom.format('YYYY-MM-DD'),
      $lte: targetEndMom.format('YYYY-MM-DD')
    }
  }).lean();

  // 🔹 Fetch employees for names
  const employeeIds = [
    ...new Set(sourceRotas.map(r => r.employeeId.toString()))
  ];

  const employees = await User.find({
    _id: { $in: employeeIds }
  }).select('firstName lastName').lean();

  const employeeMap = new Map(
    (employees as any).map((emp: any) => [
      emp._id.toString(),
      { firstName: emp.firstName, lastName: emp.lastName }
    ])
  );

  const existingTargetMap = new Set(
    targetRotas.map(r => `${r.employeeId.toString()}_${r.startDate}`)
  );

  const rotasToCreate = [];
  const skippedRecords = [];

  for (const rota of sourceRotas) {

    let newStartDate, newEndDate;

    if (type === 'week') {
      const diffDays = targetStartMom.diff(sourceStartMom, 'days');
      newStartDate = moment(rota.startDate).add(diffDays, 'days').format('YYYY-MM-DD');
      newEndDate = moment(rota.endDate).add(diffDays, 'days').format('YYYY-MM-DD');
    } else {
      const diffMonths = targetStartMom.diff(sourceStartMom, 'months');
      newStartDate = moment(rota.startDate).add(diffMonths, 'months').format('YYYY-MM-DD');
      newEndDate = moment(rota.endDate).add(diffMonths, 'months').format('YYYY-MM-DD');
    }

    const conflictKey = `${rota.employeeId.toString()}_${newStartDate}`;

    if (existingTargetMap.has(conflictKey)) {
      const empInfo:any = employeeMap.get(rota.employeeId.toString());

      skippedRecords.push({
        employeeId: rota.employeeId,
        firstName: empInfo?.firstName || '',
        lastName: empInfo?.lastName || '',
        date: newStartDate,
        reason: 'Employee already has a shift assigned on the target date'
      });

      continue;
    }

    const { _id, createdAt, updatedAt, __v, ...restRotaData } = rota as any;

    rotasToCreate.push({
      ...restRotaData,
      startDate: newStartDate,
      endDate: newEndDate,
    });
  }

  let result: any[] = [];
  if (rotasToCreate.length > 0) {
    result = await Rota.insertMany(rotasToCreate);
  }

  return {
    meta: {
      totalSourceShifts: sourceRotas.length,
      copiedCount: rotasToCreate.length,
      skippedCount: skippedRecords.length,
      hasSkippedRecords: skippedRecords.length > 0,
      skippedRecords
    },
    result
  };
};


const bulkAssignRotaIntoDB = async (payload: {
  companyId: string;
  employeeIds: any[]; // can be string[] or object[]
  startDate: string;
  endDate: string;
  shiftName?: string;
  leaveType?: string;
  startTime?: string;
  endTime?: string;
}) => {

  const { 
    companyId, 
    employeeIds: rawEmployeeIds, 
    startDate, 
    endDate, 
    shiftName, 
    leaveType, 
    startTime, 
    endTime 
  } = payload;

  // ✅ Normalize: extract _id whether it's a string or object
  const employeeIds = rawEmployeeIds.map((e: any) =>
    typeof e === 'string' ? e : e._id?.toString()
  ).filter(Boolean);

  const isStandardShift = !leaveType;

  const startMom = moment(startDate);
  const endMom = moment(endDate);
  const totalDays = endMom.diff(startMom, 'days');

  let crossesMidnight = false;
  if (isStandardShift && startTime && endTime) {
    crossesMidnight = endTime < startTime;
  }

  // ✅ Fetch employee names
  const employees = await User.find({
    _id: { $in: employeeIds }
  }).select('firstName lastName').lean();

  const employeeMap = new Map(
    (employees as any).map((emp: any) => [
      emp._id.toString(),
      { firstName: emp.firstName, lastName: emp.lastName }
    ])
  );

  // ✅ Fetch existing rotas for conflict detection
  const existingRotas = await Rota.find({
    companyId,
    employeeId: { $in: employeeIds },
    startDate: { $gte: startDate, $lte: endDate }
  }).lean();

  const existingSet = new Set(
    existingRotas.map(r => `${r.employeeId.toString()}_${r.startDate}`)
  );

  const rotasToCreate = [];
  const skippedRecords = [];

  for (let i = 0; i <= totalDays; i++) {
    const currentDateStr = startMom.clone().add(i, 'days').format('YYYY-MM-DD');

    let shiftEndDateStr = currentDateStr;
    if (isStandardShift && crossesMidnight) {
      shiftEndDateStr = moment(currentDateStr).add(1, 'days').format('YYYY-MM-DD');
    }

    for (const empId of employeeIds) {
      const conflictKey = `${empId}_${currentDateStr}`;

      if (existingSet.has(conflictKey)) {
        const empInfo: any = employeeMap.get(empId);

        skippedRecords.push({
          employeeId: empId,
          firstName: empInfo?.firstName || '',
          lastName: empInfo?.lastName || '',
          date: currentDateStr,
          reason: 'Employee already has a shift assigned on this date'
        });

        continue;
      }

      const shiftObj: any = {
        companyId,
        employeeId: empId,
        startDate: currentDateStr,
        endDate: shiftEndDateStr,
      };

      if (!isStandardShift) {
        shiftObj.leaveType = leaveType;
        shiftObj.shiftName = leaveType;
        shiftObj.startTime = '';
        shiftObj.endTime = '';
      } else {
        shiftObj.shiftName = shiftName;
        shiftObj.startTime = startTime;
        shiftObj.endTime = endTime;
      }

      rotasToCreate.push(shiftObj);
    }
  }

  let result: any = [];
  if (rotasToCreate.length > 0) {
    result = await Rota.insertMany(rotasToCreate);
  }

  return {
    meta: {
      requestedEmployeesCount: employeeIds.length,
      totalDaysInRange: totalDays + 1,
      createdShiftsCount: rotasToCreate.length,
      skippedShiftsCount: skippedRecords.length,
      hasSkippedRecords: skippedRecords.length > 0,
      skippedRecords
    },
    result
  };
};



export const RotaServices = {
    getAllRotaFromDB,
    getSingleRotaFromDB,
    updateRotaIntoDB,
    createRotaIntoDB,
    deleteRotaFromDB,
    copyRotaIntoDB,
    bulkAssignRotaIntoDB
  
};



  