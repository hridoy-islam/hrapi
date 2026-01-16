/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { ScheduleCheckControllers } from "./scheduleCheck.controller";
import auth from "../../middlewares/auth";


const router = express.Router();
router.get(
  "/",
  auth("admin", "company"),
  ScheduleCheckControllers.getAllScheduleCheck
);
router.get(
  "/:id",
  auth("admin", "company"),
ScheduleCheckControllers.getSingleScheduleCheck
);
router.post(
  "/",
  auth("admin", "company"),
ScheduleCheckControllers.createScheduleCheck
);

router.patch(
  "/:id",
  auth("admin", "company"),
ScheduleCheckControllers.updateScheduleCheck
);

router.delete(
  "/:id",
  auth("admin"),
  ScheduleCheckControllers.deleteScheduleCheck
);



export const ScheduleCheckRoutes = router;
