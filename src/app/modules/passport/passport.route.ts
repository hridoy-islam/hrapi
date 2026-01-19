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


export const PassportRoutes = router;
