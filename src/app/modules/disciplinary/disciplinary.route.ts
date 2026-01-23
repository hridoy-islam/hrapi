/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/multer";
import { DisciplinaryControllers } from "./disciplinary.controller";

const router = express.Router();
router.get(
  "/",
  DisciplinaryControllers.getAllDisciplinary
);
router.post(
  "/",
  DisciplinaryControllers.createDisciplinary
);
router.get(
  "/:id",
  DisciplinaryControllers.getSingleDisciplinary
);

router.patch(
  "/:id",
  DisciplinaryControllers.updateDisciplinary
);


export const DisciplinaryRoutes = router;
