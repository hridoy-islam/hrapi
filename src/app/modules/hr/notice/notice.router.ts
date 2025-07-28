/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";

import { NoticeControllers } from "./notice.controller";


const router = express.Router();
router.get(
  "/",
//   auth("admin", "company", "creator", "user", "director"),
  NoticeControllers.getAllNotice
);
router.get(
  "/:id",
//   auth("admin", "user", "director", "company", "creator"),
NoticeControllers.getSingleNotice
);
router.post(
  "/",
//   auth("admin", "user", "director", "company", "creator"),
NoticeControllers.createNotice
);

router.patch(
  "/:id",
//   auth("admin", "user", "creator", "company", "director"),
NoticeControllers.updateNotice
);



export const NoticeRoutes = router;
