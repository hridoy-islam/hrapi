/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/multer";
import { SpotCheckControllers } from "./spotCheck.controller";

const router = express.Router();
router.get(
  "/",
  SpotCheckControllers.getAllSpotCheck
);
router.post(
  "/",
  SpotCheckControllers.createSpotCheck
);
router.get(
  "/:id",
  SpotCheckControllers.getSingleSpotCheck
);

router.patch(
  "/:id",
  SpotCheckControllers.updateSpotCheck
);


export const SpotCheckRoutes = router;
