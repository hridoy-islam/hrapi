/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { EmailControllers } from "./email-setup.controller";





const router = express.Router();
router.get(
  "/",
//   auth("admin", "company", "creator", "user", "director"),
EmailControllers.getAllEmail
);
// router.get(
//   "/:id",
// //   auth("admin", "user", "director", "company", "creator"),
// NoticeControllers.getSingleNotice
// );
router.post(
  "/",
//   auth("admin", "user", "director", "company", "creator"),
EmailControllers.createEmail
);

router.patch(
  "/:id",
//   auth("admin", "user", "creator", "company", "director"),
EmailControllers.updateEmail
);



export const EmailRoutes = router;
