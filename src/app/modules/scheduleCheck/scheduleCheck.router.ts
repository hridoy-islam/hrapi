/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { ScheduleCheckControllers } from "./scheduleCheck.controller";
import auth from "../../middlewares/auth";


const router = express.Router();
router.get(
  "/",
  auth("admin", "company","companyAdmin"),
  ScheduleCheckControllers.getAllScheduleCheck
);
router.get(
  "/:id",
  auth("admin", "company","companyAdmin"),
ScheduleCheckControllers.getSingleScheduleCheck
);
router.post(
  "/",
  auth("admin", "company","companyAdmin"),
ScheduleCheckControllers.createScheduleCheck
);

router.patch(
  "/:id",
  auth("admin", "company","companyAdmin"),
ScheduleCheckControllers.updateScheduleCheck
);

router.delete(
  "/:id",
  auth("admin"),
  ScheduleCheckControllers.deleteScheduleCheck
);



export const ScheduleCheckRoutes = router;
