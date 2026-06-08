/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/multer";
import { DbsFormControllers } from "./dbsForm.controller";

const router = express.Router();
router.get(
  "/",
  DbsFormControllers.getAllDbsForm
);
router.post(
  "/",
  DbsFormControllers.createDbsForm
);
router.get(
  "/:id",
  DbsFormControllers.getSingleDbsForm
);

router.patch(
  "/:id",
  DbsFormControllers.updateDbsForm
);

router.patch(
  "/:id/logs/:logId",
  // auth("admin", "user", "creator", "company", "director"), // Uncomment when adding middleware
  DbsFormControllers.updateDbsFormLog
);

export const DbsFormRoutes = router;
