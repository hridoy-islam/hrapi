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


export const SupervisionRoutes = router;
