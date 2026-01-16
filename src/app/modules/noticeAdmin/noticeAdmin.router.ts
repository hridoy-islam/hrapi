/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";

import { AdminNoticeControllers } from "./noticeAdmin.controller";


const router = express.Router();
router.get(
  "/",
//   auth("admin", "company", "creator", "user", "director"),
  AdminNoticeControllers.getAllAdminNotice
);
router.get(
  "/:id",
//   auth("admin", "user", "director", "company", "creator"),
AdminNoticeControllers.getSingleAdminNotice
);
router.post(
  "/",
//   auth("admin", "user", "director", "company", "creator"),
AdminNoticeControllers.createAdminNotice
);

router.patch(
  "/:id",
//   auth("admin", "user", "creator", "company", "director"),
AdminNoticeControllers.updateAdminNotice
);



export const AdminNoticeRoutes = router;
