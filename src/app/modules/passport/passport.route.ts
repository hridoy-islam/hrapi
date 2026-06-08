/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/multer";
import { PassportControllers } from "./passport.controller";

const router = express.Router();
router.get(
  "/",
  PassportControllers.getAllPassport
);
router.post(
  "/",
  PassportControllers.createPassport
);
router.get(
  "/:id",
  PassportControllers.getSinglePassport
);

router.patch(
  "/:id",
  PassportControllers.updatePassport
);

router.patch(
  "/:id/logs/:logId",
  // auth("admin", "user", "creator", "company", "director"), // Uncomment when ready for auth
  PassportControllers.updatePassportLog
);


export const PassportRoutes = router;
