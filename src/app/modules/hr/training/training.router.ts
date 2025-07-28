/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { TrainingControllers } from "./training.controller";


const router = express.Router();
router.get(
  "/",
//   auth("admin", "company", "creator", "user", "director"),
  TrainingControllers.getAllTraining
);
router.get(
  "/:id",
//   auth("admin", "user", "director", "company", "creator"),
TrainingControllers.getSingleTraining
);
router.post(
  "/",
//   auth("admin", "user", "director", "company", "creator"),
TrainingControllers.createTraining
);

router.patch(
  "/:id",
//   auth("admin", "user", "creator", "company", "director"),
TrainingControllers.updateTraining
);



export const TrainingRoutes = router;
