import { Router } from "express";
import { UserRoutes } from "../modules/user/user.route";
import { AuthRoutes } from "../modules/auth/auth.router";
import { NoticeRoutes } from "../modules/hr/notice/notice.router";
import { DepartmentRoutes } from "../modules/hr/department/department.router";
import { EmailRoutes } from "../modules/hr/email-setup/email-setup.router";
import { AttendanceRoutes } from "../modules/hr/attendance/attendance.router";
import { VacancyRoutes } from "../modules/hr/vacancy/vacancy.router";
import { ApplicantRoutes } from "../modules/hr/applicant/applicant.router";
import { RecruitmentRoutes } from "../modules/hr/recruitment/recruitment.router";
import { TrainingRoutes } from "../modules/hr/training/training.router";
import { DesignationRoutes } from "../modules/hr/designation/designation.router";
import { ShiftRoutes } from "../modules/hr/shift/shift.router";
import { EmployeeRateRoutes } from "../modules/hr/employeeRate/employeeRate.router";
import { HolidayRoutes } from "../modules/hr/holidays/holiday.router";
import { LeaveRoutes } from "../modules/hr/leave/leave.router";
import { RightToWorkRoutes } from "../modules/hr/rightToWork/rightToWork.router";
import { BankHolidayRoutes } from "../modules/hr/bank-holiday/bank-holiday.router";
import { PayrollRoutes } from "../modules/hr/payroll/payroll.router";
import { RequestDocumentRoutes } from "../modules/hr/request-document/requestDocument.router";
import { UploadDocumentRoutes } from "../modules/hr/documents/documents.route";
import { SubscriptionPlanRoutes } from "../modules/subscriptionPlan/subscriptionPlan.router";
import { AdminNoticeRoutes } from "../modules/noticeAdmin/noticeAdmin.router";
import { CompanyReportRoutes } from "../modules/companyReport/companyReport.router";
import { EmployeeDocumentRoutes } from "../modules/hr/employeeDocument/employeeDocument.router";
import { ScheduleCheckRoutes } from "../modules/scheduleCheck/scheduleCheck.router";
import { VisaCheckRoutes } from "../modules/hr/visaCheck/visaCheck.router";
import { DbsFormRoutes } from "../modules/dbs/dbsForm.route";
import { PassportRoutes } from "../modules/passport/passport.route";
import { AppraisalRoutes } from "../modules/appraisal/appraisal.route";
import { ImmigrationStatusRoutes } from "../modules/hr/immigrationStatus/immigrationStatus.router";

const router = Router();

const moduleRoutes = [
  {
    path: "/users",
    route: UserRoutes,
  },
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/subscription-plans",
    route: SubscriptionPlanRoutes,
  },
  {
    path: "/hr/notice",
    route: NoticeRoutes,
  },
  {
    path: "/hr/department",
    route: DepartmentRoutes,
  },
  {
    path: "/hr/email-setup",
    route: EmailRoutes,
  },
  {
    path: "/hr/attendance",
    route: AttendanceRoutes,
  },
  {
    path: "/hr/vacancy",
    route: VacancyRoutes,
  },

  {
    path: "/hr/applicant",
    route: ApplicantRoutes,
  },
  {
    path: "/hr/recruitment",
    route: RecruitmentRoutes,
  },
  {
    path: "/hr/training",
    route: TrainingRoutes,
  },
  {
    path: "/hr/designation",
    route: DesignationRoutes,
  },
  {
    path: "/hr/shift",
    route: ShiftRoutes,
  },
  {
    path: "/hr/employeeRate",
    route: EmployeeRateRoutes,
  },
  {
    path: "/hr/holidays",
    route: HolidayRoutes,
  },
  {
    path: "/hr/leave",
    route: LeaveRoutes,
  },
  {
    path: "/hr/right-to-work",
    route: RightToWorkRoutes,
  },
  {
    path: "/hr/bank-holiday",
    route: BankHolidayRoutes,
  },
  {
    path: "/hr/payroll",
    route: PayrollRoutes,
  },
  {
    path: "/hr/request-document",
    route: RequestDocumentRoutes,
  },
  {
    path: "/documents",
    route: UploadDocumentRoutes,
  },
  {
    path: "/admin-notice",
    route: AdminNoticeRoutes,
  },
  {
    path: "/company-report",
    route: CompanyReportRoutes,
  },
  {
    path: "/employee-documents",
    route: EmployeeDocumentRoutes,
  },
  {
    path: "/schedule-check",
    route: ScheduleCheckRoutes,
  },
  {
    path: "/visa",
    route: VisaCheckRoutes,
  },
    {
    path: "/dbs",
    route: DbsFormRoutes,
  },
  {
    path: "/passport",
    route: PassportRoutes,
  },
  {
    path: "/appraisal",
    route: AppraisalRoutes,
  },
  {
    path: "/immigration",
    route: ImmigrationStatusRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
