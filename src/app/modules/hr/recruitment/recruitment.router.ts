/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { RecruitmentControllers } from "./recruitment.controller";


const router = express.Router();
router.get(
  "/",
//   auth("admin", "company", "creator", "user", "director"),
  RecruitmentControllers.getAllRecruitment
);
router.get(
  "/:id",
//   auth("admin", "user", "director", "company", "creator"),
RecruitmentControllers.getSingleRecruitment
);
router.post(
  "/",
//   auth("admin", "user", "director", "company", "creator"),
RecruitmentControllers.createRecruitment
);

router.patch(
  "/:id",
//   auth("admin", "user", "creator", "company", "director"),
RecruitmentControllers.updateRecruitment
);



export const RecruitmentRoutes = router;
