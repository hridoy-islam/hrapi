/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/multer";
import { SupervisionControllers } from "./supervision.controller";

const router = express.Router();
router.get(
  "/",
  SupervisionControllers.getAllSupervision
);
router.post(
  "/",
  SupervisionControllers.createSupervision
);
router.get(
  "/:id",
  SupervisionControllers.getSingleSupervision
);

router.patch(
  "/:id",
  SupervisionControllers.updateSupervision
);

router.patch(
  "/:id/logs/:logId",
  // auth("admin", "user", "creator", "company", "director"), // Uncomment when ready to secure endpoints
  SupervisionControllers.updateSupervisionLog
);


export const SupervisionRoutes = router;
