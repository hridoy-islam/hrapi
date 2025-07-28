/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";


import { AttendanceControllers } from "./attendance.controller";


const router = express.Router();
router.get(
  "/",
//   auth("admin", "company", "creator", "user", "director"),
AttendanceControllers.getAllAttendance
);

router.get(
  "/:id",
//   auth("admin", "user", "director", "company", "creator"),
AttendanceControllers.getSingleAttendance
);
router.post(
  "/clock-event",
//   auth("admin", "user", "director", "company", "creator"),
AttendanceControllers.createAttendance
);

router.patch(
  "/:id",
//   auth("admin", "user", "creator", "company", "director"),
AttendanceControllers.updateAttendance
);


router.patch(
  "/clock-event/:attendanceId",
//   auth("admin", "user", "creator", "company", "director"),
AttendanceControllers.clockOutAttendance
);


export const AttendanceRoutes = router;
