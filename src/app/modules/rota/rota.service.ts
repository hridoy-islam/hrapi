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
const getUpcomingRotaFromDB = async (query: Record<string, unknown>) => {
  const { ...restQuery } = query;

  // Get today's date in the same format stored in the DB (YYYY-MM-DD)
  const today = moment().format('YYYY-MM-DD');

  // Filter strictly for tasks/shifts from today onwards
  const dateFilter = {
    startDate: { $gte: today }
  };

  // Use the existing QueryBuilder for search, filter, pagination, etc.
  // Default sorting by startDate ascending so the nearest shifts appear first
  const rotaQuery = new QueryBuilder(Rota.find(dateFilter).populate('departmentId').sort({ startDate: 1 }), restQuery)
    .search(RotaSearchableFields)
    .filter(restQuery) 
    .sort()
    .paginate()
    .fields();

  const meta = await rotaQuery.countTotal();
  const result = await rotaQuery.modelQuery;

  return {
    meta,
    result,
  };
};


const deleteRotaFromDB = async (id: string) => {
  const rota = await Rota.findById(id);

  if (!rota) {
    throw new AppError(httpStatus.NOT_FOUND, "Rota not found");
  }

  await Rota.findByIdAndDelete(id);

  return { message: "Rota deleted successfully" };
};




// const copyRotaIntoDB = async (payload: { 
//   companyId: string, 
//   type: 'week' | 'month', 
//   sourceStart: string, 
//   targetStart: string 
// }) => {

//   const { companyId, type, sourceStart, targetStart } = payload;

//   const sourceStartMom = moment(sourceStart);
//   const targetStartMom = moment(targetStart);

//   let sourceEndMom;
//   let targetEndMom;

//   if (type === 'week') {
//     sourceEndMom = moment(sourceStart).endOf('week');
//     targetEndMom = moment(targetStart).endOf('week');
//   } else {
//     sourceEndMom = moment(sourceStart).endOf('month');
//     targetEndMom = moment(targetStart).endOf('month');
//   }

//   const sourceRotas = await Rota.find({
//     companyId,
//     startDate: {
//       $gte: sourceStartMom.format('YYYY-MM-DD'),
//       $lte: sourceEndMom.format('YYYY-MM-DD')
//     }
//   }).lean();

//   if (!sourceRotas.length) {
//     throw new AppError(httpStatus.NOT_FOUND, "No shifts found in the source period to copy.");
//   }

//   const targetRotas = await Rota.find({
//     companyId,
//     startDate: {
//       $gte: targetStartMom.format('YYYY-MM-DD'),
//       $lte: targetEndMom.format('YYYY-MM-DD')
//     }
//   }).lean();

//   // 🔹 Fetch employees for names
//   const employeeIds = [
//     ...new Set(sourceRotas.map(r => r.employeeId.toString()))
//   ];

//   const employees = await User.find({
//     _id: { $in: employeeIds }
//   }).select('firstName lastName').lean();

//   const employeeMap = new Map(
//     (employees as any).map((emp: any) => [
//       emp._id.toString(),
//       { firstName: emp.firstName, lastName: emp.lastName }
//     ])
//   );

//   const existingTargetMap = new Set(
//     targetRotas.map(r => `${r.employeeId.toString()}_${r.startDate}`)
//   );

//   const rotasToCreate = [];
//   const skippedRecords = [];

//   for (const rota of sourceRotas) {

//     let newStartDate, newEndDate;

//     if (type === 'week') {
//       const diffDays = targetStartMom.diff(sourceStartMom, 'days');
//       newStartDate = moment(rota.startDate).add(diffDays, 'days').format('YYYY-MM-DD');
//       newEndDate = moment(rota.endDate).add(diffDays, 'days').format('YYYY-MM-DD');
//     } else {
//       const diffMonths = targetStartMom.diff(sourceStartMom, 'months');
//       newStartDate = moment(rota.startDate).add(diffMonths, 'months').format('YYYY-MM-DD');
//       newEndDate = moment(rota.endDate).add(diffMonths, 'months').format('YYYY-MM-DD');
//     }

//     const conflictKey = `${rota.employeeId.toString()}_${newStartDate}`;

//     if (existingTargetMap.has(conflictKey)) {
//       const empInfo:any = employeeMap.get(rota.employeeId.toString());

//       skippedRecords.push({
//         employeeId: rota.employeeId,
//         firstName: empInfo?.firstName || '',
//         lastName: empInfo?.lastName || '',
//         date: newStartDate,
//         reason: 'Employee already has a shift assigned on the target date'
//       });

//       continue;
//     }

//     const { _id, createdAt, updatedAt, __v, ...restRotaData } = rota as any;

//     rotasToCreate.push({
//       ...restRotaData,
//       startDate: newStartDate,
//       endDate: newEndDate,
//     });
//   }

//   let result: any[] = [];
//   if (rotasToCreate.length > 0) {
//     result = await Rota.insertMany(rotasToCreate);
//   }

//   return {
//     meta: {
//       totalSourceShifts: sourceRotas.length,
//       copiedCount: rotasToCreate.length,
//       skippedCount: skippedRecords.length,
//       hasSkippedRecords: skippedRecords.length > 0,
//       skippedRecords
//     },
//     result
//   };
// };



const copyRotaIntoDB = async (payload: {
  companyId: string;
  type: "week" | "month";
  sourceStart: string;
  targetStart: string;
}) => {
  const { companyId, type, sourceStart, targetStart } = payload;

  const sourceStartMom = moment(sourceStart).startOf(
    type === "week" ? "week" : "month",
  );

  const sourceEndMom = moment(sourceStart).endOf(
    type === "week" ? "week" : "month",
  );

  const targetStartMom = moment(targetStart).startOf(
    type === "week" ? "week" : "month",
  );

  const targetEndMom = moment(targetStart).endOf(
    type === "week" ? "week" : "month",
  );

  // ✅ Get source rotas
  const sourceRotas = await Rota.find({
    companyId,
    startDate: {
      $gte: sourceStartMom.format("YYYY-MM-DD"),
      $lte: sourceEndMom.format("YYYY-MM-DD"),
    },
  }).lean();

  if (!sourceRotas.length) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "No shifts found in the source period to copy.",
    );
  }

  const leaveTypes = ["DO", "AL", "S", "ML", "NT"];

  // ✅ Get ALL target rotas (needed for leave + time conflict)
  const targetRotas = await Rota.find({
    companyId,
    startDate: {
      $gte: targetStartMom.format("YYYY-MM-DD"),
      $lte: targetEndMom.format("YYYY-MM-DD"),
    },
  }).lean();

  // 🔥 Leave conflict set
  const leaveConflictSet = new Set(
    targetRotas
      .filter((r) => leaveTypes.includes(r.leaveType))
      .map((r) => `${r.employeeId}_${r.startDate}_${r.departmentId}`),
  );

  // 🔥 Time conflict set
  const timeConflictSet = new Set(
    targetRotas
      .filter((r) => r.startTime && r.endTime)
      .map(
        (r) =>
          `${r.employeeId}_${r.startDate}_${r.departmentId}_${r.startTime}_${r.endTime}`,
      ),
  );

  // Fetch employee names
  const employeeIds = [
    ...new Set(sourceRotas.map((r) => r.employeeId.toString())),
  ];

  const employees = await User.find({
    _id: { $in: employeeIds },
  })
    .select("firstName lastName")
    .lean();

  const employeeMap = new Map(
    employees.map((emp: any) => [
      emp._id.toString(),
      { firstName: emp.firstName, lastName: emp.lastName },
    ]),
  );

  const rotasToCreate: any[] = [];
  const skippedRecords: any[] = [];

  for (const rota of sourceRotas) {
    let newStartDate: string;
    let newEndDate: string;

    if (type === "week") {
      const diffDays = targetStartMom.diff(sourceStartMom, "days");

      newStartDate = moment(rota.startDate)
        .add(diffDays, "days")
        .format("YYYY-MM-DD");

      newEndDate = moment(rota.endDate)
        .add(diffDays, "days")
        .format("YYYY-MM-DD");
    } else {
      const diffMonths = targetStartMom.diff(sourceStartMom, "months");

      newStartDate = moment(rota.startDate)
        .add(diffMonths, "months")
        .format("YYYY-MM-DD");

      newEndDate = moment(rota.endDate)
        .add(diffMonths, "months")
        .format("YYYY-MM-DD");
    }

    const leaveKey = `${rota.employeeId}_${newStartDate}_${rota.departmentId}`;

    const timeKey =
      rota.startTime && rota.endTime
        ? `${rota.employeeId}_${newStartDate}_${rota.departmentId}_${rota.startTime}_${rota.endTime}`
        : null;

    const empInfo: any = employeeMap.get(rota.employeeId.toString());

    // 🔥 1️⃣ Leave Conflict
    if (leaveConflictSet.has(leaveKey)) {
      skippedRecords.push({
        employeeId: rota.employeeId,
        firstName: empInfo?.firstName || "",
        lastName: empInfo?.lastName || "",
        departmentId: rota.departmentId,
        date: newStartDate,
        reason: "Leave exists in target date for this department",
      });
      continue;
    }

    // 🔥 2️⃣ Time Conflict
    if (timeKey && timeConflictSet.has(timeKey)) {
      skippedRecords.push({
        employeeId: rota.employeeId,
        firstName: empInfo?.firstName || "",
        lastName: empInfo?.lastName || "",
        departmentId: rota.departmentId,
        date: newStartDate,
        startTime: rota.startTime,
        endTime: rota.endTime,
        reason: "Shift with same time already exists in target department",
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
      skippedRecords,
    },
    result,
  };
};


// const bulkAssignRotaIntoDB = async (payload: {
//   companyId: string;
//   employeeIds: any[]; // can be string[] or object[]
//   startDate: string;
//   endDate: string;
//   shiftName?: string;
//   leaveType?: string;
//   startTime?: string;
//   endTime?: string;
// }) => {

//   const { 
//     companyId, 
//     employeeIds: rawEmployeeIds, 
//     startDate, 
//     endDate, 
//     shiftName, 
//     leaveType, 
//     startTime, 
//     endTime 
//   } = payload;

//   // ✅ Normalize: extract _id whether it's a string or object
//   const employeeIds = rawEmployeeIds.map((e: any) =>
//     typeof e === 'string' ? e : e._id?.toString()
//   ).filter(Boolean);

//   const isStandardShift = !leaveType;

//   const startMom = moment(startDate);
//   const endMom = moment(endDate);
//   const totalDays = endMom.diff(startMom, 'days');

//   let crossesMidnight = false;
//   if (isStandardShift && startTime && endTime) {
//     crossesMidnight = endTime < startTime;
//   }

//   // ✅ Fetch employee names
//   const employees = await User.find({
//     _id: { $in: employeeIds }
//   }).select('firstName lastName').lean();

//   const employeeMap = new Map(
//     (employees as any).map((emp: any) => [
//       emp._id.toString(),
//       { firstName: emp.firstName, lastName: emp.lastName }
//     ])
//   );

//   // ✅ Fetch existing rotas for conflict detection
//   const existingRotas = await Rota.find({
//     companyId,
//     employeeId: { $in: employeeIds },
//     startDate: { $gte: startDate, $lte: endDate }
//   }).lean();

//   const existingSet = new Set(
//     existingRotas.map(r => `${r.employeeId.toString()}_${r.startDate}`)
//   );

//   const rotasToCreate = [];
//   const skippedRecords = [];

//   for (let i = 0; i <= totalDays; i++) {
//     const currentDateStr = startMom.clone().add(i, 'days').format('YYYY-MM-DD');

//     let shiftEndDateStr = currentDateStr;
//     if (isStandardShift && crossesMidnight) {
//       shiftEndDateStr = moment(currentDateStr).add(1, 'days').format('YYYY-MM-DD');
//     }

//     for (const empId of employeeIds) {
//       const conflictKey = `${empId}_${currentDateStr}`;

//       if (existingSet.has(conflictKey)) {
//         const empInfo: any = employeeMap.get(empId);

//         skippedRecords.push({
//           employeeId: empId,
//           firstName: empInfo?.firstName || '',
//           lastName: empInfo?.lastName || '',
//           date: currentDateStr,
//           reason: 'Employee already has a shift assigned on this date'
//         });

//         continue;
//       }

//       const shiftObj: any = {
//         companyId,
//         employeeId: empId,
//         startDate: currentDateStr,
//         endDate: shiftEndDateStr,
//       };

//       if (!isStandardShift) {
//         shiftObj.leaveType = leaveType;
//         shiftObj.shiftName = leaveType;
//         shiftObj.startTime = '';
//         shiftObj.endTime = '';
//       } else {
//         shiftObj.shiftName = shiftName;
//         shiftObj.startTime = startTime;
//         shiftObj.endTime = endTime;
//       }

//       rotasToCreate.push(shiftObj);
//     }
//   }

//   let result: any = [];
//   if (rotasToCreate.length > 0) {
//     result = await Rota.insertMany(rotasToCreate);
//   }

//   return {
//     meta: {
//       requestedEmployeesCount: employeeIds.length,
//       totalDaysInRange: totalDays + 1,
//       createdShiftsCount: rotasToCreate.length,
//       skippedShiftsCount: skippedRecords.length,
//       hasSkippedRecords: skippedRecords.length > 0,
//       skippedRecords
//     },
//     result
//   };
// };


const bulkAssignRotaIntoDB = async (payload: {
  companyId: string;
  departmentId: string;
  employeeIds: any[];
  startDate: string;
  endDate: string;
  shiftName?: string;
  leaveType?: string;
  startTime?: string;
  endTime?: string;
}) => {
  const {
    companyId,
    departmentId,
    employeeIds: rawEmployeeIds,
    startDate,
    endDate,
    shiftName,
    leaveType,
    startTime,
    endTime,
  } = payload;

  const leaveTypes = ["DO", "AL", "S", "ML", "NT"];
  const isStandardShift = !leaveType;

  // ✅ Normalize employeeIds
  const employeeIds = rawEmployeeIds
    .map((e: any) => (typeof e === "string" ? e : e._id?.toString()))
    .filter(Boolean);

  const startMom = moment(startDate);
  const endMom = moment(endDate);
  const totalDays = endMom.diff(startMom, "days");

  let crossesMidnight = false;
  if (isStandardShift && startTime && endTime) {
    crossesMidnight = endTime < startTime;
  }

  // ✅ Fetch employees WITH department filter
  const employees = await User.find({
    _id: { $in: employeeIds },
    departmentId: departmentId, // 🔥 must contain this department
  })
    .select("firstName lastName departmentId")
    .lean();

  const validEmployeeIds = employees.map((emp) => emp._id.toString());

  const employeeMap = new Map(
    employees.map((emp: any) => [
      emp._id.toString(),
      { firstName: emp.firstName, lastName: emp.lastName },
    ]),
  );

  // ✅ Fetch existing rotas for conflict detection
  const existingRotas = await Rota.find({
    companyId,
    employeeId: { $in: validEmployeeIds },
    startDate: { $gte: startDate, $lte: endDate },
    departmentId,
  }).lean();

  const leaveConflictSet = new Set(
    existingRotas
      .filter((r) => leaveTypes.includes(r.leaveType))
      .map((r) => `${r.employeeId}_${r.startDate}`),
  );

  const timeConflictSet = new Set(
    existingRotas
      .filter((r) => r.startTime && r.endTime)
      .map((r) => `${r.employeeId}_${r.startDate}_${r.startTime}_${r.endTime}`),
  );

  const rotasToCreate: any[] = [];
  const skippedRecords: any[] = [];

  for (let i = 0; i <= totalDays; i++) {
    const currentDateStr = startMom.clone().add(i, "days").format("YYYY-MM-DD");

    let shiftEndDateStr = currentDateStr;
    if (isStandardShift && crossesMidnight) {
      shiftEndDateStr = moment(currentDateStr)
        .add(1, "days")
        .format("YYYY-MM-DD");
    }

    for (const empId of validEmployeeIds) {
      const empInfo: any = employeeMap.get(empId);

      const leaveKey = `${empId}_${currentDateStr}`;
      const timeKey =
        isStandardShift && startTime && endTime
          ? `${empId}_${currentDateStr}_${startTime}_${endTime}`
          : null;

      // 🔥 1️⃣ Leave conflict
      if (leaveConflictSet.has(leaveKey)) {
        skippedRecords.push({
          employeeId: empId,
          firstName: empInfo?.firstName || "",
          lastName: empInfo?.lastName || "",
          departmentId,
          date: currentDateStr,
          reason: "Leave exists in this department on this date",
        });
        continue;
      }

      // 🔥 2️⃣ Exact time conflict
      if (timeKey && timeConflictSet.has(timeKey)) {
        skippedRecords.push({
          employeeId: empId,
          firstName: empInfo?.firstName || "",
          lastName: empInfo?.lastName || "",
          departmentId,
          date: currentDateStr,
          startTime,
          endTime,
          reason: "Same shift time already exists in this department",
        });
        continue;
      }

      const shiftObj: any = {
        companyId,
        departmentId,
        employeeId: empId,
        startDate: currentDateStr,
        endDate: shiftEndDateStr,
      };

      if (!isStandardShift) {
        shiftObj.leaveType = leaveType;
        shiftObj.shiftName = leaveType;
        shiftObj.startTime = "";
        shiftObj.endTime = "";
      } else {
        shiftObj.shiftName = shiftName;
        shiftObj.startTime = startTime;
        shiftObj.endTime = endTime;
      }

      rotasToCreate.push(shiftObj);
    }
  }

  let result: any[] = [];
  if (rotasToCreate.length > 0) {
    result = await Rota.insertMany(rotasToCreate);
  }

  return {
    meta: {
      requestedEmployeesCount: employeeIds.length,
      validDepartmentEmployeesCount: validEmployeeIds.length,
      totalDaysInRange: totalDays + 1,
      createdShiftsCount: rotasToCreate.length,
      skippedShiftsCount: skippedRecords.length,
      hasSkippedRecords: skippedRecords.length > 0,
      skippedRecords,
    },
    result,
  };
};


export const RotaServices = {
    getAllRotaFromDB,
    getSingleRotaFromDB,
    updateRotaIntoDB,
    createRotaIntoDB,
    deleteRotaFromDB,
    copyRotaIntoDB,
    bulkAssignRotaIntoDB,
    getUpcomingRotaFromDB
  
};



  