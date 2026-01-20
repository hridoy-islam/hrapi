import httpStatus from "http-status";
import moment from "moment";
import { User } from "../user/user.model";
import { ScheduleCheck } from "../scheduleCheck/scheduleCheck.model";
import { Passport } from "../passport/passport.model";
import { VisaCheck } from "../hr/visaCheck/visaCheck.model";
import { DbsForm } from "../dbs/dbsForm.model";
import { ImmigrationStatus } from "../hr/immigrationStatus/immigrationStatus.model";
import { Appraisal } from "../hr/appraisal/appraisal.model";
import { RightToWork } from "../hr/rightToWork/rightToWork.model";

// --- Helper: Calculate Threshold Date ---
const getSettingsAndThreshold = async (
  companyId: string,
  type: 'passport' | 'visa' | 'dbs' | 'immigration' | 'appraisal' | 'rtw'
) => {
  const settings = await ScheduleCheck.findOne({ companyId });

  const defaults = {
    passport: 30,
    visa: 30,
    dbs: 30,
    immigration: 30,
    appraisal: 30,
    rtw: 30
  };

  const checkDays = settings ? (settings[`${type}CheckDate`] || defaults[type]) : defaults[type];
  // Returns date: Today + X days. Anything expiring before this is "Non-Compliant".
  return moment().add(checkDays, 'days').toDate();
};

// --- 1. Passport Compliance Service ---
const getPassportComplianceList = async (companyId: string) => {
  const thresholdDate = await getSettingsAndThreshold(companyId, 'passport');

  // A. Find IDs of employees who are COMPLIANT (Expiry > Threshold)
  const compliantIds = await Passport.distinct('userId', {
    passportExpiryDate: { $gt: thresholdDate }
  });

  // B. Find Users who are NOT compliant (includes Missing AND Expiring)
  const nonCompliantUsers = await User.find({
    company: companyId,
    role: 'employee',
    _id: { $nin: compliantIds }
  })
  .select('firstName lastName email designationId departmentId avatar')
  .populate('departmentId designationId'); // Populate to get names for frontend

  // C. Fetch the expiring documents for these users (if they exist)
  const expiringDocs = await Passport.find({
    userId: { $in: nonCompliantUsers.map(u => u._id) }
  });

  // D. Merge User data with Document data (or null if missing)
  return nonCompliantUsers.map(user => {
    const doc = expiringDocs.find(d => d.userId.toString() === user._id.toString());
    if (doc) {
      // Return document with populated user
      return { ...doc.toObject(), userId: user };
    }
    // Return "Missing" record structure
    return { 
      userId: user, 
      passportExpiryDate: null, 
      status: 'missing' 
    };
  });
};

// --- 2. Visa Compliance Service ---
const getVisaComplianceList = async (companyId: string) => {
  const thresholdDate = await getSettingsAndThreshold(companyId, 'visa');

  const compliantIds = await VisaCheck.distinct('employeeId', {
    expiryDate: { $gt: thresholdDate }
  });

  const nonCompliantUsers = await User.find({
    company: companyId,
    role: 'employee',
    _id: { $nin: compliantIds }
  })
  .select('firstName lastName email designationId departmentId avatar')
  .populate('departmentId designationId');

  const expiringDocs = await VisaCheck.find({
    employeeId: { $in: nonCompliantUsers.map(u => u._id) }
  });

  return nonCompliantUsers.map(user => {
    const doc = expiringDocs.find(d => d.employeeId.toString() === user._id.toString());
    if (doc) {
      return { ...doc.toObject(), employeeId: user };
    }
    return { 
      employeeId: user, 
      expiryDate: null, 
      status: 'missing' 
    };
  });
};

// --- 3. DBS Compliance Service ---
const getDbsComplianceList = async (companyId: string) => {
  const thresholdDate = await getSettingsAndThreshold(companyId, 'dbs');

  const compliantIds = await DbsForm.distinct('userId', {
    expiryDate: { $gt: thresholdDate }
  });

  const nonCompliantUsers = await User.find({
    company: companyId,
    role: 'employee',
    _id: { $nin: compliantIds }
  })
  .select('firstName lastName email designationId departmentId avatar')
  .populate('departmentId designationId');

  const expiringDocs = await DbsForm.find({
    userId: { $in: nonCompliantUsers.map(u => u._id) }
  });

  return nonCompliantUsers.map(user => {
    const doc = expiringDocs.find(d => d.userId.toString() === user._id.toString());
    if (doc) {
      return { ...doc.toObject(), userId: user };
    }
    return { 
      userId: user, 
      expiryDate: null, 
      status: 'missing' 
    };
  });
};

// --- 4. Immigration Compliance Service ---
const getImmigrationComplianceList = async (companyId: string) => {
  const thresholdDate = await getSettingsAndThreshold(companyId, 'immigration');

  const compliantIds = await ImmigrationStatus.distinct('employeeId', {
    nextCheckDate: { $gt: thresholdDate }
  });

  const nonCompliantUsers = await User.find({
    company: companyId,
    role: 'employee',
    _id: { $nin: compliantIds }
  })
  .select('firstName lastName email designationId departmentId avatar')
  .populate('departmentId designationId');

  const expiringDocs = await ImmigrationStatus.find({
    employeeId: { $in: nonCompliantUsers.map(u => u._id) }
  });

  return nonCompliantUsers.map(user => {
    const doc = expiringDocs.find(d => d.employeeId.toString() === user._id.toString());
    if (doc) {
      return { ...doc.toObject(), employeeId: user };
    }
    return { 
      employeeId: user, 
      nextCheckDate: null, 
      status: 'missing' 
    };
  });
};

// --- 5. Appraisal Compliance Service ---
const getAppraisalComplianceList = async (companyId: string) => {
  const thresholdDate = await getSettingsAndThreshold(companyId, 'appraisal');

  const compliantIds = await Appraisal.distinct('employeeId', {
    nextCheckDate: { $gt: thresholdDate }
  });

  const nonCompliantUsers = await User.find({
    company: companyId,
    role: 'employee',
    _id: { $nin: compliantIds }
  })
  .select('firstName lastName email designationId departmentId avatar')
  .populate('departmentId designationId');

  const expiringDocs = await Appraisal.find({
    employeeId: { $in: nonCompliantUsers.map(u => u._id) }
  });

  return nonCompliantUsers.map(user => {
    const doc = expiringDocs.find(d => d.employeeId.toString() === user._id.toString());
    if (doc) {
      return { ...doc.toObject(), employeeId: user };
    }
    return { 
      employeeId: user, 
      nextCheckDate: null, 
      status: 'missing' 
    };
  });
};

// --- 6. Right To Work (RTW) Compliance Service ---
const getRtwComplianceList = async (companyId: string) => {
  const thresholdDate = await getSettingsAndThreshold(companyId, 'rtw');

  const compliantIds = await RightToWork.distinct('employeeId', {
    nextCheckDate: { $gt: thresholdDate }
  });

  const nonCompliantUsers = await User.find({
    company: companyId,
    role: 'employee',
    _id: { $nin: compliantIds }
  })
  .select('firstName lastName email designationId departmentId avatar')
  .populate('departmentId designationId');

  const expiringDocs = await RightToWork.find({
    employeeId: { $in: nonCompliantUsers.map(u => u._id) }
  });

  return nonCompliantUsers.map(user => {
    const doc = expiringDocs.find(d => d.employeeId.toString() === user._id.toString());
    if (doc) {
      return { ...doc.toObject(), employeeId: user };
    }
    return { 
      employeeId: user, 
      nextCheckDate: null, 
      status: 'missing' 
    };
  });
};

// --- Main Stats Service ---
const getCompanyComplianceStats = async (companyId: string) => {
  const employees = await User.find({ company: companyId, role: 'employee' }).select('_id');
  const employeeIds = employees.map((user) => user._id);
  const totalEmployees = employeeIds.length;

  if (totalEmployees === 0) {
    return { passport: 0, rtw: 0, visa: 0, dbs: 0, immigration: 0, appraisal: 0 };
  }

  const settings = await ScheduleCheck.findOne({ companyId });
  const defaults = { passport: 30, visa: 30, dbs: 30, immigration: 30, appraisal: 30, rtw: 30 };
  
  const intervals = {
    passport: settings?.passportCheckDate || defaults.passport,
    visa: settings?.visaCheckDate || defaults.visa,
    dbs: settings?.dbsCheckDate || defaults.dbs,
    immigration: settings?.immigrationCheckDate || defaults.immigration,
    appraisal: settings?.appraisalCheckDate || defaults.appraisal,
    rtw: settings?.rtwCheckDate || defaults.rtw,
  };
  
  const getSafeThreshold = (days: number) => moment().add(days, 'days').toDate();

  const [
    compliantPassportIds,
    compliantVisaIds,
    compliantDbsIds,
    compliantImmigrationIds,
    compliantAppraisalIds,
    compliantRTWIds
  ] = await Promise.all([
    Passport.distinct('userId', { userId: { $in: employeeIds }, passportExpiryDate: { $gt: getSafeThreshold(intervals.passport) } }),
    VisaCheck.distinct('employeeId', { employeeId: { $in: employeeIds }, expiryDate: { $gt: getSafeThreshold(intervals.visa) } }),
    DbsForm.distinct('userId', { userId: { $in: employeeIds }, expiryDate: { $gt: getSafeThreshold(intervals.dbs) } }),
    ImmigrationStatus.distinct('employeeId', { employeeId: { $in: employeeIds }, nextCheckDate: { $gt: getSafeThreshold(intervals.immigration) } }),
    Appraisal.distinct('employeeId', { employeeId: { $in: employeeIds }, nextCheckDate: { $gt: getSafeThreshold(intervals.appraisal) } }),
    RightToWork.distinct('employeeId', { employeeId: { $in: employeeIds }, nextCheckDate: { $gt: getSafeThreshold(intervals.rtw) } })
  ]);

  return {
    passport: totalEmployees - compliantPassportIds.length,
    visa: totalEmployees - compliantVisaIds.length,
    dbs: totalEmployees - compliantDbsIds.length,
    immigration: totalEmployees - compliantImmigrationIds.length,
    appraisal: totalEmployees - compliantAppraisalIds.length,
    rtw: totalEmployees - compliantRTWIds.length,
  };
};

export const ScheduleCheckStatuServices = {
  getCompanyComplianceStats,
  getPassportComplianceList,
  getVisaComplianceList,
  getDbsComplianceList,
  getImmigrationComplianceList,
  getAppraisalComplianceList,
  getRtwComplianceList
};