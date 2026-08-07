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

router.get(
  "/:companyId/employee-matrix/training",
  auth("admin", "company","companyAdmin"),
  ScheduleCheckStatusControllers.getTrainingMatrixList,
);

router.get(
  "/:companyId/employee-matrix/rtw",
  auth("admin", "company", "companyAdmin"),
  ScheduleCheckStatusControllers.getRtwMatrixList,
);


router.get(
  "/:companyId/employee-matrix/visa",
  auth("admin", "company", "companyAdmin"),
  ScheduleCheckStatusControllers.getVisaMatrixList,
);
router.get(
  "/:companyId/employee-matrix/immigration",
  auth("admin", "company", "companyAdmin"),
  ScheduleCheckStatusControllers.getImmigrationMatrixList,
);

router.get(
  "/:companyId/employee-matrix/passport",
  auth("admin", "company", "companyAdmin"),
  ScheduleCheckStatusControllers.getPassportMatrixList,
);


router.get(
  "/:companyId/employee-matrix/dbs",
  auth("admin", "company", "companyAdmin"),
  ScheduleCheckStatusControllers.getDbsMatrixList,
);

router.get(
  "/:companyId/employee-matrix/appraisal",
  auth("admin", "company", "companyAdmin"),
  ScheduleCheckStatusControllers.getAppraisalMatrixList,
);

router.get(
  "/:companyId/employee-matrix/spot-check",
  auth("admin", "company", "companyAdmin"),
  ScheduleCheckStatusControllers.getSpotCheckMatrixList,
);


router.get(
  "/:companyId/employee-matrix/supervision",
  auth("admin", "company", "companyAdmin"),
  ScheduleCheckStatusControllers.getSupervisionMatrixList,
);


router.get(
  "/:companyId/employee-matrix/qa",
  auth("admin", "company", "companyAdmin"),
  ScheduleCheckStatusControllers.getQaMatrixList,
);

router.get(
  "/:companyId/employee-matrix/induction",
  auth("admin", "company", "companyAdmin"),
  ScheduleCheckStatusControllers.getInductionMatrixList,
);

router.get(
  "/:companyId/employee-matrix/disciplinary",
  auth("admin", "company", "companyAdmin"),
  ScheduleCheckStatusControllers.getDisciplinaryMatrixList,
);


router.get(
  "/:companyId/employee-matrix/required-documents",
  auth("admin", "company", "companyAdmin"),
  ScheduleCheckStatusControllers.getRequiredDocumentsMatrixList,
);


export const ScheduleCheckStatusRoutes = router;