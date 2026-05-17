/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/multer";
import { HealthAndSafetyControllers } from "./healthAndSafety.controller";

const router = express.Router();
router.get(
  "/",
  HealthAndSafetyControllers.getAllHealthAndSafety
);
router.post(
  "/",
  HealthAndSafetyControllers.createHealthAndSafety
);
router.get(
  "/:id",
  HealthAndSafetyControllers.getSingleHealthAndSafety
);

router.patch(
  "/:id",
  HealthAndSafetyControllers.updateHealthAndSafety
);
router.delete(
  "/:id",
  HealthAndSafetyControllers.deleteHealthAndSafety
);


export const HealthAndSafetyRoutes = router;
