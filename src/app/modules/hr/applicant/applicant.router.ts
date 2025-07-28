/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";


import { ApplicantControllers } from "./applicant.controller";


const router = express.Router();
router.get(
  "/",
//   auth("admin", "company", "creator", "user", "director"),
ApplicantControllers.getAllApplicant
);
router.get(
  "/:id",
//   auth("admin", "user", "director", "company", "creator"),
ApplicantControllers.getSingleApplicant
);
router.post(
  "/",
//   auth("admin", "user", "director", "company", "creator"),
ApplicantControllers.createApplicant
);

router.patch(
  "/:id",
//   auth("admin", "user", "creator", "company", "director"),
ApplicantControllers.updateApplicant
);



export const ApplicantRoutes = router;
