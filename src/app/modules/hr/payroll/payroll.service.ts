import httpStatus from "http-status";
import AppError from "../../../errors/AppError";
import moment from "moment";
import { Payroll } from "./payroll.model";
import { TPayroll } from "./payroll.interface";
import { BankHoliday } from "../bank-holiday/bank-holiday.model";
import { EmployeeRate } from "../employeeRate/employeeRate.model";
import { Attendance } from "../../attendance/attendance.model";

// --- Helper Functions ---

const timeToMinutes = (timeStr: string) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const calculatePayrollData = async (userId: string, companyId: string, fromDate: Date, toDate: Date) => {
  const fromDateStr = moment(fromDate).format('YYYY-MM-DD');
  const toDateStr = moment(toDate).format('YYYY-MM-DD');

  // 1. Fetch Attendance
  const attendanceRecords = await Attendance.find({
    userId,
    startDate: { $gte: fromDateStr, $lte: toDateStr },
  });

  if (!attendanceRecords || attendanceRecords.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, 'No attendance records found for this period');
  }

  // 2. Fetch ALL Employee Rates (User may have multiple profiles/contracts)
  const employeeRates = await EmployeeRate.find({ employeeId: userId }).populate('shiftId');

  if (!employeeRates || employeeRates.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, 'Employee rates not configured.');
  }

  let totalAmount = 0;
  let totalHour = 0;
  const attendanceList = [];

  for (const record of attendanceRecords) {
    const recordDate = record.startDate;
    const dayOfWeek = moment(recordDate).format('dddd');

    // --- Shift Matching Logic ---
    // We search across ALL employee rate documents and ALL their shifts 
    // to find the closest start time match.
    let matchedShift = null;
    let matchedRateDoc = null;
    let minDiff = Infinity;
    
    if (record.startTime) {
      const attendanceStartMins = timeToMinutes(record.startTime);

      // Loop through all Rate Profiles
      for (const rateDoc of employeeRates) {
        const shifts = rateDoc.shiftId as unknown as any[];
        if (shifts && shifts.length > 0) {
           // Loop through Shifts in this Profile
           for (const shift of shifts) {
              const shiftStartMins = timeToMinutes(shift.startTime);
              const diff = Math.abs(shiftStartMins - attendanceStartMins);
              
              if (diff < minDiff) {
                 minDiff = diff;
                 matchedShift = shift;
                 matchedRateDoc = rateDoc;
              }
           }
        }
      }
    }

    // Fallback: If no match found (unlikely), use the first available doc
    const currentRateDoc = matchedRateDoc || employeeRates[0];
    const currentShiftId = matchedShift ? matchedShift._id : null;

    // --- Rate Logic ---
    // Use the rate map from the SPECIFIC matched document
    const rateConfig = currentRateDoc.rates.get(dayOfWeek);
    const payRate = rateConfig ? rateConfig.rate : 0;

    // --- Time Logic ---
    let hoursWorked = record.duration || 0;
    if (!hoursWorked && record.startTime && record.endTime) {
       const start = timeToMinutes(record.startTime);
       const end = timeToMinutes(record.endTime);
       
       let diff = end - start;
       // Handle overnight (e.g. 23:00 to 06:00 is negative diff, add 24h)
       if (diff < 0) diff += (24 * 60);
       
       hoursWorked = diff / 60;
    }

    const dailyTotal = (hoursWorked/60) * payRate;

    totalHour += hoursWorked;
    totalAmount += dailyTotal;

    attendanceList.push({
      employementRateId: currentRateDoc._id, // Link to the correct Rate Profile
      shiftId: currentShiftId,
      startDate: record.startDate,
      startTime: record.startTime,
      endDate: record.endDate,
      endTime: record.endTime,
      payRate: payRate,
      note:  '',
      bankHoliday: false, // Default to false as requested
      bankHolidayId: undefined // Default to undefined as requested
    });
  }

  return {
    totalHour: parseFloat(totalHour.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    attendanceList
  };
};

// --- Services ---

const getPayrollFromDB = async (query: Record<string, unknown>) => {
  const { month, year, page = 1, limit = 10, search, ...otherQueryParams } = query;

  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const matchStage: any = { ...otherQueryParams };

  // 📅 Month filter
  if (month && year) {
    const startOfMonth = moment(`${year}-${month}-01`).startOf("month").toDate();
    const endOfMonth = moment(`${year}-${month}-01`).endOf("month").toDate();

    matchStage.$or = [
      { fromDate: { $gte: startOfMonth, $lte: endOfMonth } },
      { toDate: { $gte: startOfMonth, $lte: endOfMonth } },
      { fromDate: { $lte: startOfMonth }, toDate: { $gte: endOfMonth } }
    ];
  }

  const searchRegex = search ? new RegExp(search as string, "i") : null;

  const aggregationPipeline: any[] = [
    { $match: matchStage },

    // 🔗 Join User
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },

    // 🔗 Join Department
    {
      $lookup: {
        from: "departments",
        localField: "user.departmentId",
        foreignField: "_id",
        as: "user.departmentId"
      }
    },
    { $unwind: { path: "$user.departmentId", preserveNullAndEmptyArrays: true } },

    // 🔗 Join Designation
    {
      $lookup: {
        from: "designations",
        localField: "user.designationId",
        foreignField: "_id",
        as: "user.designationId"
      }
    },
    { $unwind: { path: "$user.designationId", preserveNullAndEmptyArrays: true } },
  ];

  // 🔎 Search filter on USER fields
  if (searchRegex) {
    aggregationPipeline.push({
      $match: {
        $or: [
          { "user.firstName": searchRegex },
          { "user.lastName": searchRegex },
          { "user.employeeId": searchRegex },
          { "user.email": searchRegex }
        ]
      }
    });
  }

  // 📊 Get total count BEFORE pagination
  const totalResult = await Payroll.aggregate([...aggregationPipeline, { $count: "total" }]);
  const total = totalResult[0]?.total || 0;

  // 📦 Data query with projection + pagination
  aggregationPipeline.push(
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limitNumber },

    // ✂️ Return ONLY needed user fields
    {
      $project: {
        fromDate: 1,
        toDate: 1,
        status: 1,
        totalHour: 1,
        totalAmount: 1,
        attendanceList: 1,
        createdAt: 1,

        userId: {
          _id: "$user._id",
          firstName: "$user.firstName",
          lastName: "$user.lastName",
          email: "$user.email",
          phone: "$user.phone",
          employeeId: "$user.employeeId",
          designationId: {
            title: "$user.designationId.title"
          },
          departmentId: {
            departmentName: "$user.departmentId.departmentName"
          }
        }
      }
    }
  );

  const result = await Payroll.aggregate(aggregationPipeline);

  return {
    meta: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber)
    },
    result
  };
};

const getSinglePayrollFromDB = async (id: string) => {
  const result = await Payroll.findById(id)
    .populate("userId")
    .populate({
      path: "attendanceList.bankHolidayId", 
      select: "title",                      
    });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Payroll not found");
  }

  return result;
};


const createPayrollIntoDB = async (payload: TPayroll) => {
  try {
    const calculations = await calculatePayrollData(
      payload.userId as unknown as string,
      payload.companyId as unknown as string,
      payload.fromDate as Date,
      payload.toDate as Date
    );

    const result = await Payroll.create({
      ...payload,
      ...calculations,
      status: 'pending' 
    });

    return result;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message || "Failed to create Payroll");
  }
};

const updatePayrollIntoDB = async (id: string, payload: Partial<TPayroll>) => {
  const payroll = await Payroll.findById(id);

  if (!payroll) {
    throw new AppError(httpStatus.NOT_FOUND, "Payroll not found");
  }

  const result = await Payroll.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};

export const PayrollServices = {
  getPayrollFromDB,
  getSinglePayrollFromDB,
  createPayrollIntoDB,
  updatePayrollIntoDB,
};