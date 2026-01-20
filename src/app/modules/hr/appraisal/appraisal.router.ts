/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { AppraisalControllers } from "./appraisal.controller";


const router = express.Router();

router.get(
  "/",
//   auth("admin", "company", "creator", "user", "director"),
AppraisalControllers.getAllAppraisal
);


router.get(
  "/:id",
//   auth("admin", "user", "director", "company", "creator"),
AppraisalControllers.getSingleAppraisal
);


router.post(
  "/",
//   auth("admin", "user", "director", "company", "creator"),
AppraisalControllers.createAppraisal
);


router.patch(
  "/:id",
//   auth("admin", "user", "creator", "company", "director"),
AppraisalControllers.updateAppraisal
);



export const AppraisalRoutes = router;
