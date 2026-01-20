/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { ScheduleCheckStatusControllers } from "./scheduleCheckStatus.controller";
import auth from "../../middlewares/auth";

const router = express.Router();


router.get(
  "/:companyId",
  auth("admin", "company"),
  ScheduleCheckStatusControllers.getAllScheduleCheckStatus
);


router.get(
  "/:companyId/passport",
  auth("admin", "company"),
  ScheduleCheckStatusControllers.getPassportStatusList
);


router.get(
  "/:companyId/visa",
  auth("admin", "company"),
  ScheduleCheckStatusControllers.getVisaStatusList
);


router.get(
  "/:companyId/dbs",
  auth("admin", "company"),
  ScheduleCheckStatusControllers.getDbsStatusList
);


router.get(
  "/:companyId/immigration",
  auth("admin", "company"),
  ScheduleCheckStatusControllers.getImmigrationStatusList
);


router.get(
  "/:companyId/appraisal",
  auth("admin", "company"),
  ScheduleCheckStatusControllers.getAppraisalStatusList
);


router.get(
  "/:companyId/rtw",
  auth("admin", "company"),
  ScheduleCheckStatusControllers.getRtwStatusList
);

export const ScheduleCheckStatusRoutes = router;