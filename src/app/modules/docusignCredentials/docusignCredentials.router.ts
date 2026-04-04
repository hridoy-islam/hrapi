/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";


import { DocusignCredentialsControllers } from "./docusignCredentials.controller";


const router = express.Router();
router.get(
  "/",
//   auth("admin", "company", "creator", "user", "director"),
DocusignCredentialsControllers.getAllDocusignCredentials
);
// router.get(
//   "/:id",
// //   auth("admin", "user", "director", "company", "creator"),
// NoticeControllers.getSingleNotice
// );
router.post(
  "/",
//   auth("admin", "user", "director", "company", "creator"),
DocusignCredentialsControllers.createDocusignCredentials
);

router.patch(
  "/:id",
//   auth("admin", "user", "creator", "company", "director"),
DocusignCredentialsControllers.updateDocusignCredentials
);



export const DocusignCredentialsRoutes = router;
