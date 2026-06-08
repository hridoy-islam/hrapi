/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/multer";
import { InductionControllers } from "./induction.controller";

const router = express.Router();
router.get(
  "/",
  InductionControllers.getAllInduction
);
router.post(
  "/",
  InductionControllers.createInduction
);
router.get(
  "/:id",
  InductionControllers.getSingleInduction
);

router.patch(
  "/:id",
  InductionControllers.updateInduction
);

router.patch(
  "/:id/logs/:logId",
  // auth("admin", "user", "creator", "company", "director"), // Uncomment when you apply authentication middleware
  InductionControllers.updateInductionLog
);


export const InductionRoutes = router;
