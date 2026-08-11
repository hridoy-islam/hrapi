







// import httpStatus from "http-status";
// import moment from '../../utils/moment-setup';
// import { User } from "../user/user.model";
// import { ScheduleCheck } from "../scheduleCheck/scheduleCheck.model";
// import { Passport } from "../passport/passport.model";
// import { VisaCheck } from "../hr/visaCheck/visaCheck.model";
// import { DbsForm } from "../dbs/dbsForm.model";
// import { ImmigrationStatus } from "../hr/immigrationStatus/immigrationStatus.model";
// import { Appraisal } from "../hr/appraisal/appraisal.model";
// import { RightToWork } from "../hr/rightToWork/rightToWork.model";
// import { SpotCheck } from "../spotCheck/spotCheck.model";
// import { Supervision } from "../supervision/supervision.model";
// import { Training } from "../hr/training/training.model";
// import { EmployeeTraining } from "../hr/employeeTraining/employeeTraining.model";
// import { Induction } from "../induction/induction.model";
// import { Disciplinary } from "../disciplinary/disciplinary.model";
// import { QACheck } from "../qaCheck/QACheck.model";
// import { EmployeeDocument } from "../hr/employeeDocument/employeeDocument.model";
// import { MIN_REFERENCE_COUNT, REQUIRED_DOCUMENTS_LIST } from "../hr/employeeDocument/employeeDocument.constant";
// import { MeetingMins } from "../meetingMins/meetingMins.model";
// import { CompanyPolicy } from "../companyPolicy/companyPolicy.model";
// import { HealthAndSafety } from "../healthAndSafety/healthAndSafety.model";
// import { Leaver } from "../hr/leaver/leaver.model";

// // --- Helper: Get leaver userIds for a company ---
// const getLeaverIds = async (companyId: string) => {
//   return Leaver.distinct("userId", { companyId });
// };

// const getSettingsAndThreshold = async (
//   companyId: string,
//   type:
//     | "passport"
//     | "visa"
//     | "dbs"
//     | "immigration"
//     | "appraisal"
//     | "rtw"
//     | "spot"
//     | "supervision"
//     | "disciplinary"
//     | "qa",
// ) => {
//   const settings = await ScheduleCheck.findOne({ companyId });

//   const defaults = {
//     passport: 30,
//     visa: 30,
//     dbs: 30,
//     immigration: 30,
//     appraisal: 30,
//     rtw: 30,
//     spot: 30,
//     supervision: 30,
//     disciplinary: 30,
//     qa: 30,
//   };

//   const fieldMap: Record<string, keyof any> = {
//     passport: "passportCheckDate",
//     visa: "visaCheckDate",
//     dbs: "dbsCheckDate",
//     immigration: "immigrationCheckDate",
//     appraisal: "appraisalCheckDate",
//     rtw: "rtwCheckDate",
//     spot: "spotCheckDate",
//     supervision: "supervisionCheckDate",
//     disciplinary: "disciplinaryCheckDate",
//     qa: "qaCheckDate",
//   };

//   const fieldName = fieldMap[type];
//   const checkDays = settings
//     ? settings[fieldName as keyof typeof settings] || defaults[type]
//     : defaults[type];

//   return moment().add(checkDays, "days").toDate();
// };

// // --- 1. Passport Compliance Service ---
// const getPassportComplianceList = async (companyId: string) => {
//   const thresholdDate = await getSettingsAndThreshold(companyId, "passport");
//   const leaverIds = await getLeaverIds(companyId); // <--- Added

//   const compliantIds = await Passport.distinct("userId", {
//     passportExpiryDate: { $gt: thresholdDate },
//   });

//   const nonCompliantUsers = await User.find({
//     company: companyId,
//     role: "employee",
//     noRtwCheck: { $ne: true },
//     _id: { $nin: [...compliantIds, ...leaverIds] }, // <--- Added leaverIds
//   })
//     .select("firstName lastName email designationId departmentId avatar")
//     .populate("departmentId designationId");

//   const expiringDocs = await Passport.find({
//     userId: { $in: nonCompliantUsers.map((u) => u._id) },
//   });

//   return nonCompliantUsers.map((user) => {
//     const doc = expiringDocs.find(
//       (d) => d.userId.toString() === user._id.toString(),
//     );
//     if (doc) {
//       return { ...doc.toObject(), userId: user };
//     }
//     return {
//       userId: user,
//       passportExpiryDate: null,
//       status: "missing",
//     };
//   });
// };

// // --- 2. Visa Compliance Service ---
// const getVisaComplianceList = async (companyId: string) => {
//   const thresholdDate = await getSettingsAndThreshold(companyId, "visa");
//   const leaverIds = await getLeaverIds(companyId); // <--- Added

//   const compliantIds = await VisaCheck.distinct("employeeId", {
//     expiryDate: { $gt: thresholdDate },
//   });

//   const nonCompliantUsers = await User.find({
//     company: companyId,
//     role: "employee",
//     noRtwCheck: { $ne: true },
//     _id: { $nin: [...compliantIds, ...leaverIds] }, // <--- Added leaverIds
//   })
//     .select("firstName lastName email designationId departmentId avatar")
//     .populate("departmentId designationId");

//   const expiringDocs = await VisaCheck.find({
//     employeeId: { $in: nonCompliantUsers.map((u) => u._id) },
//   });

//   return nonCompliantUsers.map((user) => {
//     const doc = expiringDocs.find(
//       (d) => d.employeeId.toString() === user._id.toString(),
//     );
//     if (doc) {
//       return { ...doc.toObject(), employeeId: user };
//     }
//     return {
//       employeeId: user,
//       expiryDate: null,
//       status: "missing",
//     };
//   });
// };

// // --- 3. DBS Compliance Service ---
// const getDbsComplianceList = async (companyId: string) => {
//   const thresholdDate = await getSettingsAndThreshold(companyId, "dbs");
//   const leaverIds = await getLeaverIds(companyId); // <--- Added

//   const compliantIds = await DbsForm.distinct("userId", {
//     expiryDate: { $gt: thresholdDate },
//   });

//   const nonCompliantUsers = await User.find({
//     company: companyId,
//     role: "employee",
//     _id: { $nin: [...compliantIds, ...leaverIds] }, // <--- Added leaverIds
//   })
//     .select("firstName lastName email designationId departmentId avatar")
//     .populate("departmentId designationId");

//   const expiringDocs = await DbsForm.find({
//     userId: { $in: nonCompliantUsers.map((u) => u._id) },
//   });

//   return nonCompliantUsers.map((user) => {
//     const doc = expiringDocs.find(
//       (d) => d.userId.toString() === user._id.toString(),
//     );
//     if (doc) {
//       return { ...doc.toObject(), userId: user };
//     }
//     return {
//       userId: user,
//       expiryDate: null,
//       status: "missing",
//     };
//   });
// };

// // --- 4. Immigration Compliance Service ---
// const getImmigrationComplianceList = async (companyId: string) => {
//   const thresholdDate = await getSettingsAndThreshold(companyId, "immigration");
//   const leaverIds = await getLeaverIds(companyId); // <--- Added

//   const compliantIds = await ImmigrationStatus.distinct("employeeId", {
//     nextCheckDate: { $gt: thresholdDate },
//   });

//   const nonCompliantUsers = await User.find({
//     company: companyId,
//     noRtwCheck: { $ne: true },
//     role: "employee",
//     _id: { $nin: [...compliantIds, ...leaverIds] }, // <--- Added leaverIds
//   })
//     .select("firstName lastName email designationId departmentId avatar")
//     .populate("departmentId designationId");

//   const expiringDocs = await ImmigrationStatus.find({
//     employeeId: { $in: nonCompliantUsers.map((u) => u._id) },
//   });

//   return nonCompliantUsers.map((user) => {
//     const doc = expiringDocs.find(
//       (d) => d.employeeId.toString() === user._id.toString(),
//     );
//     if (doc) {
//       return { ...doc.toObject(), employeeId: user };
//     }
//     return {
//       employeeId: user,
//       nextCheckDate: null,
//       status: "missing",
//     };
//   });
// };

// // --- 5. Appraisal Compliance Service ---
// const getAppraisalComplianceList = async (companyId: string) => {
//   const thresholdDate = await getSettingsAndThreshold(companyId, "appraisal");
//   const leaverIds = await getLeaverIds(companyId); // <--- Added

//   const compliantIds = await Appraisal.distinct("employeeId", {
//     nextCheckDate: { $gt: thresholdDate },
//   });

//   const nonCompliantUsers = await User.find({
//     company: companyId,
//     role: "employee",
//     _id: { $nin: [...compliantIds, ...leaverIds] }, // <--- Added leaverIds
//   })
//     .select("firstName lastName email designationId departmentId avatar")
//     .populate("departmentId designationId");

//   const expiringDocs = await Appraisal.find({
//     employeeId: { $in: nonCompliantUsers.map((u) => u._id) },
//   });

//   return nonCompliantUsers.map((user) => {
//     const doc = expiringDocs.find(
//       (d) => d.employeeId.toString() === user._id.toString(),
//     );
//     if (doc) {
//       return { ...doc.toObject(), employeeId: user };
//     }
//     return {
//       employeeId: user,
//       nextCheckDate: null,
//       status: "missing",
//     };
//   });
// };

// // --- 6. Right To Work (RTW) Compliance Service ---
// const getRtwComplianceList = async (companyId: string) => {
//   const thresholdDate = await getSettingsAndThreshold(companyId, "rtw");
//   const leaverIds = await getLeaverIds(companyId); // <--- Added

//   const compliantIds = await RightToWork.distinct("employeeId", {
//     nextCheckDate: { $gt: thresholdDate },
//   });

//   const nonCompliantUsers = await User.find({
//     company: companyId,
//     role: "employee",
//     noRtwCheck: { $ne: true },
//     _id: { $nin: [...compliantIds, ...leaverIds] }, // <--- Added leaverIds
//   })
//     .select("firstName lastName email designationId departmentId avatar")
//     .populate("departmentId designationId");

//   const expiringDocs = await RightToWork.find({
//     employeeId: { $in: nonCompliantUsers.map((u) => u._id) },
//   });

//   return nonCompliantUsers.map((user) => {
//     const doc = expiringDocs.find(
//       (d) => d.employeeId.toString() === user._id.toString(),
//     );
//     if (doc) {
//       return { ...doc.toObject(), employeeId: user };
//     }
//     return {
//       employeeId: user,
//       nextCheckDate: null,
//       status: "missing",
//     };
//   });
// };

// const getSpotCheckComplianceList = async (companyId: string) => {
//   const thresholdDate = await getSettingsAndThreshold(companyId, "spot");
//   const leaverIds = await getLeaverIds(companyId); // <--- Added

//   const compliantIds = await SpotCheck.distinct("employeeId", {
//     scheduledDate: { $gt: thresholdDate },
//     isClosed: { $ne: true },
//   });

//   const nonCompliantUsers = await User.find({
//     company: companyId,
//     role: "employee",
//     _id: { $nin: [...compliantIds, ...leaverIds] },
//   })
//     .select("firstName lastName email designationId departmentId avatar")
//     .populate("departmentId designationId");

//   const nonCompliantIds = nonCompliantUsers.map((u) => u._id);

//   // Exclude users whose ALL SpotCheck records are closed
//   const userHasAnyRecords = await SpotCheck.distinct("employeeId", {
//     employeeId: { $in: nonCompliantIds },
//   });
//   const userHasOpenRecords = await SpotCheck.distinct("employeeId", {
//     employeeId: { $in: nonCompliantIds },
//     isClosed: { $ne: true },
//   });
//   const onlyClosedIds = new Set(
//     userHasAnyRecords
//       .filter((id) => !userHasOpenRecords.some((oid) => oid.equals(id)))
//       .map((id) => id.toString()),
//   );
//   const filteredUsers = nonCompliantUsers.filter(
//     (u) => !onlyClosedIds.has(u._id.toString()),
//   );

//   const expiringDocs = await SpotCheck.find({
//     employeeId: { $in: filteredUsers.map((u) => u._id) },
//     isClosed: { $ne: true },
//   });

//   return filteredUsers.map((user) => {
//     const doc = expiringDocs.find(
//       (d) => d.employeeId.toString() === user._id.toString(),
//     );
//     if (doc) {
//       return { ...doc.toObject(), employeeId: user, status: "due-soon" };
//     }
//     return {
//       employeeId: user,
//       scheduledDate: null,
//       status: "missing",
//     };
//   });
// };

// const getSupervisionComplianceList = async (companyId: string) => {
//   const thresholdDate = await getSettingsAndThreshold(companyId, "supervision");
//   const leaverIds = await getLeaverIds(companyId);

//   const compliantIds = await Supervision.distinct("employeeId", {
//     scheduledDate: { $gt: thresholdDate },
//     isClosed: { $ne: true },
//   });

//   const nonCompliantUsers = await User.find({
//     company: companyId,
//     role: "employee",
//     _id: { $nin: [...compliantIds, ...leaverIds] },
//   })
//     .select("firstName lastName email designationId departmentId avatar")
//     .populate("departmentId designationId");

//   const nonCompliantIds = nonCompliantUsers.map((u) => u._id);

//   // Exclude users whose ALL Supervision records are closed
//   const userHasAnyRecords = await Supervision.distinct("employeeId", {
//     employeeId: { $in: nonCompliantIds },
//   });
//   const userHasOpenRecords = await Supervision.distinct("employeeId", {
//     employeeId: { $in: nonCompliantIds },
//     isClosed: { $ne: true },
//   });
//   const onlyClosedIds = new Set(
//     userHasAnyRecords
//       .filter((id) => !userHasOpenRecords.some((oid) => oid.equals(id)))
//       .map((id) => id.toString()),
//   );
//   const filteredUsers = nonCompliantUsers.filter(
//     (u) => !onlyClosedIds.has(u._id.toString()),
//   );

//   const expiringDocs = await Supervision.find({
//     employeeId: { $in: filteredUsers.map((u) => u._id) },
//     isClosed: { $ne: true },
//   });

//   return filteredUsers.map((user) => {
//     const doc = expiringDocs.find(
//       (d) => d.employeeId.toString() === user._id.toString(),
//     );
//     if (doc) {
//       return { ...doc.toObject(), employeeId: user, status: "due-soon" };
//     }
//     return {
//       employeeId: user,
//       scheduledDate: null,
//       status: "missing",
//     };
//   });
// };

// const getTrainingComplianceList = async (companyId: string) => {
//   const leaverIds = await getLeaverIds(companyId); // <--- Added

//   const companyTrainings = await Training.find({ companyId }).select(
//     "_id name reminderBeforeDays",
//   );

//   if (companyTrainings.length === 0) return [];

//   const trainingNonComplianceConditions = companyTrainings.map((t) => ({
//     trainingId: t._id,
//     expireDate: {
//       $lte: moment()
//         .add(t.reminderBeforeDays || 30, "days")
//         .toDate(),
//     },
//   }));

//   const expiringDocs = await EmployeeTraining.find({
//     $or: trainingNonComplianceConditions,
//     employeeId: { $nin: leaverIds }, // <--- Added
//   })
//     .populate({
//       path: "employeeId",
//       match: { company: companyId, role: "employee" },
//       select: "firstName lastName email designationId departmentId avatar",
//       populate: { path: "departmentId designationId" },
//     })
//     .populate("trainingId", "name");

//   const validDocs = expiringDocs.filter((doc) => doc.employeeId);

//   return validDocs.map((doc) => {
//     const user = doc.employeeId;
//     return {
//       ...doc.toObject(),
//       employeeId: user,
//       status: "expiring",
//     };
//   });
// };

// const getInductionComplianceList = async (companyId: string) => {
//   const leaverIds = await getLeaverIds(companyId); // <--- Added

//   const compliantIds = await Induction.distinct("employeeId", {
//     inductionDate: { $exists: true },
//   });

//   const missingInductionUsers = await User.find({
//     company: companyId,
//     role: "employee",
//     _id: { $nin: [...compliantIds, ...leaverIds] }, // <--- Added leaverIds
//   })
//     .select("firstName lastName email designationId departmentId avatar")
//     .populate("departmentId designationId");

//   return missingInductionUsers.map((user) => ({
//     employeeId: user,
//     inductionDate: null,
//     status: "missing",
//   }));
// };

// const getDisciplinaryComplianceList = async (companyId: string) => {
//   const thresholdDate = await getSettingsAndThreshold(companyId, "disciplinary");
//   const leaverIds = await getLeaverIds(companyId);

//   const activeIssues = await Disciplinary.find({
//     issueDeadline: { $exists: true, $lte: thresholdDate },
//     isClosed: { $ne: true },
//     employeeId: { $nin: leaverIds },
//   }).populate({
//     path: "employeeId",
//     match: { company: companyId, role: "employee" },
//     select: "firstName lastName email designationId departmentId avatar",
//     populate: { path: "departmentId designationId" },
//   });

//   const validDocs = activeIssues.filter((doc) => doc.employeeId);

//   return validDocs.map((doc) => {
//     const isOverdue = moment(doc.issueDeadline).isBefore(new Date());
//     return {
//       ...doc.toObject(),
//       status: isOverdue ? "overdue" : "due-soon",
//     };
//   });
// };

// const getQaComplianceList = async (companyId: string) => {
//   const thresholdDate = await getSettingsAndThreshold(companyId, "qa");
//   const leaverIds = await getLeaverIds(companyId);

//   const compliantIds = await QACheck.distinct("employeeId", {
//     scheduledDate: { $gt: thresholdDate },
//     isClosed: { $ne: true },
//   });

//   const nonCompliantUsers = await User.find({
//     company: companyId,
//     role: "employee",
//     _id: { $nin: [...compliantIds, ...leaverIds] },
//   })
//     .select("firstName lastName email designationId departmentId avatar")
//     .populate("departmentId designationId");

//   const nonCompliantIds = nonCompliantUsers.map((u) => u._id);

//   // Exclude users whose ALL QA Check records are closed
//   const userHasAnyRecords = await QACheck.distinct("employeeId", {
//     employeeId: { $in: nonCompliantIds },
//   });
//   const userHasOpenRecords = await QACheck.distinct("employeeId", {
//     employeeId: { $in: nonCompliantIds },
//     isClosed: { $ne: true },
//   });
//   const onlyClosedIds = new Set(
//     userHasAnyRecords
//       .filter((id) => !userHasOpenRecords.some((oid) => oid.equals(id)))
//       .map((id) => id.toString()),
//   );
//   const filteredUsers = nonCompliantUsers.filter(
//     (u) => !onlyClosedIds.has(u._id.toString()),
//   );

//   const qaDocs = await QACheck.find({
//     employeeId: { $in: filteredUsers.map((u) => u._id) },
//     isClosed: { $ne: true },
//   });

//   return filteredUsers.map((user) => {
//     const doc = qaDocs.find(
//       (d) => d.employeeId.toString() === user._id.toString(),
//     );
//     if (doc) {
//       return { ...doc.toObject(), employeeId: user, status: "due-soon" };
//     }
//     return {
//       employeeId: user,
//       scheduledDate: null,
//       status: "missing",
//     };
//   });
// };

// const getEmployeeDocumentComplianceList = async (companyId: string) => {
//   const leaverIds = await getLeaverIds(companyId); // <--- Added

//   const employees = await User.find({
//     company: companyId,
//     role: "employee",
//     _id: { $nin: leaverIds }, 
//   })
//     .select("firstName lastName email designationId departmentId avatar isBritish")
//     .populate("departmentId designationId");

//   if (employees.length === 0) return [];

//   const employeeIds = employees.map((e) => e._id);

//   const allDocs = await EmployeeDocument.find({
//     employeeId: { $in: employeeIds },
//   }).select("employeeId documentTitle");

//   const nonCompliantList = employees
//     .map((user) => {
//       const userDocs = allDocs.filter(
//         (d) => d.employeeId.toString() === user._id.toString(),
//       );

//       const uploadedTitles = userDocs.map((d) =>
//         d.documentTitle.trim().toLowerCase(),
//       );

//       let requiredForThisUser = [...REQUIRED_DOCUMENTS_LIST];
      
//       if (user.noRtwCheck) {
//         requiredForThisUser = requiredForThisUser.filter(
//           (req) => !["Immigration Status", "Right to Work", "Passport"].includes(req)
//         );
//       } 

//       const missing = requiredForThisUser.filter(
//         (req) => !uploadedTitles.includes(req.toLowerCase()),
//       );

//       const refCount = uploadedTitles.filter(
//         (t) => t.includes("reference") && !t.includes("dbs"),
//       ).length;

//       if (refCount < MIN_REFERENCE_COUNT) {
//         missing.push(
//           `Reference (Uploaded: ${refCount}, Required: ${MIN_REFERENCE_COUNT})`,
//         );
//       }

//       if (missing.length > 0) {
//         return {
//           employeeId: user,
//           missingDocuments: missing,
//           status: "missing",
//         };
//       }
//       return null; 
//     })
//     .filter((item) => item !== null); 

//   return nonCompliantList;
// };

// const getCompanyComplianceStats = async (companyId: string) => {
//   const leaverIds = await getLeaverIds(companyId); // <--- Added

//   const employees = await User.find({
//     company: companyId,
//     role: "employee",
//     _id: { $nin: leaverIds }, // <--- Added
//   }).select("_id noRtwCheck isBritish"); 
  
//   const employeeIds = employees.map((user) => user._id);
//   const totalEmployees = employeeIds.length;
  
//   const rtwRequiredEmployeeIds = employees.filter((user) => !user.noRtwCheck).map((u) => u._id);

//   if (totalEmployees === 0) {
//     return {
//       passport: 0, rtw: 0, visa: 0, dbs: 0, immigration: 0, appraisal: 0,
//       spot: 0, supervision: 0, training: 0, induction: 0, disciplinary: 0, employeeDocument: 0, meeting: 0,
//       policy: 0, healthAndSafety: 0,
//     };
//   }

//   const settings = await ScheduleCheck.findOne({ companyId });
//   const defaults = {
//     passport: 30, visa: 30, dbs: 30, immigration: 30, appraisal: 30,
//     rtw: 30, spot: 30, supervision: 30, disciplinary: 30, qa: 30, meeting: 3,
//     policy: 30, healthAndSafety: 30,
//   };

//   const intervals = {
//     passport: settings?.passportCheckDate || defaults.passport,
//     visa: settings?.visaCheckDate || defaults.visa,
//     dbs: settings?.dbsCheckDate || defaults.dbs,
//     immigration: settings?.immigrationCheckDate || defaults.immigration,
//     appraisal: settings?.appraisalCheckDate || defaults.appraisal,
//     rtw: settings?.rtwCheckDate || defaults.rtw,
//     spot: settings?.spotCheckDate || defaults.spot,
//     supervision: settings?.supervisionCheckDate || defaults.supervision,
//     disciplinary: settings?.disciplinaryCheckDate || defaults.disciplinary,
//     qa: settings?.qaCheckDate || defaults.qa,
//     meeting: settings?.meetingCheckDate || defaults.meeting,
//     policy: settings?.policyCheckDate || defaults.policy,
//     healthAndSafety: settings?.healthAndSafetyCheckDate || defaults.healthAndSafety,
//   };

//   const getSafeThreshold = (days: number) => moment().add(days, "days").toDate();

//   const companyTrainings = await Training.find({ companyId }).select("_id reminderBeforeDays");
//   const trainingNonComplianceConditions = companyTrainings.map((t) => ({
//     trainingId: t._id,
//     expireDate: { $lte: moment().add(t.reminderBeforeDays || 30, "days").toDate() },
//   }));

//   const [
//     compliantPassportIds,
//     compliantVisaIds,
//     compliantImmigrationIds,  
//     compliantRTWIds,         
//     compliantDbsIds,         
//     compliantAppraisalIds,  
//     compliantSpotCheckIds,
//     compliantSupervisionIds,
//     compliantQaIds,
//     compliantInductionIds,
//     activeDisciplinaryIssues,
//     nonCompliantTrainingIds,
//     allEmployeeDocs,
//     meetingNonCompliantCount, 
//     policyNonCompliantCount,
//     healthAndSafetyNonCompliantCount,
//   ] = await Promise.all([
//     Passport.distinct("userId", {
//       userId: { $in: rtwRequiredEmployeeIds },
//       passportExpiryDate: { $gt: getSafeThreshold(intervals.passport) },
//     }),
//     VisaCheck.distinct("employeeId", {
//       employeeId: { $in: rtwRequiredEmployeeIds },
//       expiryDate: { $gt: getSafeThreshold(intervals.visa) },
//     }),
//     ImmigrationStatus.distinct("employeeId", {
//       employeeId: { $in: rtwRequiredEmployeeIds },
//       nextCheckDate: { $gt: getSafeThreshold(intervals.immigration) },
//     }),
//     RightToWork.distinct("employeeId", {
//       employeeId: { $in: rtwRequiredEmployeeIds },
//       nextCheckDate: { $gt: getSafeThreshold(intervals.rtw) },
//     }),
//     DbsForm.distinct("userId", {
//       userId: { $in: employeeIds },
//       expiryDate: { $gt: getSafeThreshold(intervals.dbs) },
//     }),
//     Appraisal.distinct("employeeId", {
//       employeeId: { $in: employeeIds },
//       nextCheckDate: { $gt: getSafeThreshold(intervals.appraisal) },
//     }),
//     SpotCheck.distinct("employeeId", {
//       employeeId: { $in: employeeIds },
//       scheduledDate: { $gt: getSafeThreshold(intervals.spot) },
//       isClosed: { $ne: true },
//     }),
//     Supervision.distinct("employeeId", {
//       employeeId: { $in: employeeIds },
//       scheduledDate: { $gt: getSafeThreshold(intervals.supervision) },
//       isClosed: { $ne: true },
//     }),
//     QACheck.distinct("employeeId", {
//       employeeId: { $in: employeeIds },
//       scheduledDate: { $gt: getSafeThreshold(intervals.qa) },
//       isClosed: { $ne: true },
//     }),
//     Induction.distinct("employeeId", {
//       employeeId: { $in: employeeIds },
//       inductionDate: { $exists: true },
//     }),
//     Disciplinary.find({
//       employeeId: { $in: employeeIds },
//       isClosed: { $ne: true },
//       issueDeadline: { $exists: true, $lte: getSafeThreshold(intervals.disciplinary) },
//     }).countDocuments(),
//     trainingNonComplianceConditions.length > 0
//       ? EmployeeTraining.distinct("employeeId", {
//           employeeId: { $in: employeeIds },
//           $or: trainingNonComplianceConditions,
//         })
//       : Promise.resolve([]),
//     EmployeeDocument.find({
//       employeeId: { $in: employeeIds },
//     }).select("employeeId documentTitle"),
//     MeetingMins.countDocuments({
//       companyId: companyId,
//       $or: [
//         { nextMeetingDate: { $exists: false } },
//         { nextMeetingDate: null },
//         { nextMeetingDate: { $lte: getSafeThreshold(intervals.meeting) } }
//       ]
//     }),
//     CompanyPolicy.countDocuments({
//       companyId: companyId,
//       $or: [
//         { expiryDate: { $lte: getSafeThreshold(intervals.policy) } }
//       ]
//     }),
//     HealthAndSafety.countDocuments({
//       companyId: companyId,
//       $or: [
//         { expiryDate: { $lte: getSafeThreshold(intervals.healthAndSafety) } }
//       ]
//     })
//   ]);

//   let employeeDocumentNonCompliantCount = 0;

//   employees.forEach((user) => {
//     const userDocs = allEmployeeDocs.filter(
//       (d) => d.employeeId.toString() === user._id.toString(),
//     );
//     const uploadedTitles = userDocs.map((d) =>
//       d.documentTitle.trim().toLowerCase(),
//     );

//     let requiredForThisUser = [...REQUIRED_DOCUMENTS_LIST];
//     if (user.noRtwCheck) {
//       requiredForThisUser = requiredForThisUser.filter(
//         (req) => !["Immigration Status", "Passport","Right to Work"].includes(req)
//       );
//     } else {
//       requiredForThisUser = requiredForThisUser.filter(
//         (req) => req !== "Ni number/Driving licence"
//       );
//     }

//     const isMissingRequired = requiredForThisUser.some(
//       (req) => !uploadedTitles.includes(req.toLowerCase()),
//     );

//     const refCount = uploadedTitles.filter(
//       (t) => t.includes("reference") && !t.includes("dbs"),
//     ).length;

//     if (isMissingRequired || refCount < MIN_REFERENCE_COUNT) {
//       employeeDocumentNonCompliantCount++;
//     }
//   });

//   // Exclude employees whose ALL Supervision/QA records are closed
//   const allSupervisionEmp = await Supervision.distinct("employeeId", {
//     employeeId: { $in: employeeIds },
//   });
//   const openSupervisionEmp = await Supervision.distinct("employeeId", {
//     employeeId: { $in: employeeIds },
//     isClosed: { $ne: true },
//   });
//   const onlyClosedSupervisionCount = allSupervisionEmp.filter(
//     (id) => !openSupervisionEmp.some((oid) => oid.equals(id)),
//   ).length;

//   const allQAEmp = await QACheck.distinct("employeeId", {
//     employeeId: { $in: employeeIds },
//   });
//   const openQAEmp = await QACheck.distinct("employeeId", {
//     employeeId: { $in: employeeIds },
//     isClosed: { $ne: true },
//   });
//   const onlyClosedQACount = allQAEmp.filter(
//     (id) => !openQAEmp.some((oid) => oid.equals(id)),
//   ).length;

//   const allSpotCheckEmp = await SpotCheck.distinct("employeeId", {
//     employeeId: { $in: employeeIds },
//   });
//   const openSpotCheckEmp = await SpotCheck.distinct("employeeId", {
//     employeeId: { $in: employeeIds },
//     isClosed: { $ne: true },
//   });
//   const onlyClosedSpotCheckCount = allSpotCheckEmp.filter(
//     (id) => !openSpotCheckEmp.some((oid) => oid.equals(id)),
//   ).length;

//   return {
//     passport: rtwRequiredEmployeeIds.length - compliantPassportIds.length,
//     visa: rtwRequiredEmployeeIds.length - compliantVisaIds.length,
//     immigration: rtwRequiredEmployeeIds.length - compliantImmigrationIds.length,
//     rtw: rtwRequiredEmployeeIds.length - compliantRTWIds.length,
//     dbs: totalEmployees - compliantDbsIds.length,
//     appraisal: totalEmployees - compliantAppraisalIds.length,
//     spot: Math.max(0, totalEmployees - compliantSpotCheckIds.length - onlyClosedSpotCheckCount),
//     supervision: Math.max(0, totalEmployees - compliantSupervisionIds.length - onlyClosedSupervisionCount),
//     induction: totalEmployees - compliantInductionIds.length,
//     qa: Math.max(0, totalEmployees - compliantQaIds.length - onlyClosedQACount),
//     disciplinary: activeDisciplinaryIssues,
//     training: nonCompliantTrainingIds.length,
//     employeeDocument: employeeDocumentNonCompliantCount, 
//     meeting: meetingNonCompliantCount, 
//     policy: policyNonCompliantCount, 
//     healthAndSafety: healthAndSafetyNonCompliantCount, 
//   };
// };

// // --- Employee Matrix: Training (module 1 of 15) ---
// // Filter options: trainingId (optional), employeeId (optional), status
// // status values: all | pending | in-progress | completed | expired | missing
// const getTrainingMatrix = async (
//   companyId: string,
//   query: { trainingId?: string; employeeId?: string; status?: string },
// ) => {
//   const leaverIds = await getLeaverIds(companyId);

//   const employeeFilter: any = {
//     company: companyId,
//     role: "employee",
//     _id: { $nin: leaverIds },
//   };
//   if (query.employeeId) {
//     employeeFilter._id = query.employeeId;
//   }

//   const employees = await User.find(employeeFilter)
//     .select("firstName lastName email avatar designationId departmentId")
//     .populate("departmentId designationId")
//     .sort({ firstName: 1, lastName: 1 });

//   const employeeIds = employees.map((e) => e._id);

//   const recordFilter: any = { employeeId: { $in: employeeIds } };
//   if (query.trainingId) {
//     recordFilter.trainingId = query.trainingId;
//   }

//   const records = await EmployeeTraining.find(recordFilter)
//     .populate("trainingId", "name description validityDays reminderBeforeDays")
//     .sort({ assignedDate: -1, createdAt: -1 });

//   const recordsByEmployee = new Map<string, any[]>();
//   records.forEach((rec) => {
//     const key = rec.employeeId.toString();
//     if (!recordsByEmployee.has(key)) recordsByEmployee.set(key, []);
//     recordsByEmployee.get(key)!.push(rec);
//   });

//   const requestedStatus = query.status || "all";

//   // Matches the status logic used in the frontend training details page:
//   //  - completed       → stored status is "completed"
//   //  - in-progress     → optional / no expiry date / outside reminder window
//   //  - expiring-soon   → within reminderBeforeDays before expiry
//   //  - expired         → past the expiry date
//   const getEffectiveStatus = (rec: any) => {
//     if (rec.status === "completed") return "completed";
//     if (rec.isOptional || !rec.expireDate) return "in-progress";

//     const today = moment.utc().startOf("day");
//     const expiry = moment.utc(rec.expireDate).startOf("day");
//     const reminderDays = rec.trainingId?.reminderBeforeDays || 30;
//     const reminderDate = moment
//       .utc(rec.expireDate)
//       .subtract(reminderDays, "days")
//       .startOf("day");

//     if (today.isAfter(expiry, "day")) return "expired";
//     if (today.isSameOrAfter(reminderDate, "day")) return "expiring-soon";
//     return "in-progress";
//   };

//   const rows: any[] = [];

//   employees.forEach((user) => {
//     const userRecords = recordsByEmployee.get(user._id.toString()) || [];

//     const pushRow = (rec: any) => {
//       const effective = getEffectiveStatus(rec);
//       if (requestedStatus !== "all" && effective !== requestedStatus) return;
//       rows.push({
//         _id: rec._id,
//         employeeId: user,
//         trainingId: rec.trainingId,
//         assignedDate: rec.assignedDate,
//         expireDate: rec.expireDate,
//         certificate: rec.certificate,
//         isOptional: rec.isOptional,
//         status: effective,
//         completionHistory: rec.completionHistory || [],
//       });
//     };

//     const pushMissingRow = () => {
//       if (requestedStatus !== "all" && requestedStatus !== "missing") return;
//       rows.push({
//         _id: null,
//         employeeId: user,
//         trainingId: null,
//         assignedDate: null,
//         expireDate: null,
//         status: "missing",
//         completionHistory: [],
//       });
//     };

//     if (query.trainingId) {
//       const rec = userRecords.find(
//         (r) => r.trainingId?._id?.toString() === query.trainingId,
//       );
//       if (rec) {
//         pushRow(rec);
//       } else {
//         pushMissingRow();
//       }
//     } else if (userRecords.length === 0) {
//       pushMissingRow();
//     } else {
//       userRecords.forEach((rec) => pushRow(rec));
//     }
//   });

//   return rows;
// };

// export const ScheduleCheckStatuServices = {
//   getCompanyComplianceStats,
//   getPassportComplianceList,
//   getVisaComplianceList,
//   getDbsComplianceList,
//   getImmigrationComplianceList,
//   getAppraisalComplianceList,
//   getRtwComplianceList,
//   getSpotCheckComplianceList,
//   getSupervisionComplianceList,
//   getTrainingComplianceList,
//   getInductionComplianceList,
//   getDisciplinaryComplianceList,
//   getQaComplianceList,
//   getEmployeeDocumentComplianceList,
//   getTrainingMatrix,
// };

import httpStatus from "http-status";
import moment from '../../utils/moment-setup';
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
import { MeetingMins } from "../meetingMins/meetingMins.model";
import { CompanyPolicy } from "../companyPolicy/companyPolicy.model";
import { HealthAndSafety } from "../healthAndSafety/healthAndSafety.model";
import { Leaver } from "../hr/leaver/leaver.model";

export const UserStatus = ["block", "active"];

// --- Helper: Get leaver userIds for a company ---
const getLeaverIds = async (companyId: string) => {
  return Leaver.distinct("userId", { companyId });
};

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
    qa: 30,
  };

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
  const leaverIds = await getLeaverIds(companyId);

  const compliantIds = await Passport.distinct("userId", {
    passportExpiryDate: { $gt: thresholdDate },
  });

  const nonCompliantUsers = await User.find({
    company: companyId,
    role: "employee",
    status: "active", // <--- Added
    noRtwCheck: { $ne: true },
    _id: { $nin: [...compliantIds, ...leaverIds] },
  })
    .select("firstName lastName email designationId departmentId avatar")
    .populate("departmentId designationId");

  const expiringDocs = await Passport.find({
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
      passportExpiryDate: null,
      status: "missing",
    };
  });
};

// --- 2. Visa Compliance Service ---
const getVisaComplianceList = async (companyId: string) => {
  const thresholdDate = await getSettingsAndThreshold(companyId, "visa");
  const leaverIds = await getLeaverIds(companyId);

  const compliantIds = await VisaCheck.distinct("employeeId", {
    expiryDate: { $gt: thresholdDate },
  });

  const nonCompliantUsers = await User.find({
    company: companyId,
    role: "employee",
    status: "active", // <--- Added
    noRtwCheck: { $ne: true },
    _id: { $nin: [...compliantIds, ...leaverIds] },
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
  const leaverIds = await getLeaverIds(companyId);

  const compliantIds = await DbsForm.distinct("userId", {
    expiryDate: { $gt: thresholdDate },
  });

  const nonCompliantUsers = await User.find({
    company: companyId,
    role: "employee",
    status: "active", // <--- Added
    _id: { $nin: [...compliantIds, ...leaverIds] },
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
  const leaverIds = await getLeaverIds(companyId);

  const compliantIds = await ImmigrationStatus.distinct("employeeId", {
    nextCheckDate: { $gt: thresholdDate },
  });

  const nonCompliantUsers = await User.find({
    company: companyId,
    role: "employee",
    status: "active", // <--- Added
    noRtwCheck: { $ne: true },
    _id: { $nin: [...compliantIds, ...leaverIds] },
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
  const leaverIds = await getLeaverIds(companyId);

  const compliantIds = await Appraisal.distinct("employeeId", {
    nextCheckDate: { $gt: thresholdDate },
  });

  const nonCompliantUsers = await User.find({
    company: companyId,
    role: "employee",
    status: "active", // <--- Added
    _id: { $nin: [...compliantIds, ...leaverIds] },
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
  const leaverIds = await getLeaverIds(companyId);

  const compliantIds = await RightToWork.distinct("employeeId", {
    nextCheckDate: { $gt: thresholdDate },
  });

  const nonCompliantUsers = await User.find({
    company: companyId,
    role: "employee",
    status: "active", // <--- Added
    noRtwCheck: { $ne: true },
    _id: { $nin: [...compliantIds, ...leaverIds] },
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
  const leaverIds = await getLeaverIds(companyId);

  const compliantIds = await SpotCheck.distinct("employeeId", {
    scheduledDate: { $gt: thresholdDate },
    isClosed: { $ne: true },
  });

  const nonCompliantUsers = await User.find({
    company: companyId,
    role: "employee",
    status: "active", // <--- Added
    _id: { $nin: [...compliantIds, ...leaverIds] },
  })
    .select("firstName lastName email designationId departmentId avatar")
    .populate("departmentId designationId");

  const nonCompliantIds = nonCompliantUsers.map((u) => u._id);

  const userHasAnyRecords = await SpotCheck.distinct("employeeId", {
    employeeId: { $in: nonCompliantIds },
  });
  const userHasOpenRecords = await SpotCheck.distinct("employeeId", {
    employeeId: { $in: nonCompliantIds },
    isClosed: { $ne: true },
  });
  const onlyClosedIds = new Set(
    userHasAnyRecords
      .filter((id) => !userHasOpenRecords.some((oid) => oid.equals(id)))
      .map((id) => id.toString()),
  );
  const filteredUsers = nonCompliantUsers.filter(
    (u) => !onlyClosedIds.has(u._id.toString()),
  );

  const expiringDocs = await SpotCheck.find({
    employeeId: { $in: filteredUsers.map((u) => u._id) },
    isClosed: { $ne: true },
  });

  return filteredUsers.map((user) => {
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
  const leaverIds = await getLeaverIds(companyId);

  const compliantIds = await Supervision.distinct("employeeId", {
    scheduledDate: { $gt: thresholdDate },
    isClosed: { $ne: true },
  });

  const nonCompliantUsers = await User.find({
    company: companyId,
    role: "employee",
    status: "active", // <--- Added
    _id: { $nin: [...compliantIds, ...leaverIds] },
  })
    .select("firstName lastName email designationId departmentId avatar")
    .populate("departmentId designationId");

  const nonCompliantIds = nonCompliantUsers.map((u) => u._id);

  const userHasAnyRecords = await Supervision.distinct("employeeId", {
    employeeId: { $in: nonCompliantIds },
  });
  const userHasOpenRecords = await Supervision.distinct("employeeId", {
    employeeId: { $in: nonCompliantIds },
    isClosed: { $ne: true },
  });
  const onlyClosedIds = new Set(
    userHasAnyRecords
      .filter((id) => !userHasOpenRecords.some((oid) => oid.equals(id)))
      .map((id) => id.toString()),
  );
  const filteredUsers = nonCompliantUsers.filter(
    (u) => !onlyClosedIds.has(u._id.toString()),
  );

  const expiringDocs = await Supervision.find({
    employeeId: { $in: filteredUsers.map((u) => u._id) },
    isClosed: { $ne: true },
  });

  return filteredUsers.map((user) => {
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
  const leaverIds = await getLeaverIds(companyId);

  const companyTrainings = await Training.find({ companyId }).select(
    "_id name reminderBeforeDays",
  );

  if (companyTrainings.length === 0) return [];

  const trainingNonComplianceConditions = companyTrainings.map((t) => ({
    trainingId: t._id,
    expireDate: {
      $lte: moment()
        .add(t.reminderBeforeDays || 30, "days")
        .toDate(),
    },
  }));

  const expiringDocs = await EmployeeTraining.find({
    $or: trainingNonComplianceConditions,
    employeeId: { $nin: leaverIds },
  })
    .populate({
      path: "employeeId",
      match: { company: companyId, role: "employee", status: "active" }, // <--- Added status
      select: "firstName lastName email designationId departmentId avatar",
      populate: { path: "departmentId designationId" },
    })
    .populate("trainingId", "name");

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
  const leaverIds = await getLeaverIds(companyId);

  const compliantIds = await Induction.distinct("employeeId", {
    inductionDate: { $exists: true },
  });

  const missingInductionUsers = await User.find({
    company: companyId,
    role: "employee",
    status: "active", // <--- Added
    _id: { $nin: [...compliantIds, ...leaverIds] },
  })
    .select("firstName lastName email designationId departmentId avatar")
    .populate("departmentId designationId");

  return missingInductionUsers.map((user) => ({
    employeeId: user,
    inductionDate: null,
    status: "missing",
  }));
};

const getDisciplinaryComplianceList = async (companyId: string) => {
  const thresholdDate = await getSettingsAndThreshold(companyId, "disciplinary");
  const leaverIds = await getLeaverIds(companyId);

  const activeIssues = await Disciplinary.find({
    issueDeadline: { $exists: true, $lte: thresholdDate },
    isClosed: { $ne: true },
    employeeId: { $nin: leaverIds },
  }).populate({
    path: "employeeId",
    match: { company: companyId, role: "employee", status: "active" }, // <--- Added status
    select: "firstName lastName email designationId departmentId avatar",
    populate: { path: "departmentId designationId" },
  });

  const validDocs = activeIssues.filter((doc) => doc.employeeId);

  return validDocs.map((doc) => {
    const isOverdue = moment(doc.issueDeadline).isBefore(new Date());
    return {
      ...doc.toObject(),
      status: isOverdue ? "overdue" : "due-soon",
    };
  });
};

const getQaComplianceList = async (companyId: string) => {
  const thresholdDate = await getSettingsAndThreshold(companyId, "qa");
  const leaverIds = await getLeaverIds(companyId);

  const compliantIds = await QACheck.distinct("employeeId", {
    scheduledDate: { $gt: thresholdDate },
    isClosed: { $ne: true },
  });

  const nonCompliantUsers = await User.find({
    company: companyId,
    role: "employee",
    status: "active", // <--- Added
    _id: { $nin: [...compliantIds, ...leaverIds] },
  })
    .select("firstName lastName email designationId departmentId avatar")
    .populate("departmentId designationId");

  const nonCompliantIds = nonCompliantUsers.map((u) => u._id);

  const userHasAnyRecords = await QACheck.distinct("employeeId", {
    employeeId: { $in: nonCompliantIds },
  });
  const userHasOpenRecords = await QACheck.distinct("employeeId", {
    employeeId: { $in: nonCompliantIds },
    isClosed: { $ne: true },
  });
  const onlyClosedIds = new Set(
    userHasAnyRecords
      .filter((id) => !userHasOpenRecords.some((oid) => oid.equals(id)))
      .map((id) => id.toString()),
  );
  const filteredUsers = nonCompliantUsers.filter(
    (u) => !onlyClosedIds.has(u._id.toString()),
  );

  const qaDocs = await QACheck.find({
    employeeId: { $in: filteredUsers.map((u) => u._id) },
    isClosed: { $ne: true },
  });

  return filteredUsers.map((user) => {
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
  const leaverIds = await getLeaverIds(companyId);

  const employees = await User.find({
    company: companyId,
    role: "employee",
    status: "active", // <--- Added
    _id: { $nin: leaverIds }, 
  })
    .select("firstName lastName email designationId departmentId avatar isBritish noRtwCheck")
    .populate("departmentId designationId");

  if (employees.length === 0) return [];

  const employeeIds = employees.map((e) => e._id);

  const allDocs = await EmployeeDocument.find({
    employeeId: { $in: employeeIds },
  }).select("employeeId documentTitle");

  const nonCompliantList = employees
    .map((user) => {
      const userDocs = allDocs.filter(
        (d) => d.employeeId.toString() === user._id.toString(),
      );

      const uploadedTitles = userDocs.map((d) =>
        d.documentTitle.trim().toLowerCase(),
      );

      let requiredForThisUser = [...REQUIRED_DOCUMENTS_LIST];
      
      if (user.noRtwCheck) {
        requiredForThisUser = requiredForThisUser.filter(
          (req) => !["Immigration Status", "Right to Work", "Passport"].includes(req)
        );
      } 

      const missing = requiredForThisUser.filter(
        (req) => !uploadedTitles.includes(req.toLowerCase()),
      );

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
  const leaverIds = await getLeaverIds(companyId);

  const employees = await User.find({
    company: companyId,
    role: "employee",
    status: "active", // <--- Added
    _id: { $nin: leaverIds },
  }).select("_id noRtwCheck isBritish"); 
  
  const employeeIds = employees.map((user) => user._id);
  const totalEmployees = employeeIds.length;
  
  const rtwRequiredEmployeeIds = employees.filter((user) => !user.noRtwCheck).map((u) => u._id);

  if (totalEmployees === 0) {
    return {
      passport: 0, rtw: 0, visa: 0, dbs: 0, immigration: 0, appraisal: 0,
      spot: 0, supervision: 0, training: 0, induction: 0, disciplinary: 0, employeeDocument: 0, meeting: 0,
      policy: 0, healthAndSafety: 0,
    };
  }

  const settings = await ScheduleCheck.findOne({ companyId });
  const defaults = {
    passport: 30, visa: 30, dbs: 30, immigration: 30, appraisal: 30,
    rtw: 30, spot: 30, supervision: 30, disciplinary: 30, qa: 30, meeting: 3,
    policy: 30, healthAndSafety: 30,
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
    meeting: settings?.meetingCheckDate || defaults.meeting,
    policy: settings?.policyCheckDate || defaults.policy,
    healthAndSafety: settings?.healthAndSafetyCheckDate || defaults.healthAndSafety,
  };

  const getSafeThreshold = (days: number) => moment().add(days, "days").toDate();

  const companyTrainings = await Training.find({ companyId }).select("_id reminderBeforeDays");
  const trainingNonComplianceConditions = companyTrainings.map((t) => ({
    trainingId: t._id,
    expireDate: { $lte: moment().add(t.reminderBeforeDays || 30, "days").toDate() },
  }));

  const [
    compliantPassportIds,
    compliantVisaIds,
    compliantImmigrationIds,  
    compliantRTWIds,         
    compliantDbsIds,         
    compliantAppraisalIds,  
    compliantSpotCheckIds,
    compliantSupervisionIds,
    compliantQaIds,
    compliantInductionIds,
    activeDisciplinaryIssues,
    nonCompliantTrainingCount,
    allEmployeeDocs,
    meetingNonCompliantCount, 
    policyNonCompliantCount,
    healthAndSafetyNonCompliantCount,
  ] = await Promise.all([
    Passport.distinct("userId", {
      userId: { $in: rtwRequiredEmployeeIds },
      passportExpiryDate: { $gt: getSafeThreshold(intervals.passport) },
    }),
    VisaCheck.distinct("employeeId", {
      employeeId: { $in: rtwRequiredEmployeeIds },
      expiryDate: { $gt: getSafeThreshold(intervals.visa) },
    }),
    ImmigrationStatus.distinct("employeeId", {
      employeeId: { $in: rtwRequiredEmployeeIds },
      nextCheckDate: { $gt: getSafeThreshold(intervals.immigration) },
    }),
    RightToWork.distinct("employeeId", {
      employeeId: { $in: rtwRequiredEmployeeIds },
      nextCheckDate: { $gt: getSafeThreshold(intervals.rtw) },
    }),
    DbsForm.distinct("userId", {
      userId: { $in: employeeIds },
      expiryDate: { $gt: getSafeThreshold(intervals.dbs) },
    }),
    Appraisal.distinct("employeeId", {
      employeeId: { $in: employeeIds },
      nextCheckDate: { $gt: getSafeThreshold(intervals.appraisal) },
    }),
    SpotCheck.distinct("employeeId", {
      employeeId: { $in: employeeIds },
      scheduledDate: { $gt: getSafeThreshold(intervals.spot) },
      isClosed: { $ne: true },
    }),
    Supervision.distinct("employeeId", {
      employeeId: { $in: employeeIds },
      scheduledDate: { $gt: getSafeThreshold(intervals.supervision) },
      isClosed: { $ne: true },
    }),
    QACheck.distinct("employeeId", {
      employeeId: { $in: employeeIds },
      scheduledDate: { $gt: getSafeThreshold(intervals.qa) },
      isClosed: { $ne: true },
    }),
    Induction.distinct("employeeId", {
      employeeId: { $in: employeeIds },
      inductionDate: { $exists: true },
    }),
    Disciplinary.find({
      employeeId: { $in: employeeIds },
      isClosed: { $ne: true },
      issueDeadline: { $exists: true, $lte: getSafeThreshold(intervals.disciplinary) },
    }).countDocuments(),
    trainingNonComplianceConditions.length > 0
  ? EmployeeTraining.countDocuments({
      employeeId: { $in: employeeIds },
      $or: trainingNonComplianceConditions,
    })
  : Promise.resolve(0),
    EmployeeDocument.find({
      employeeId: { $in: employeeIds },
    }).select("employeeId documentTitle"),
    MeetingMins.countDocuments({
      companyId: companyId,
      $or: [
        { nextMeetingDate: { $exists: false } },
        { nextMeetingDate: null },
        { nextMeetingDate: { $lte: getSafeThreshold(intervals.meeting) } }
      ]
    }),
    CompanyPolicy.countDocuments({
      companyId: companyId,
      $or: [
        { expiryDate: { $lte: getSafeThreshold(intervals.policy) } }
      ]
    }),
    HealthAndSafety.countDocuments({
      companyId: companyId,
      $or: [
        { expiryDate: { $lte: getSafeThreshold(intervals.healthAndSafety) } }
      ]
    })
  ]);

  let employeeDocumentNonCompliantCount = 0;

  employees.forEach((user) => {
    const userDocs = allEmployeeDocs.filter(
      (d) => d.employeeId.toString() === user._id.toString(),
    );
    const uploadedTitles = userDocs.map((d) =>
      d.documentTitle.trim().toLowerCase(),
    );

    let requiredForThisUser = [...REQUIRED_DOCUMENTS_LIST];
    if (user.noRtwCheck) {
      requiredForThisUser = requiredForThisUser.filter(
        (req) => !["Immigration Status", "Passport","Right to Work"].includes(req)
      );
    } else {
      requiredForThisUser = requiredForThisUser.filter(
        (req) => req !== "Ni number/Driving licence"
      );
    }

    const isMissingRequired = requiredForThisUser.some(
      (req) => !uploadedTitles.includes(req.toLowerCase()),
    );

    const refCount = uploadedTitles.filter(
      (t) => t.includes("reference") && !t.includes("dbs"),
    ).length;

    if (isMissingRequired || refCount < MIN_REFERENCE_COUNT) {
      employeeDocumentNonCompliantCount++;
    }
  });

  const allSupervisionEmp = await Supervision.distinct("employeeId", {
    employeeId: { $in: employeeIds },
  });
  const openSupervisionEmp = await Supervision.distinct("employeeId", {
    employeeId: { $in: employeeIds },
    isClosed: { $ne: true },
  });
  const onlyClosedSupervisionCount = allSupervisionEmp.filter(
    (id) => !openSupervisionEmp.some((oid) => oid.equals(id)),
  ).length;

  const allQAEmp = await QACheck.distinct("employeeId", {
    employeeId: { $in: employeeIds },
  });
  const openQAEmp = await QACheck.distinct("employeeId", {
    employeeId: { $in: employeeIds },
    isClosed: { $ne: true },
  });
  const onlyClosedQACount = allQAEmp.filter(
    (id) => !openQAEmp.some((oid) => oid.equals(id)),
  ).length;

  const allSpotCheckEmp = await SpotCheck.distinct("employeeId", {
    employeeId: { $in: employeeIds },
  });
  const openSpotCheckEmp = await SpotCheck.distinct("employeeId", {
    employeeId: { $in: employeeIds },
    isClosed: { $ne: true },
  });
  const onlyClosedSpotCheckCount = allSpotCheckEmp.filter(
    (id) => !openSpotCheckEmp.some((oid) => oid.equals(id)),
  ).length;

  return {
    passport: rtwRequiredEmployeeIds.length - compliantPassportIds.length,
    visa: rtwRequiredEmployeeIds.length - compliantVisaIds.length,
    immigration: rtwRequiredEmployeeIds.length - compliantImmigrationIds.length,
    rtw: rtwRequiredEmployeeIds.length - compliantRTWIds.length,
    dbs: totalEmployees - compliantDbsIds.length,
    appraisal: totalEmployees - compliantAppraisalIds.length,
    spot: Math.max(0, totalEmployees - compliantSpotCheckIds.length - onlyClosedSpotCheckCount),
    supervision: Math.max(0, totalEmployees - compliantSupervisionIds.length - onlyClosedSupervisionCount),
    induction: totalEmployees - compliantInductionIds.length,
    qa: Math.max(0, totalEmployees - compliantQaIds.length - onlyClosedQACount),
    disciplinary: activeDisciplinaryIssues,
     training: nonCompliantTrainingCount,
    employeeDocument: employeeDocumentNonCompliantCount, 
    meeting: meetingNonCompliantCount, 
    policy: policyNonCompliantCount, 
    healthAndSafety: healthAndSafetyNonCompliantCount, 
  };
};

// --- Employee Matrix: Training (module 1 of 15) ---
const getTrainingMatrix = async (
  companyId: string,
  query: { trainingId?: string; employeeId?: string; status?: string },
) => {
  const leaverIds = await getLeaverIds(companyId);

  const employeeFilter: any = {
    company: companyId,
    role: "employee",
  
  };
  if (query.employeeId) {
    employeeFilter._id = query.employeeId;
  }

  const employees = await User.find(employeeFilter)
    .select("firstName lastName email avatar designationId departmentId")
    .populate("departmentId designationId")
    .sort({ firstName: 1, lastName: 1 });

  const employeeIds = employees.map((e) => e._id);

  const recordFilter: any = { employeeId: { $in: employeeIds } };
  if (query.trainingId) {
    recordFilter.trainingId = query.trainingId;
  }

  const records = await EmployeeTraining.find(recordFilter)
    .populate("trainingId", "name description validityDays reminderBeforeDays")
    .sort({ assignedDate: -1, createdAt: -1 });

  const recordsByEmployee = new Map<string, any[]>();
  records.forEach((rec) => {
    const key = rec.employeeId.toString();
    if (!recordsByEmployee.has(key)) recordsByEmployee.set(key, []);
    recordsByEmployee.get(key)!.push(rec);
  });

  const requestedStatus = query.status || "all";

  const getEffectiveStatus = (rec: any) => {
    if (rec.status === "completed") return "completed";
    if (rec.isOptional || !rec.expireDate) return "in-progress";

    const today = moment.utc().startOf("day");
    const expiry = moment.utc(rec.expireDate).startOf("day");
    const reminderDays = rec.trainingId?.reminderBeforeDays || 30;
    const reminderDate = moment
      .utc(rec.expireDate)
      .subtract(reminderDays, "days")
      .startOf("day");

    if (today.isAfter(expiry, "day")) return "expired";
    if (today.isSameOrAfter(reminderDate, "day")) return "expiring-soon";
    return "in-progress";
  };

  const rows: any[] = [];

  employees.forEach((user) => {
    const userRecords = recordsByEmployee.get(user._id.toString()) || [];

    const pushRow = (rec: any) => {
      const effective = getEffectiveStatus(rec);
      if (requestedStatus !== "all" && effective !== requestedStatus) return;
      rows.push({
        _id: rec._id,
        employeeId: user,
        trainingId: rec.trainingId,
        assignedDate: rec.assignedDate,
        expireDate: rec.expireDate,
        certificate: rec.certificate,
        isOptional: rec.isOptional,
        status: effective,
        completionHistory: rec.completionHistory || [],
      });
    };

    const pushMissingRow = () => {
      if (requestedStatus !== "all" && requestedStatus !== "missing") return;
      rows.push({
        _id: null,
        employeeId: user,
        trainingId: null,
        assignedDate: null,
        expireDate: null,
        status: "missing",
        completionHistory: [],
      });
    };

    if (query.trainingId) {
      const rec = userRecords.find(
        (r) => r.trainingId?._id?.toString() === query.trainingId,
      );
      if (rec) {
        pushRow(rec);
      } else {
        pushMissingRow();
      }
    } else if (userRecords.length === 0) {
      pushMissingRow();
    } else {
      userRecords.forEach((rec) => pushRow(rec));
    }
  });

  return rows;
};


// --- Employee Matrix: RTW (Right to Work) ---
// Filter options: employeeId (optional), status
// status values: all | active | expiring-soon | expired | missing
const getRtwMatrix = async (
  companyId: string,
  query: { employeeId?: string; status?: string },
) => {
  const leaverIds = await getLeaverIds(companyId);

  // Build employee filter
  const employeeFilter: any = {
    company: companyId,
    role: "employee",
    status: "active",
    _id: { $nin: leaverIds },
    noRtwCheck: { $ne: true }, // Exclude employees with no RTW check required
  };
  if (query.employeeId) {
    employeeFilter._id = query.employeeId;
  }

  const employees = await User.find(employeeFilter)
    .select("firstName lastName email avatar designationId departmentId noRtwCheck")
    .populate("departmentId designationId")
    .sort({ firstName: 1, lastName: 1 });

  if (employees.length === 0) {
    return [];
  }

  const employeeIds = employees.map((e) => e._id);

  // Get RTW records for these employees
  const rtwRecords = await RightToWork.find({
    employeeId: { $in: employeeIds },
  }).sort({ createdAt: -1 });

  const recordsByEmployee = new Map<string, any>();
  rtwRecords.forEach((rec) => {
    const key = rec.employeeId.toString();
    // If multiple records exist, keep the most recent one (or the one with nextCheckDate)
    if (!recordsByEmployee.has(key) || 
        (rec.nextCheckDate && 
         (!recordsByEmployee.get(key)?.nextCheckDate || 
          new Date(rec.nextCheckDate) > new Date(recordsByEmployee.get(key).nextCheckDate)))) {
      recordsByEmployee.set(key, rec);
    }
  });

  // Get schedule settings for threshold
  const settings = await ScheduleCheck.findOne({ companyId });
  const checkInterval = settings?.rtwCheckDate || 30;

  const requestedStatus = query.status || "all";

  // Helper to determine RTW status
  const getRtwStatus = (record: any | null) => {
    if (!record || !record.nextCheckDate) return "missing";

    const now = moment().startOf("day");
    const checkDate = moment(record.nextCheckDate).startOf("day");
    const diffDays = checkDate.diff(now, "days");

    if (now.isAfter(checkDate)) {
      return "expired";
    }
    if (checkInterval > 0 && diffDays <= checkInterval) {
      return "expiring-soon";
    }
    return "active";
  };

  const rows: any[] = [];

  employees.forEach((user) => {
    const record = recordsByEmployee.get(user._id.toString()) || null;
    const status = getRtwStatus(record);

    // Filter by requested status
    if (requestedStatus !== "all" && status !== requestedStatus) return;

    rows.push({
      employeeId: user,
      rtwId: record?._id || null,
      nextCheckDate: record?.nextCheckDate || null,
      status: status,
      logs: record?.logs || [],
      createdAt: record?.createdAt || null,
      updatedAt: record?.updatedAt || null,
    });
  });

  return rows;
};



const getVisaMatrix = async (
  companyId: string,
  query: { employeeId?: string; status?: string },
) => {
  const leaverIds = await getLeaverIds(companyId);

  // Build employee filter
  const employeeFilter: any = {
    company: companyId,
    role: "employee",
    status: "active",
    _id: { $nin: leaverIds },
    noRtwCheck: { $ne: true }, // Exclude employees with no RTW check required (Visa is also RTW related)
  };
  if (query.employeeId) {
    employeeFilter._id = query.employeeId;
  }

  const employees = await User.find(employeeFilter)
    .select("firstName lastName email avatar designationId departmentId noRtwCheck")
    .populate("departmentId designationId")
    .sort({ firstName: 1, lastName: 1 });

  if (employees.length === 0) {
    return [];
  }

  const employeeIds = employees.map((e) => e._id);

  // Get Visa records for these employees
  const visaRecords = await VisaCheck.find({
    employeeId: { $in: employeeIds },
  }).sort({ createdAt: -1 });

  const recordsByEmployee = new Map<string, any>();
  visaRecords.forEach((rec) => {
    const key = rec.employeeId.toString();
    // If multiple records exist, keep the most recent one (or the one with expiryDate)
    if (!recordsByEmployee.has(key) || 
        (rec.expiryDate && 
         (!recordsByEmployee.get(key)?.expiryDate || 
          new Date(rec.expiryDate) > new Date(recordsByEmployee.get(key).expiryDate)))) {
      recordsByEmployee.set(key, rec);
    }
  });

  // Get schedule settings for threshold
  const settings = await ScheduleCheck.findOne({ companyId });
  const checkInterval = settings?.visaCheckDate || 30;

  const requestedStatus = query.status || "all";

  // Helper to determine Visa status
  const getVisaStatus = (record: any | null) => {
    if (!record || !record.expiryDate) return "missing";

    const now = moment().startOf("day");
    const expiry = moment(record.expiryDate).startOf("day");
    const diffDays = expiry.diff(now, "days");

    if (now.isAfter(expiry)) {
      return "expired";
    }
    if (checkInterval > 0 && diffDays <= checkInterval) {
      return "expiring-soon";
    }
    return "active";
  };

  const rows: any[] = [];

  employees.forEach((user) => {
    const record = recordsByEmployee.get(user._id.toString()) || null;
    const status = getVisaStatus(record);

    // Filter by requested status
    if (requestedStatus !== "all" && status !== requestedStatus) return;

    rows.push({
      employeeId: user,
      visaId: record?._id || null,
      startDate: record?.startDate || null,
      expiryDate: record?.expiryDate || null,
      status: status,
      logs: record?.logs || [],
      createdAt: record?.createdAt || null,
      updatedAt: record?.updatedAt || null,
    });
  });

  return rows;
};


const getImmigrationMatrix = async (
  companyId: string,
  query: { employeeId?: string; status?: string },
) => {
  const leaverIds = await getLeaverIds(companyId);

  // Build employee filter
  const employeeFilter: any = {
    company: companyId,
    role: "employee",
    status: "active",
    _id: { $nin: leaverIds },
    noRtwCheck: { $ne: true }, // Exclude employees with no RTW check required
  };
  if (query.employeeId) {
    employeeFilter._id = query.employeeId;
  }

  const employees = await User.find(employeeFilter)
    .select("firstName lastName email avatar designationId departmentId noRtwCheck")
    .populate("departmentId designationId")
    .sort({ firstName: 1, lastName: 1 });

  if (employees.length === 0) {
    return [];
  }

  const employeeIds = employees.map((e) => e._id);

  // Get Immigration records for these employees
  const immigrationRecords = await ImmigrationStatus.find({
    employeeId: { $in: employeeIds },
  }).sort({ createdAt: -1 });

  const recordsByEmployee = new Map<string, any>();
  immigrationRecords.forEach((rec) => {
    const key = rec.employeeId.toString();
    // If multiple records exist, keep the most recent one (or the one with nextCheckDate)
    if (!recordsByEmployee.has(key) || 
        (rec.nextCheckDate && 
         (!recordsByEmployee.get(key)?.nextCheckDate || 
          new Date(rec.nextCheckDate) > new Date(recordsByEmployee.get(key).nextCheckDate)))) {
      recordsByEmployee.set(key, rec);
    }
  });

  // Get schedule settings for threshold
  const settings = await ScheduleCheck.findOne({ companyId });
  const checkInterval = settings?.immigrationCheckDate || 30;

  const requestedStatus = query.status || "all";

  // Helper to determine Immigration status
  const getImmigrationStatus = (record: any | null) => {
    if (!record || !record.nextCheckDate) return "missing";

    const now = moment().startOf("day");
    const checkDate = moment(record.nextCheckDate).startOf("day");
    const diffDays = checkDate.diff(now, "days");

    if (now.isAfter(checkDate)) {
      return "expired";
    }
    if (checkInterval > 0 && diffDays <= checkInterval) {
      return "expiring-soon";
    }
    return "active";
  };

  const rows: any[] = [];

  employees.forEach((user) => {
    const record = recordsByEmployee.get(user._id.toString()) || null;
    const status = getImmigrationStatus(record);

    // Filter by requested status
    if (requestedStatus !== "all" && status !== requestedStatus) return;

    rows.push({
      employeeId: user,
      immigrationId: record?._id || null,
      nextCheckDate: record?.nextCheckDate || null,
      status: status,
      logs: record?.logs || [],
      createdAt: record?.createdAt || null,
      updatedAt: record?.updatedAt || null,
    });
  });

  return rows;
};


// --- Employee Matrix: Passport ---
// Filter options: employeeId (optional), status
// status values: all | active | expiring-soon | expired | missing
const getPassportMatrix = async (
  companyId: string,
  query: { employeeId?: string; status?: string },
) => {
  const leaverIds = await getLeaverIds(companyId);

  // Build employee filter
  const employeeFilter: any = {
    company: companyId,
    role: "employee",
    status: "active",
    _id: { $nin: leaverIds },
    noRtwCheck: { $ne: true }, // Exclude employees with no RTW check required
  };
  if (query.employeeId) {
    employeeFilter._id = query.employeeId;
  }

  const employees = await User.find(employeeFilter)
    .select("firstName lastName email avatar designationId departmentId noRtwCheck")
    .populate("departmentId designationId")
    .sort({ firstName: 1, lastName: 1 });

  if (employees.length === 0) {
    return [];
  }

  const employeeIds = employees.map((e) => e._id);

  // Get Passport records for these employees
  const passportRecords = await Passport.find({
    userId: { $in: employeeIds },
  }).sort({ createdAt: -1 });

  const recordsByEmployee = new Map<string, any>();
  passportRecords.forEach((rec) => {
    const key = rec.userId.toString();
    // If multiple records exist, keep the most recent one
    if (!recordsByEmployee.has(key) || 
        (rec.passportExpiryDate && 
         (!recordsByEmployee.get(key)?.passportExpiryDate || 
          new Date(rec.passportExpiryDate) > new Date(recordsByEmployee.get(key).passportExpiryDate)))) {
      recordsByEmployee.set(key, rec);
    }
  });

  // Get schedule settings for threshold
  const settings = await ScheduleCheck.findOne({ companyId });
  const checkInterval = settings?.passportCheckDate || 30;

  const requestedStatus = query.status || "all";

  // Helper to determine Passport status
  const getPassportStatus = (record: any | null) => {
    if (!record || !record.passportExpiryDate) return "missing";

    const now = moment().startOf("day");
    const expiry = moment(record.passportExpiryDate).startOf("day");
    const diffDays = expiry.diff(now, "days");

    if (now.isAfter(expiry)) {
      return "expired";
    }
    if (checkInterval > 0 && diffDays <= checkInterval) {
      return "expiring-soon";
    }
    return "active";
  };

  const rows: any[] = [];

  employees.forEach((user) => {
    const record = recordsByEmployee.get(user._id.toString()) || null;
    const status = getPassportStatus(record);

    // Filter by requested status
    if (requestedStatus !== "all" && status !== requestedStatus) return;

    rows.push({
      employeeId: user,
      passportId: record?._id || null,
      passportNumber: record?.passportNumber || null,
      passportExpiryDate: record?.passportExpiryDate || null,
      status: status,
      logs: record?.logs || [],
      createdAt: record?.createdAt || null,
      updatedAt: record?.updatedAt || null,
    });
  });

  return rows;
};


// --- Employee Matrix: DBS ---
// Filter options: employeeId (optional), status
// status values: all | active | expiring-soon | expired | missing
const getDbsMatrix = async (
  companyId: string,
  query: { employeeId?: string; status?: string },
) => {
  const leaverIds = await getLeaverIds(companyId);

  // Build employee filter - DBS applies to all employees (no noRtwCheck filter)
  const employeeFilter: any = {
    company: companyId,
    role: "employee",
    status: "active",
    _id: { $nin: leaverIds },
  };
  if (query.employeeId) {
    employeeFilter._id = query.employeeId;
  }

  const employees = await User.find(employeeFilter)
    .select("firstName lastName email avatar designationId departmentId noRtwCheck")
    .populate("departmentId designationId")
    .sort({ firstName: 1, lastName: 1 });

  if (employees.length === 0) {
    return [];
  }

  const employeeIds = employees.map((e) => e._id);

  // Get DBS records for these employees
  const dbsRecords = await DbsForm.find({
    userId: { $in: employeeIds },
  }).sort({ createdAt: -1 });

  const recordsByEmployee = new Map<string, any>();
  dbsRecords.forEach((rec) => {
    const key = rec.userId.toString();
    // If multiple records exist, keep the most recent one
    if (!recordsByEmployee.has(key) || 
        (rec.expiryDate && 
         (!recordsByEmployee.get(key)?.expiryDate || 
          new Date(rec.expiryDate) > new Date(recordsByEmployee.get(key).expiryDate)))) {
      recordsByEmployee.set(key, rec);
    }
  });

  // Get schedule settings for threshold
  const settings = await ScheduleCheck.findOne({ companyId });
  const checkInterval = settings?.dbsCheckDate || 30;

  const requestedStatus = query.status || "all";

  // Helper to determine DBS status
  const getDbsStatus = (record: any | null) => {
    if (!record || !record.expiryDate) return "missing";

    const now = moment().startOf("day");
    const expiry = moment(record.expiryDate).startOf("day");
    const diffDays = expiry.diff(now, "days");

    if (now.isAfter(expiry)) {
      return "expired";
    }
    if (checkInterval > 0 && diffDays <= checkInterval) {
      return "expiring-soon";
    }
    return "active";
  };

  const rows: any[] = [];

  employees.forEach((user) => {
    const record = recordsByEmployee.get(user._id.toString()) || null;
    const status = getDbsStatus(record);

    // Filter by requested status
    if (requestedStatus !== "all" && status !== requestedStatus) return;

    rows.push({
      employeeId: user,
      dbsId: record?._id || null,
      disclosureNumber: record?.disclosureNumber || null,
      dateOfIssue: record?.dateOfIssue || null,
      expiryDate: record?.expiryDate || null,
      dbsDocumentUrl: record?.dbsDocumentUrl || null,
      status: status,
      logs: record?.logs || [],
      createdAt: record?.createdAt || null,
      updatedAt: record?.updatedAt || null,
    });
  });

  return rows;
};



// --- Employee Matrix: Appraisal ---
// Filter options: employeeId (optional), status
// status values: all | active | expiring-soon | expired | missing
const getAppraisalMatrix = async (
  companyId: string,
  query: { employeeId?: string; status?: string },
) => {
  const leaverIds = await getLeaverIds(companyId);

  // Build employee filter
  const employeeFilter: any = {
    company: companyId,
    role: "employee",
    status: "active",
    _id: { $nin: leaverIds },
  };
  if (query.employeeId) {
    employeeFilter._id = query.employeeId;
  }

  const employees = await User.find(employeeFilter)
    .select("firstName lastName email avatar designationId departmentId noRtwCheck")
    .populate("departmentId designationId")
    .sort({ firstName: 1, lastName: 1 });

  if (employees.length === 0) {
    return [];
  }

  const employeeIds = employees.map((e) => e._id);

  // Get Appraisal records for these employees
  const appraisalRecords = await Appraisal.find({
    employeeId: { $in: employeeIds },
  }).sort({ createdAt: -1 });

  const recordsByEmployee = new Map<string, any>();
  appraisalRecords.forEach((rec) => {
    const key = rec.employeeId.toString();
    // If multiple records exist, keep the most recent one (or the one with nextCheckDate)
    if (!recordsByEmployee.has(key) || 
        (rec.nextCheckDate && 
         (!recordsByEmployee.get(key)?.nextCheckDate || 
          new Date(rec.nextCheckDate) > new Date(recordsByEmployee.get(key).nextCheckDate)))) {
      recordsByEmployee.set(key, rec);
    }
  });

  // Get schedule settings for threshold
  const settings = await ScheduleCheck.findOne({ companyId });
  const checkInterval = settings?.appraisalCheckDate || 30;

  const requestedStatus = query.status || "all";

  // Helper to determine Appraisal status
  const getAppraisalStatus = (record: any | null) => {
    if (!record || !record.nextCheckDate) return "missing";

    const now = moment().startOf("day");
    const checkDate = moment(record.nextCheckDate).startOf("day");
    const diffDays = checkDate.diff(now, "days");

    if (now.isAfter(checkDate)) {
      return "expired";
    }
    if (checkInterval > 0 && diffDays <= checkInterval) {
      return "expiring-soon";
    }
    return "active";
  };

  const rows: any[] = [];

  employees.forEach((user) => {
    const record = recordsByEmployee.get(user._id.toString()) || null;
    const status = getAppraisalStatus(record);

    // Filter by requested status
    if (requestedStatus !== "all" && status !== requestedStatus) return;

    rows.push({
      employeeId: user,
      appraisalId: record?._id || null,
      nextCheckDate: record?.nextCheckDate || null,
      status: status,
      logs: record?.logs || [],
      createdAt: record?.createdAt || null,
      updatedAt: record?.updatedAt || null,
    });
  });

  return rows;
};



// --- Employee Matrix: Spot Check ---
// Filter options: employeeId (optional), status
// status values: all | scheduled | due-soon | overdue | completed | missing | closed
const getSpotCheckMatrix = async (
  companyId: string,
  query: { employeeId?: string; status?: string },
) => {
  const leaverIds = await getLeaverIds(companyId);

  // Build employee filter
  const employeeFilter: any = {
    company: companyId,
    role: "employee",
    status: "active",
    _id: { $nin: leaverIds },
  };
  if (query.employeeId) {
    employeeFilter._id = query.employeeId;
  }

  const employees = await User.find(employeeFilter)
    .select("firstName lastName email avatar designationId departmentId noRtwCheck")
    .populate("departmentId designationId")
    .sort({ firstName: 1, lastName: 1 });

  if (employees.length === 0) {
    return [];
  }

  const employeeIds = employees.map((e) => e._id);

  // Get Spot Check records for these employees
  const spotCheckRecords = await SpotCheck.find({
    employeeId: { $in: employeeIds },
  }).sort({ createdAt: -1 });

  const recordsByEmployee = new Map<string, any>();
  spotCheckRecords.forEach((rec) => {
    const key = rec.employeeId.toString();
    // If multiple records exist, keep the most recent one
    if (!recordsByEmployee.has(key) || 
        (rec.scheduledDate && 
         (!recordsByEmployee.get(key)?.scheduledDate || 
          new Date(rec.scheduledDate) > new Date(recordsByEmployee.get(key).scheduledDate)))) {
      recordsByEmployee.set(key, rec);
    }
  });

  // Get schedule settings for threshold
  const settings = await ScheduleCheck.findOne({ companyId });
  const checkInterval = settings?.spotCheckDate || 30;

  const requestedStatus = query.status || "all";

  // Helper to determine Spot Check status
  const getSpotCheckStatus = (record: any | null) => {
    if (!record) return "missing";
    
    // Check if closed
    if (record.isClosed) return "closed";
    
    // Check if completed (has completionDate)
    if (record.completionDate) {
      // Check if completion date is after scheduled date (cycle active)
      if (record.scheduledDate && moment(record.scheduledDate).isAfter(moment(record.completionDate))) {
        // Cycle is active - check status based on scheduled date
        const now = moment().startOf("day");
        const scheduled = moment(record.scheduledDate).startOf("day");
        const diffDays = scheduled.diff(now, "days");

        if (now.isAfter(scheduled)) {
          return "overdue";
        }
        if (diffDays <= 7 && diffDays >= 0) {
          return "due-soon";
        }
        return "scheduled";
      }
      // Completion date is after scheduled date (cycle completed)
      return "completed";
    }
    
    // No completion date - check status based on scheduled date
    if (!record.scheduledDate) return "missing";
    
    const now = moment().startOf("day");
    const scheduled = moment(record.scheduledDate).startOf("day");
    const diffDays = scheduled.diff(now, "days");

    if (now.isAfter(scheduled)) {
      return "overdue";
    }
    if (diffDays <= 7 && diffDays >= 0) {
      return "due-soon";
    }
    return "scheduled";
  };

  const rows: any[] = [];

  employees.forEach((user) => {
    const record = recordsByEmployee.get(user._id.toString()) || null;
    const status = getSpotCheckStatus(record);

    // Filter by requested status
    if (requestedStatus !== "all" && status !== requestedStatus) return;

    rows.push({
      employeeId: user,
      spotCheckId: record?._id || null,
      scheduledDate: record?.scheduledDate || null,
      completionDate: record?.completionDate || null,
      spotCheckNote: record?.spotCheckNote || null,
      isClosed: record?.isClosed || false,
      status: status,
      logs: record?.logs || [],
      createdAt: record?.createdAt || null,
      updatedAt: record?.updatedAt || null,
    });
  });

  return rows;
};


// --- Employee Matrix: Supervision ---
// Filter options: employeeId (optional), status
// status values: all | scheduled | due-soon | overdue | completed | closed | missing
const getSupervisionMatrix = async (
  companyId: string,
  query: { employeeId?: string; status?: string },
) => {
  const leaverIds = await getLeaverIds(companyId);

  // Build employee filter
  const employeeFilter: any = {
    company: companyId,
    role: "employee",
    status: "active",
    _id: { $nin: leaverIds },
  };
  if (query.employeeId) {
    employeeFilter._id = query.employeeId;
  }

  const employees = await User.find(employeeFilter)
    .select("firstName lastName email avatar designationId departmentId noRtwCheck")
    .populate("departmentId designationId")
    .sort({ firstName: 1, lastName: 1 });

  if (employees.length === 0) {
    return [];
  }

  const employeeIds = employees.map((e) => e._id);

  // Get Supervision records for these employees
  const supervisionRecords = await Supervision.find({
    employeeId: { $in: employeeIds },
  }).sort({ createdAt: -1 });

  const recordsByEmployee = new Map<string, any>();
  supervisionRecords.forEach((rec) => {
    const key = rec.employeeId.toString();
    // If multiple records exist, keep the most recent one
    if (!recordsByEmployee.has(key) || 
        (rec.scheduledDate && 
         (!recordsByEmployee.get(key)?.scheduledDate || 
          new Date(rec.scheduledDate) > new Date(recordsByEmployee.get(key).scheduledDate)))) {
      recordsByEmployee.set(key, rec);
    }
  });

  // Get schedule settings for threshold
  const settings = await ScheduleCheck.findOne({ companyId });
  const checkInterval = settings?.supervisionCheckDate || 30;

  const requestedStatus = query.status || "all";

  // Helper to determine Supervision status
  const getSupervisionStatus = (record: any | null) => {
    if (!record) return "missing";
    
    // Check if closed
    if (record.isClosed) return "closed";
    
    // Check if completed (has completionDate)
    if (record.completionDate) {
      // Check if completion date is after scheduled date (cycle active)
      if (record.scheduledDate && moment(record.scheduledDate).isAfter(moment(record.completionDate))) {
        // Cycle is active - check status based on scheduled date
        const now = moment().startOf("day");
        const scheduled = moment(record.scheduledDate).startOf("day");
        const diffDays = scheduled.diff(now, "days");

        if (now.isAfter(scheduled)) {
          return "overdue";
        }
        if (diffDays <= 7 && diffDays >= 0) {
          return "due-soon";
        }
        return "scheduled";
      }
      // Completion date is after scheduled date (cycle completed)
      return "completed";
    }
    
    // No completion date - check status based on scheduled date
    if (!record.scheduledDate) return "missing";
    
    const now = moment().startOf("day");
    const scheduled = moment(record.scheduledDate).startOf("day");
    const diffDays = scheduled.diff(now, "days");

    if (now.isAfter(scheduled)) {
      return "overdue";
    }
    if (diffDays <= 7 && diffDays >= 0) {
      return "due-soon";
    }
    return "scheduled";
  };

  const rows: any[] = [];

  employees.forEach((user) => {
    const record = recordsByEmployee.get(user._id.toString()) || null;
    const status = getSupervisionStatus(record);

    // Filter by requested status
    if (requestedStatus !== "all" && status !== requestedStatus) return;

    rows.push({
      employeeId: user,
      supervisionId: record?._id || null,
      scheduledDate: record?.scheduledDate || null,
      completionDate: record?.completionDate || null,
      sessionNote: record?.sessionNote || null,
      isClosed: record?.isClosed || false,
      status: status,
      logs: record?.logs || [],
      createdAt: record?.createdAt || null,
      updatedAt: record?.updatedAt || null,
    });
  });

  return rows;
};



// --- Employee Matrix: QA Check ---
// Filter options: employeeId (optional), status
// status values: all | scheduled | due-soon | overdue | completed | closed | missing
const getQaMatrix = async (
  companyId: string,
  query: { employeeId?: string; status?: string },
) => {
  const leaverIds = await getLeaverIds(companyId);

  // Build employee filter
  const employeeFilter: any = {
    company: companyId,
    role: "employee",
    status: "active",
    _id: { $nin: leaverIds },
  };
  if (query.employeeId) {
    employeeFilter._id = query.employeeId;
  }

  const employees = await User.find(employeeFilter)
    .select("firstName lastName email avatar designationId departmentId noRtwCheck")
    .populate("departmentId designationId")
    .sort({ firstName: 1, lastName: 1 });

  if (employees.length === 0) {
    return [];
  }

  const employeeIds = employees.map((e) => e._id);

  // Get QA Check records for these employees
  const qaRecords = await QACheck.find({
    employeeId: { $in: employeeIds },
  }).sort({ createdAt: -1 });

  const recordsByEmployee = new Map<string, any>();
  qaRecords.forEach((rec) => {
    const key = rec.employeeId.toString();
    // If multiple records exist, keep the most recent one
    if (!recordsByEmployee.has(key) || 
        (rec.scheduledDate && 
         (!recordsByEmployee.get(key)?.scheduledDate || 
          new Date(rec.scheduledDate) > new Date(recordsByEmployee.get(key).scheduledDate)))) {
      recordsByEmployee.set(key, rec);
    }
  });

  // Get schedule settings for threshold
  const settings = await ScheduleCheck.findOne({ companyId });
  const checkInterval = settings?.qaCheckDate || 30;

  const requestedStatus = query.status || "all";

  // Helper to determine QA Check status
  const getQaStatus = (record: any | null) => {
    if (!record) return "missing";
    
    // Check if closed
    if (record.isClosed) return "closed";
    
    // Check if completed (has completionDate)
    if (record.completionDate) {
      // Check if completion date is after scheduled date (cycle active)
      if (record.scheduledDate && moment(record.scheduledDate).isAfter(moment(record.completionDate))) {
        // Cycle is active - check status based on scheduled date
        const now = moment().startOf("day");
        const scheduled = moment(record.scheduledDate).startOf("day");
        const diffDays = scheduled.diff(now, "days");

        if (now.isAfter(scheduled)) {
          return "overdue";
        }
        if (diffDays <= 7 && diffDays >= 0) {
          return "due-soon";
        }
        return "scheduled";
      }
      // Completion date is after scheduled date (cycle completed)
      return "completed";
    }
    
    // No completion date - check status based on scheduled date
    if (!record.scheduledDate) return "missing";
    
    const now = moment().startOf("day");
    const scheduled = moment(record.scheduledDate).startOf("day");
    const diffDays = scheduled.diff(now, "days");

    if (now.isAfter(scheduled)) {
      return "overdue";
    }
    if (diffDays <= 7 && diffDays >= 0) {
      return "due-soon";
    }
    return "scheduled";
  };

  const rows: any[] = [];

  employees.forEach((user) => {
    const record = recordsByEmployee.get(user._id.toString()) || null;
    const status = getQaStatus(record);

    // Filter by requested status
    if (requestedStatus !== "all" && status !== requestedStatus) return;

    rows.push({
      employeeId: user,
      qaId: record?._id || null,
      scheduledDate: record?.scheduledDate || null,
      completionDate: record?.completionDate || null,
      qaCheckNote: record?.QACheckNote || null,
      isClosed: record?.isClosed || false,
      status: status,
      logs: record?.logs || [],
      createdAt: record?.createdAt || null,
      updatedAt: record?.updatedAt || null,
    });
  });

  return rows;
};



// --- Employee Matrix: Induction ---
// Filter options: employeeId (optional), status
// status values: all | scheduled | promoted | no-promotion | missing
const getInductionMatrix = async (
  companyId: string,
  query: { employeeId?: string; status?: string },
) => {
  const leaverIds = await getLeaverIds(companyId);

  // Build employee filter
  const employeeFilter: any = {
    company: companyId,
    role: "employee",
    status: "active",
    _id: { $nin: leaverIds },
  };
  if (query.employeeId) {
    employeeFilter._id = query.employeeId;
  }

  const employees = await User.find(employeeFilter)
    .select("firstName lastName email avatar designationId departmentId noRtwCheck")
    .populate("departmentId designationId")
    .sort({ firstName: 1, lastName: 1 });

  if (employees.length === 0) {
    return [];
  }

  const employeeIds = employees.map((e) => e._id);

  // Get Induction records for these employees
  const inductionRecords = await Induction.find({
    employeeId: { $in: employeeIds },
  }).sort({ createdAt: -1 });

  const recordsByEmployee = new Map<string, any>();
  inductionRecords.forEach((rec) => {
    const key = rec.employeeId.toString();
    // If multiple records exist, keep the most recent one
    if (!recordsByEmployee.has(key) || 
        (rec.inductionDate && 
         (!recordsByEmployee.get(key)?.inductionDate || 
          new Date(rec.inductionDate) > new Date(recordsByEmployee.get(key).inductionDate)))) {
      recordsByEmployee.set(key, rec);
    }
  });

  const requestedStatus = query.status || "all";

  // Helper to determine Induction status
  const getInductionStatus = (record: any | null) => {
    if (!record) return "missing";
    
    // Check if no promotion
    if (record.noPromotion) return "no-promotion";
    
    // Check if has induction date
    if (record.inductionDate) {
      // Check if there's a promotion action in logs
      const hasPromotionLog = record.logs?.some((log: any) => 
        log.title?.toLowerCase().includes('promoted')
      );
      if (hasPromotionLog) return "promoted";
      return "scheduled";
    }
    
    return "missing";
  };

  const rows: any[] = [];

  employees.forEach((user) => {
    const record = recordsByEmployee.get(user._id.toString()) || null;
    const status = getInductionStatus(record);

    // Filter by requested status
    if (requestedStatus !== "all" && status !== requestedStatus) return;

    rows.push({
      employeeId: user,
      inductionId: record?._id || null,
      inductionDate: record?.inductionDate || null,
      noPromotion: record?.noPromotion || false,
      status: status,
      logs: record?.logs || [],
      createdAt: record?.createdAt || null,
      updatedAt: record?.updatedAt || null,
    });
  });

  return rows;
};


// --- Employee Matrix: Disciplinary ---
// Filter options: employeeId (optional), status
// status values: all | active | due-soon | overdue | resolved | closed | missing
const getDisciplinaryMatrix = async (
  companyId: string,
  query: { employeeId?: string; status?: string },
) => {
  const leaverIds = await getLeaverIds(companyId);

  // Build employee filter
  const employeeFilter: any = {
    company: companyId,
    role: "employee",
    status: "active",
    _id: { $nin: leaverIds },
  };
  if (query.employeeId) {
    employeeFilter._id = query.employeeId;
  }

  const employees = await User.find(employeeFilter)
    .select("firstName lastName email avatar designationId departmentId noRtwCheck")
    .populate("departmentId designationId")
    .sort({ firstName: 1, lastName: 1 });

  if (employees.length === 0) {
    return [];
  }

  const employeeIds = employees.map((e) => e._id);

  // Get Disciplinary records for these employees
  const disciplinaryRecords = await Disciplinary.find({
    employeeId: { $in: employeeIds },
  }).sort({ createdAt: -1 });

  const recordsByEmployee = new Map<string, any>();
  disciplinaryRecords.forEach((rec) => {
    const key = rec.employeeId.toString();
    // If multiple records exist, keep the most recent one
    if (!recordsByEmployee.has(key) || 
        (rec.createdAt && 
         (!recordsByEmployee.get(key)?.createdAt || 
          new Date(rec.createdAt) > new Date(recordsByEmployee.get(key).createdAt)))) {
      recordsByEmployee.set(key, rec);
    }
  });

  // Get schedule settings for threshold
  const settings = await ScheduleCheck.findOne({ companyId });
  const checkInterval = settings?.disciplinaryCheckDate || 30;

  const requestedStatus = query.status || "all";

  // Helper to determine Disciplinary status
  const getDisciplinaryStatus = (record: any | null) => {
    if (!record) return "missing";
    
    // Check if closed
    if (record.isClosed) return "closed";
    
    // Check if has issue deadline
    if (record.issueDeadline) {
      const now = moment().startOf("day");
      const deadline = moment(record.issueDeadline).startOf("day");
      const diffDays = deadline.diff(now, "days");

      if (now.isAfter(deadline)) {
        return "overdue";
      }
      if (diffDays <= checkInterval) {
        return "due-soon";
      }
      return "active";
    }
    
    // No issue deadline - check if there are logs with resolved action
    const hasResolvedLog = record.logs?.some((log: any) => 
      log.title?.toLowerCase().includes('resolved')
    );
    if (hasResolvedLog) return "resolved";
    
    return "missing";
  };

  const rows: any[] = [];

  employees.forEach((user) => {
    const record = recordsByEmployee.get(user._id.toString()) || null;
    const status = getDisciplinaryStatus(record);

    // Filter by requested status
    if (requestedStatus !== "all" && status !== requestedStatus) return;

    rows.push({
      employeeId: user,
      disciplinaryId: record?._id || null,
      issueDeadline: record?.issueDeadline || null,
      extendDeadline: record?.extendDeadline || null,
      issueNote: record?.issueNote || null,
      isClosed: record?.isClosed || false,
      status: status,
      logs: record?.logs || [],
      createdAt: record?.createdAt || null,
      updatedAt: record?.updatedAt || null,
    });
  });

  return rows;
};




// --- Employee Matrix: Required Documents ---
// Filter options: employeeId (optional), status, documentType (optional)
// status values: all | No Issue | Missing Document
// documentType: if provided, only employees who are missing that specific document are returned
const getRequiredDocumentsMatrix = async (
  companyId: string,
  query: { employeeId?: string; status?: string; documentType?: string },
) => {
  const leaverIds = await getLeaverIds(companyId);

  // Build employee filter
  const employeeFilter: any = {
    company: companyId,
    role: "employee",
    status: "active",
    _id: { $nin: leaverIds },
  };
  if (query.employeeId) {
    employeeFilter._id = query.employeeId;
  }

  const employees = await User.find(employeeFilter)
    .select("firstName lastName email avatar designationId departmentId noRtwCheck isBritish")
    .populate("departmentId designationId")
    .sort({ firstName: 1, lastName: 1 });

  if (employees.length === 0) {
    return [];
  }

  const employeeIds = employees.map((e) => e._id);

  // Get all documents for these employees
  const allDocs = await EmployeeDocument.find({
    employeeId: { $in: employeeIds },
  }).select("employeeId documentTitle documentUrl");

  // Group documents by employee
  const docsByEmployee = new Map<string, any[]>();
  allDocs.forEach((doc) => {
    const key = doc.employeeId.toString();
    if (!docsByEmployee.has(key)) docsByEmployee.set(key, []);
    docsByEmployee.get(key)!.push(doc);
  });

  const requestedStatus = query.status || "all";
  const requestedDocumentType =
    query.documentType && query.documentType !== "all"
      ? query.documentType.trim().toLowerCase()
      : null;

  // Helper to determine compliance status
  const getComplianceStatus = (user: any, docs: any[]) => {
    const uploadedTitles = docs.map((d) => d.documentTitle.trim().toLowerCase());

    let requiredForThisUser = [...REQUIRED_DOCUMENTS_LIST];

    if (user.noRtwCheck) {
      requiredForThisUser = requiredForThisUser.filter(
        (req) => !["Immigration Status", "Right to Work", "Passport"].includes(req)
      );
    }

    const missing = requiredForThisUser.filter(
      (req) => !uploadedTitles.includes(req.toLowerCase())
    );

    const refCount = uploadedTitles.filter(
      (t) => t.includes("reference") && !t.includes("dbs")
    ).length;

    if (refCount < MIN_REFERENCE_COUNT) {
      missing.push(
        `Reference (Uploaded: ${refCount}, Required: ${MIN_REFERENCE_COUNT})`
      );
    }

    return {
      isCompliant: missing.length === 0,
      missingDocuments: missing,
      requiredDocuments: requiredForThisUser,
      totalUploaded: docs.length,
    };
  };

  const rows: any[] = [];

  employees.forEach((user) => {
    const docs = docsByEmployee.get(user._id.toString()) || [];
    const compliance = getComplianceStatus(user, docs);

    // documentType filter: only show employees who are missing this specific document
    // and only show that document in the missingDocuments list
    if (requestedDocumentType) {
      const filteredMissing = compliance.missingDocuments.filter(
        (m) => m.toLowerCase().includes(requestedDocumentType),
      );
      if (filteredMissing.length === 0) return;
      compliance.missingDocuments = filteredMissing;
    }

    const status = compliance.isCompliant ? "No Issue" : "Missing Document";

    // Filter by requested status
    if (requestedStatus !== "all" && status !== requestedStatus) return;

    // Build document title -> first document url map for CSV export
    const documentUrls: Record<string, string> = {};
    docs.forEach((doc) => {
      const title = doc.documentTitle.trim();
      if (
        !documentUrls[title] &&
        doc.documentUrl &&
        doc.documentUrl.length > 0
      ) {
        documentUrls[title] = doc.documentUrl[0];
      }
    });

    rows.push({
      employeeId: user,
      totalUploaded: compliance.totalUploaded,
      missingDocuments: compliance.missingDocuments,
      requiredDocuments: compliance.requiredDocuments,
      isCompliant: compliance.isCompliant,
      status: status,
      documents: docs,
      documentUrls,
    });
  });

  return rows;
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
  getTrainingMatrix,
  getRtwMatrix,
  getVisaMatrix,
  getImmigrationMatrix,
  getPassportMatrix,
  getDbsMatrix,
  getAppraisalMatrix,
  getSpotCheckMatrix,
  getSupervisionMatrix,
  getQaMatrix,
  getInductionMatrix,
  getDisciplinaryMatrix,
  getRequiredDocumentsMatrix
};