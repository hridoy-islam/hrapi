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

router.get(
  "/:companyId/spot-check",
  auth("admin", "company"),
  ScheduleCheckStatusControllers.getSpotCheckStatusList
);

router.get(
  "/:companyId/supervision",
  auth("admin", "company"),
  ScheduleCheckStatusControllers.getSupervisionStatusList
);

router.get(
  "/:companyId/training",
  auth("admin", "company"),
  ScheduleCheckStatusControllers.getTrainingStatusList
);
router.get(
  "/:companyId/induction",
  auth("admin", "company"),
  ScheduleCheckStatusControllers.getInductionStatusList
);

router.get(
  "/:companyId/disciplinary",
  auth("admin", "company"),
  ScheduleCheckStatusControllers.getDisciplinaryStatusList
);
router.get(
  "/:companyId/qa",
  auth("admin", "company"),
  ScheduleCheckStatusControllers.getQAStatusList
);

router.get(
  "/:companyId/required-documents",
  auth("admin", "company"),
  ScheduleCheckStatusControllers.getRequiredDocumentStatusList,
);

export const ScheduleCheckStatusRoutes = router;