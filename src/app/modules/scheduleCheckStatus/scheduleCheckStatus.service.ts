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
import { SpotCheck } from "../spotCheck/spotCheck.model";
import { Supervision } from "../supervision/supervision.model";
import { Training } from "../hr/training/training.model";
import { EmployeeTraining } from "../hr/employeeTraining/employeeTraining.model";
import { Induction } from "../induction/induction.model";
import { Disciplinary } from "../disciplinary/disciplinary.model";
import { QACheck } from "../qaCheck/QACheck.model";
import { EmployeeDocument } from "../hr/employeeDocument/employeeDocument.model";
import { MIN_REFERENCE_COUNT, REQUIRED_DOCUMENTS_LIST } from "../hr/employeeDocument/employeeDocument.constant";

const getSettingsAndThreshold = async (
  companyId: string,
  type:
    | "passport"
    | "visa"
    | "dbs"
    | "immigration"
    | "appraisal"
    | "rtw"
    | "spot"
    | "supervision"
    | "disciplinary"
    | "qa",
) => {
  const settings = await ScheduleCheck.findOne({ companyId });

  const defaults = {
    passport: 30,
    visa: 30,
    dbs: 30,
    immigration: 30,
    appraisal: 30,
    rtw: 30,
    spot: 30,
    supervision: 30,
    disciplinary: 30,
    qa: 30, // ← added
  };

  // Map type to field name in ScheduleCheck
  const fieldMap: Record<string, keyof any> = {
    passport: "passportCheckDate",
    visa: "visaCheckDate",
    dbs: "dbsCheckDate",
    immigration: "immigrationCheckDate",
    appraisal: "appraisalCheckDate",
    rtw: "rtwCheckDate",
    spot: "spotCheckDate",
    supervision: "supervisionCheckDate",
    disciplinary: "disciplinaryCheckDate",
    qa: "qaCheckDate",
  };

  const fieldName = fieldMap[type];
  const checkDays = settings
    ? settings[fieldName as keyof typeof settings] || defaults[type]
    : defaults[type];

  return moment().add(checkDays, "days").toDate();
};

// --- 1. Passport Compliance Service ---
const getPassportComplianceList = async (companyId: string) => {
  const thresholdDate = await getSettingsAndThreshold(companyId, "passport");

  // A. Find IDs of employees who are COMPLIANT (Expiry > Threshold)
  const compliantIds = await Passport.distinct("userId", {
    passportExpiryDate: { $gt: thresholdDate },
  });

  // B. Find Users who are NOT compliant (includes Missing AND Expiring)
  const nonCompliantUsers = await User.find({
    company: companyId,
    role: "employee",
    _id: { $nin: compliantIds },
  })
    .select("firstName lastName email designationId departmentId avatar")
    .populate("departmentId designationId"); // Populate to get names for frontend

  // C. Fetch the expiring documents for these users (if they exist)
  const expiringDocs = await Passport.find({
    userId: { $in: nonCompliantUsers.map((u) => u._id) },
  });

  // D. Merge User data with Document data (or null if missing)
  return nonCompliantUsers.map((user) => {
    const doc = expiringDocs.find(
      (d) => d.userId.toString() === user._id.toString(),
    );
    if (doc) {
      // Return document with populated user
      return { ...doc.toObject(), userId: user };
    }
    // Return "Missing" record structure
    return {
      userId: user,
      passportExpiryDate: null,
      status: "missing",
    };
  });
};

// --- 2. Visa Compliance Service ---
const getVisaComplianceList = async (companyId: string) => {
  const thresholdDate = await getSettingsAndThreshold(companyId, "visa");

  const compliantIds = await VisaCheck.distinct("employeeId", {
    expiryDate: { $gt: thresholdDate },
  });

  const nonCompliantUsers = await User.find({
    company: companyId,
    role: "employee",
    _id: { $nin: compliantIds },
  })
    .select("firstName lastName email designationId departmentId avatar")
    .populate("departmentId designationId");

  const expiringDocs = await VisaCheck.find({
    employeeId: { $in: nonCompliantUsers.map((u) => u._id) },
  });

  return nonCompliantUsers.map((user) => {
    const doc = expiringDocs.find(
      (d) => d.employeeId.toString() === user._id.toString(),
    );
    if (doc) {
      return { ...doc.toObject(), employeeId: user };
    }
    return {
      employeeId: user,
      expiryDate: null,
      status: "missing",
    };
  });
};

// --- 3. DBS Compliance Service ---
const getDbsComplianceList = async (companyId: string) => {
  const thresholdDate = await getSettingsAndThreshold(companyId, "dbs");

  const compliantIds = await DbsForm.distinct("userId", {
    expiryDate: { $gt: thresholdDate },
  });

  const nonCompliantUsers = await User.find({
    company: companyId,
    role: "employee",
    _id: { $nin: compliantIds },
  })
    .select("firstName lastName email designationId departmentId avatar")
    .populate("departmentId designationId");

  const expiringDocs = await DbsForm.find({
    userId: { $in: nonCompliantUsers.map((u) => u._id) },
  });

  return nonCompliantUsers.map((user) => {
    const doc = expiringDocs.find(
      (d) => d.userId.toString() === user._id.toString(),
    );
    if (doc) {
      return { ...doc.toObject(), userId: user };
    }
    return {
      userId: user,
      expiryDate: null,
      status: "missing",
    };
  });
};

// --- 4. Immigration Compliance Service ---
const getImmigrationComplianceList = async (companyId: string) => {
  const thresholdDate = await getSettingsAndThreshold(companyId, "immigration");

  const compliantIds = await ImmigrationStatus.distinct("employeeId", {
    nextCheckDate: { $gt: thresholdDate },
  });

  const nonCompliantUsers = await User.find({
    company: companyId,
    role: "employee",
    _id: { $nin: compliantIds },
  })
    .select("firstName lastName email designationId departmentId avatar")
    .populate("departmentId designationId");

  const expiringDocs = await ImmigrationStatus.find({
    employeeId: { $in: nonCompliantUsers.map((u) => u._id) },
  });

  return nonCompliantUsers.map((user) => {
    const doc = expiringDocs.find(
      (d) => d.employeeId.toString() === user._id.toString(),
    );
    if (doc) {
      return { ...doc.toObject(), employeeId: user };
    }
    return {
      employeeId: user,
      nextCheckDate: null,
      status: "missing",
    };
  });
};

// --- 5. Appraisal Compliance Service ---
const getAppraisalComplianceList = async (companyId: string) => {
  const thresholdDate = await getSettingsAndThreshold(companyId, "appraisal");

  const compliantIds = await Appraisal.distinct("employeeId", {
    nextCheckDate: { $gt: thresholdDate },
  });

  const nonCompliantUsers = await User.find({
    company: companyId,
    role: "employee",
    _id: { $nin: compliantIds },
  })
    .select("firstName lastName email designationId departmentId avatar")
    .populate("departmentId designationId");

  const expiringDocs = await Appraisal.find({
    employeeId: { $in: nonCompliantUsers.map((u) => u._id) },
  });

  return nonCompliantUsers.map((user) => {
    const doc = expiringDocs.find(
      (d) => d.employeeId.toString() === user._id.toString(),
    );
    if (doc) {
      return { ...doc.toObject(), employeeId: user };
    }
    return {
      employeeId: user,
      nextCheckDate: null,
      status: "missing",
    };
  });
};

// --- 6. Right To Work (RTW) Compliance Service ---
const getRtwComplianceList = async (companyId: string) => {
  const thresholdDate = await getSettingsAndThreshold(companyId, "rtw");

  const compliantIds = await RightToWork.distinct("employeeId", {
    nextCheckDate: { $gt: thresholdDate },
  });

  const nonCompliantUsers = await User.find({
    company: companyId,
    role: "employee",
    _id: { $nin: compliantIds },
  })
    .select("firstName lastName email designationId departmentId avatar")
    .populate("departmentId designationId");

  const expiringDocs = await RightToWork.find({
    employeeId: { $in: nonCompliantUsers.map((u) => u._id) },
  });

  return nonCompliantUsers.map((user) => {
    const doc = expiringDocs.find(
      (d) => d.employeeId.toString() === user._id.toString(),
    );
    if (doc) {
      return { ...doc.toObject(), employeeId: user };
    }
    return {
      employeeId: user,
      nextCheckDate: null,
      status: "missing",
    };
  });
};

const getSpotCheckComplianceList = async (companyId: string) => {
  const thresholdDate = await getSettingsAndThreshold(companyId, "spot");

  // A. Find IDs of employees who are SAFE (Have a schedule > Threshold)
  const compliantIds = await SpotCheck.distinct("employeeId", {
    scheduledDate: { $gt: thresholdDate },
  });

  // B. Find Users who are NOT compliant (includes Missing AND Due Soon/Overdue)
  const nonCompliantUsers = await User.find({
    company: companyId,
    role: "employee",
    _id: { $nin: compliantIds },
  })
    .select("firstName lastName email designationId departmentId avatar")
    .populate("departmentId designationId");

  // C. Fetch documents for these users (to distinguish between Missing vs Due Soon)
  const expiringDocs = await SpotCheck.find({
    employeeId: { $in: nonCompliantUsers.map((u) => u._id) },
  });

  return nonCompliantUsers.map((user) => {
    const doc = expiringDocs.find(
      (d) => d.employeeId.toString() === user._id.toString(),
    );
    if (doc) {
      return { ...doc.toObject(), employeeId: user, status: "due-soon" };
    }
    return {
      employeeId: user,
      scheduledDate: null,
      status: "missing",
    };
  });
};

const getSupervisionComplianceList = async (companyId: string) => {
  const thresholdDate = await getSettingsAndThreshold(companyId, "supervision");

  // A. Find IDs of employees who are SAFE (Have a schedule > Threshold)
  const compliantIds = await Supervision.distinct("employeeId", {
    scheduledDate: { $gt: thresholdDate },
  });

  const nonCompliantUsers = await User.find({
    company: companyId,
    role: "employee",
    _id: { $nin: compliantIds },
  })
    .select("firstName lastName email designationId departmentId avatar")
    .populate("departmentId designationId");

  const expiringDocs = await Supervision.find({
    employeeId: { $in: nonCompliantUsers.map((u) => u._id) },
  });

  return nonCompliantUsers.map((user) => {
    const doc = expiringDocs.find(
      (d) => d.employeeId.toString() === user._id.toString(),
    );
    if (doc) {
      return { ...doc.toObject(), employeeId: user, status: "due-soon" };
    }
    return {
      employeeId: user,
      scheduledDate: null,
      status: "missing",
    };
  });
};

const getTrainingComplianceList = async (companyId: string) => {
  // 1. Fetch all trainings for this company to get individual reminder settings
  const companyTrainings = await Training.find({ companyId }).select(
    "_id name reminderBeforeDays",
  );

  if (companyTrainings.length === 0) return [];

  // 2. Build the OR condition for "Bad" trainings
  const trainingNonComplianceConditions = companyTrainings.map((t) => ({
    trainingId: t._id,
    expireDate: {
      $lte: moment()
        .add(t.reminderBeforeDays || 30, "days")
        .toDate(),
    },
  }));

  // 3. Find EmployeeTraining records matching any of these "Bad" conditions
  const expiringDocs = await EmployeeTraining.find({
    $or: trainingNonComplianceConditions,
  })
    .populate({
      path: "employeeId",
      match: { company: companyId, role: "employee" },
      select: "firstName lastName email designationId departmentId avatar",
      populate: { path: "departmentId designationId" },
    })
    .populate("trainingId", "name"); // Also populate training details

  const validDocs = expiringDocs.filter((doc) => doc.employeeId);

  return validDocs.map((doc) => {
    const user = doc.employeeId;
    return {
      ...doc.toObject(),
      employeeId: user,
      status: "expiring",
    };
  });
};

const getInductionComplianceList = async (companyId: string) => {
  // A. Find Employees who have an induction date set
  const compliantIds = await Induction.distinct("employeeId", {
    inductionDate: { $exists: true },
  });

  // B. Find Users who are Missing induction (NOT in compliant list)
  const missingInductionUsers = await User.find({
    company: companyId,
    role: "employee",
    _id: { $nin: compliantIds },
  })
    .select("firstName lastName email designationId departmentId avatar")
    .populate("departmentId designationId");

  // Return standard format (missing status)
  return missingInductionUsers.map((user) => ({
    employeeId: user,
    inductionDate: null,
    status: "missing",
  }));
};

const getDisciplinaryComplianceList = async (companyId: string) => {
  const thresholdDate = await getSettingsAndThreshold(
    companyId,
    "disciplinary",
  );

  const activeIssues = await Disciplinary.find({
    issueDeadline: { $exists: true, $lte: thresholdDate },
  }).populate({
    path: "employeeId",
    match: { company: companyId, role: "employee" },
    select: "firstName lastName email designationId departmentId avatar",
    populate: { path: "departmentId designationId" },
  });

  // Filter out any where user didn't match company
  const validDocs = activeIssues.filter((doc) => doc.employeeId);

  return validDocs.map((doc) => {
    // Determine specific status for frontend details if needed
    const isOverdue = moment(doc.issueDeadline).isBefore(new Date());
    return {
      ...doc.toObject(),
      status: isOverdue ? "overdue" : "due-soon",
    };
  });
};

const getQaComplianceList = async (companyId: string) => {
  const thresholdDate = await getSettingsAndThreshold(companyId, "qa");

  const compliantIds = await QACheck.distinct("employeeId", {
    scheduledDate: { $gt: thresholdDate },
  });

  const nonCompliantUsers = await User.find({
    company: companyId,
    role: "employee",
    _id: { $nin: compliantIds },
  })
    .select("firstName lastName email designationId departmentId avatar")
    .populate("departmentId designationId");

  // C. Fetch existing QA records for these users
  const qaDocs = await QACheck.find({
    employeeId: { $in: nonCompliantUsers.map((u) => u._id) },
  });

  return nonCompliantUsers.map((user) => {
    const doc = qaDocs.find(
      (d) => d.employeeId.toString() === user._id.toString(),
    );
    if (doc) {
      return { ...doc.toObject(), employeeId: user, status: "due-soon" };
    }
    return {
      employeeId: user,
      scheduledDate: null,
      status: "missing",
    };
  });
};




const getEmployeeDocumentComplianceList = async (companyId: string) => {
  // 1. Fetch all employees in the company
  const employees = await User.find({
    company: companyId,
    role: "employee",
  })
    .select("firstName lastName email designationId departmentId avatar")
    .populate("departmentId designationId");

  if (employees.length === 0) return [];

  const employeeIds = employees.map((e) => e._id);

  // 2. Fetch ALL documents for these employees in one go (Performance optimization)
  const allDocs = await EmployeeDocument.find({
    employeeId: { $in: employeeIds },
  }).select("employeeId documentTitle");

  // 3. Iterate through employees and check their documents against the list
  const nonCompliantList = employees
    .map((user) => {
      // Filter docs for this specific user
      const userDocs = allDocs.filter(
        (d) => d.employeeId.toString() === user._id.toString(),
      );

      // Normalize titles for comparison
      const uploadedTitles = userDocs.map((d) =>
        d.documentTitle.trim().toLowerCase(),
      );

      // Check for missing mandatory documents
      const missing = REQUIRED_DOCUMENTS_LIST.filter(
        (req) => !uploadedTitles.includes(req.toLowerCase()),
      );

      // Check Reference Logic (Min 2)
      // Exclude "DBS Reference" to avoid confusion if it exists separately
      const refCount = uploadedTitles.filter(
        (t) => t.includes("reference") && !t.includes("dbs"),
      ).length;

      if (refCount < MIN_REFERENCE_COUNT) {
        missing.push(
          `Reference (Uploaded: ${refCount}, Required: ${MIN_REFERENCE_COUNT})`,
        );
      }

      if (missing.length > 0) {
        return {
          employeeId: user,
          missingDocuments: missing,
          status: "missing",
        };
      }
      return null; 
    })
    .filter((item) => item !== null); 

  return nonCompliantList;
};

const getCompanyComplianceStats = async (companyId: string) => {
  const employees = await User.find({
    company: companyId,
    role: "employee",
  }).select("_id");
  const employeeIds = employees.map((user) => user._id);
  const totalEmployees = employeeIds.length;

  if (totalEmployees === 0) {
    return {
      passport: 0,
      rtw: 0,
      visa: 0,
      dbs: 0,
      immigration: 0,
      appraisal: 0,
      spot: 0,
      supervision: 0,
      training: 0,
      induction: 0,
      disciplinary: 0,
      employeeDocument: 0, // NEW
    };
  }

  const settings = await ScheduleCheck.findOne({ companyId });
  const defaults = {
    passport: 30,
    visa: 30,
    dbs: 30,
    immigration: 30,
    appraisal: 30,
    rtw: 30,
    spot: 30,
    supervision: 30,
    disciplinary: 30,
    qa: 30,
  };

  const intervals = {
    passport: settings?.passportCheckDate || defaults.passport,
    visa: settings?.visaCheckDate || defaults.visa,
    dbs: settings?.dbsCheckDate || defaults.dbs,
    immigration: settings?.immigrationCheckDate || defaults.immigration,
    appraisal: settings?.appraisalCheckDate || defaults.appraisal,
    rtw: settings?.rtwCheckDate || defaults.rtw,
    spot: settings?.spotCheckDate || defaults.spot,
    supervision: settings?.supervisionCheckDate || defaults.supervision,
    disciplinary: settings?.disciplinaryCheckDate || defaults.disciplinary,
    qa: settings?.qaCheckDate || defaults.qa,
  };

  const getSafeThreshold = (days: number) =>
    moment().add(days, "days").toDate();

  // Training Conditions
  const companyTrainings = await Training.find({ companyId }).select(
    "_id reminderBeforeDays",
  );
  const trainingNonComplianceConditions = companyTrainings.map((t) => ({
    trainingId: t._id,
    expireDate: {
      $lte: moment()
        .add(t.reminderBeforeDays || 30, "days")
        .toDate(),
    },
  }));

  const [
    compliantPassportIds,
    compliantVisaIds,
    compliantDbsIds,
    compliantImmigrationIds,
    compliantAppraisalIds,
    compliantRTWIds,
    compliantSpotCheckIds,
    compliantSupervisionIds,
    compliantQaIds,
    compliantInductionIds,
    activeDisciplinaryIssues,
    nonCompliantTrainingIds,
    allEmployeeDocs, 
  ] = await Promise.all([
    // Standard Checks
    Passport.distinct("userId", {
      userId: { $in: employeeIds },
      passportExpiryDate: { $gt: getSafeThreshold(intervals.passport) },
    }),
    VisaCheck.distinct("employeeId", {
      employeeId: { $in: employeeIds },
      expiryDate: { $gt: getSafeThreshold(intervals.visa) },
    }),
    DbsForm.distinct("userId", {
      userId: { $in: employeeIds },
      expiryDate: { $gt: getSafeThreshold(intervals.dbs) },
    }),
    ImmigrationStatus.distinct("employeeId", {
      employeeId: { $in: employeeIds },
      nextCheckDate: { $gt: getSafeThreshold(intervals.immigration) },
    }),
    Appraisal.distinct("employeeId", {
      employeeId: { $in: employeeIds },
      nextCheckDate: { $gt: getSafeThreshold(intervals.appraisal) },
    }),
    RightToWork.distinct("employeeId", {
      employeeId: { $in: employeeIds },
      nextCheckDate: { $gt: getSafeThreshold(intervals.rtw) },
    }),
    // Spot & Supervision
    SpotCheck.distinct("employeeId", {
      employeeId: { $in: employeeIds },
      scheduledDate: { $gt: getSafeThreshold(intervals.spot) },
    }),
    Supervision.distinct("employeeId", {
      employeeId: { $in: employeeIds },
      scheduledDate: { $gt: getSafeThreshold(intervals.supervision) },
    }),
    QACheck.distinct("employeeId", {
      employeeId: { $in: employeeIds },
      scheduledDate: { $gt: getSafeThreshold(intervals.qa) },
    }),
    // Induction
    Induction.distinct("employeeId", {
      employeeId: { $in: employeeIds },
      inductionDate: { $exists: true },
    }),
    // Disciplinary
    Disciplinary.find({
      employeeId: { $in: employeeIds },
      issueDeadline: {
        $exists: true,
        $lte: getSafeThreshold(intervals.disciplinary),
      },
    }).countDocuments(),
    // Training
    trainingNonComplianceConditions.length > 0
      ? EmployeeTraining.distinct("employeeId", {
          employeeId: { $in: employeeIds },
          $or: trainingNonComplianceConditions,
        })
      : Promise.resolve([]),

    // NEW: Fetch All Documents for calc
    EmployeeDocument.find({
      employeeId: { $in: employeeIds },
    }).select("employeeId documentTitle"),
  ]);

  let employeeDocumentNonCompliantCount = 0;

  employeeIds.forEach((empId) => {
    const userDocs = allEmployeeDocs.filter(
      (d) => d.employeeId.toString() === empId.toString(),
    );
    const uploadedTitles = userDocs.map((d) =>
      d.documentTitle.trim().toLowerCase(),
    );

    const isMissingRequired = REQUIRED_DOCUMENTS_LIST.some(
      (req) => !uploadedTitles.includes(req.toLowerCase()),
    );

    const refCount = uploadedTitles.filter(
      (t) => t.includes("reference") && !t.includes("dbs"),
    ).length;

    if (isMissingRequired || refCount < MIN_REFERENCE_COUNT) {
      employeeDocumentNonCompliantCount++;
    }
  });

  return {
    passport: totalEmployees - compliantPassportIds.length,
    visa: totalEmployees - compliantVisaIds.length,
    dbs: totalEmployees - compliantDbsIds.length,
    immigration: totalEmployees - compliantImmigrationIds.length,
    appraisal: totalEmployees - compliantAppraisalIds.length,
    rtw: totalEmployees - compliantRTWIds.length,
    spot: totalEmployees - compliantSpotCheckIds.length,
    supervision: totalEmployees - compliantSupervisionIds.length,
    induction: totalEmployees - compliantInductionIds.length,
    qa: totalEmployees - compliantQaIds.length,
    disciplinary: activeDisciplinaryIssues,
    training: nonCompliantTrainingIds.length,
    employeeDocument: employeeDocumentNonCompliantCount, 
  };
};

export const ScheduleCheckStatuServices = {
  getCompanyComplianceStats,
  getPassportComplianceList,
  getVisaComplianceList,
  getDbsComplianceList,
  getImmigrationComplianceList,
  getAppraisalComplianceList,
  getRtwComplianceList,
  getSpotCheckComplianceList,
  getSupervisionComplianceList,
  getTrainingComplianceList,
  getInductionComplianceList,
  getDisciplinaryComplianceList,
  getQaComplianceList,
  getEmployeeDocumentComplianceList,
};
