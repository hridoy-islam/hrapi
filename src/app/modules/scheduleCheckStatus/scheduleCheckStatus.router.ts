/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { ScheduleCheckStatusControllers } from "./scheduleCheckStatus.controller";
import auth from "../../middlewares/auth";

const router = express.Router();


router.get(
  "/:companyId",
  auth("admin", "company","companyAdmin"),
  ScheduleCheckStatusControllers.getAllScheduleCheckStatus
);


router.get(
  "/:companyId/passport",
  auth("admin", "company","companyAdmin"),
  ScheduleCheckStatusControllers.getPassportStatusList
);


router.get(
  "/:companyId/visa",
  auth("admin", "company","companyAdmin"),
  ScheduleCheckStatusControllers.getVisaStatusList
);


router.get(
  "/:companyId/dbs",
  auth("admin", "company","companyAdmin"),
  ScheduleCheckStatusControllers.getDbsStatusList
);


router.get(
  "/:companyId/immigration",
  auth("admin", "company","companyAdmin"),
  ScheduleCheckStatusControllers.getImmigrationStatusList
);


router.get(
  "/:companyId/appraisal",
  auth("admin", "company","companyAdmin"),
  ScheduleCheckStatusControllers.getAppraisalStatusList
);


router.get(
  "/:companyId/rtw",
  auth("admin", "company","companyAdmin"),
  ScheduleCheckStatusControllers.getRtwStatusList
);

router.get(
  "/:companyId/spot-check",
  auth("admin", "company","companyAdmin"),
  ScheduleCheckStatusControllers.getSpotCheckStatusList
);

router.get(
  "/:companyId/supervision",
  auth("admin", "company","companyAdmin"),
  ScheduleCheckStatusControllers.getSupervisionStatusList
);

router.get(
  "/:companyId/training",
  auth("admin", "company","companyAdmin"),
  ScheduleCheckStatusControllers.getTrainingStatusList
);
router.get(
  "/:companyId/induction",
  auth("admin", "company","companyAdmin"),
  ScheduleCheckStatusControllers.getInductionStatusList
);

router.get(
  "/:companyId/disciplinary",
  auth("admin", "company","companyAdmin"),
  ScheduleCheckStatusControllers.getDisciplinaryStatusList
);
router.get(
  "/:companyId/qa",
  auth("admin", "company","companyAdmin"),
  ScheduleCheckStatusControllers.getQAStatusList
);

router.get(
  "/:companyId/required-documents",
  auth("admin", "company","companyAdmin"),
  ScheduleCheckStatusControllers.getRequiredDocumentStatusList,
);

export const ScheduleCheckStatusRoutes = router;