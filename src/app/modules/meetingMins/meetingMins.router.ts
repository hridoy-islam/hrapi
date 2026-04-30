/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { MeetingMinsControllers } from "./meetingMins.controller";


const router = express.Router();

router.get(
  "/",
//   auth("admin", "company", "creator", "user", "director"),
MeetingMinsControllers.getAllMeetingMins
);
router.get(
  "/unacknowledgement-meeting/:employeeId",
//   auth("admin", "company", "creator", "user", "director"),
MeetingMinsControllers.getAllUnAcknowledgeMeetingMins
);


router.get(
  "/:id",
//   auth("admin", "user", "director", "company", "creator"),
MeetingMinsControllers.getSingleMeetingMins
);
router.patch(
  "/:meetingId/logs/:logId/acknowledge/:employeeId",
  MeetingMinsControllers.acknowledgeMeetingLog
);
router.patch(
  "/:meetingId/log/:logId/documents",
  MeetingMinsControllers.uploadDocumentsToMeetingLogIntoDB
);

router.post(
  "/",
//   auth("admin", "user", "director", "company", "creator"),
MeetingMinsControllers.createMeetingMins
);


router.patch(
  "/:id",
//   auth("admin", "user", "creator", "company", "director"),
MeetingMinsControllers.updateMeetingMins
);



export const MeetingMinsRoutes = router;
