/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/multer";
import { AppraisalControllers } from "./appraisal.controller";

const router = express.Router();
router.get(
  "/",
  AppraisalControllers.getAllAppraisal
);
router.post(
  "/",
  AppraisalControllers.createAppraisal
);
router.get(
  "/:id",
  AppraisalControllers.getSingleAppraisal
);

router.patch(
  "/:id",
  AppraisalControllers.updateAppraisal
);


export const AppraisalRoutes = router;
