/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/multer";
import { QACheckControllers } from "./QACheck.controller";

const router = express.Router();
router.get(
  "/",
  QACheckControllers.getAllQACheck
);
router.post(
  "/",
  QACheckControllers.createQACheck
);
router.get(
  "/:id",
  QACheckControllers.getSingleQACheck
);

router.patch(
  "/:id",
  QACheckControllers.updateQACheck
);


export const QACheckRoutes = router;
