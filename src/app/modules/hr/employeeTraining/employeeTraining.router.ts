/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { EmployeeTrainingControllers } from "./employeeTraining.controller";


const router = express.Router();

router.get(
  "/",
//   auth("admin", "company", "creator", "user", "director"),
EmployeeTrainingControllers.getAllEmployeeTraining
);


router.get(
  "/:id",
//   auth("admin", "user", "director", "company", "creator"),
EmployeeTrainingControllers.getSingleEmployeeTraining
);


router.post(
  "/",
//   auth("admin", "user", "director", "company", "creator"),
EmployeeTrainingControllers.createEmployeeTraining
);


router.patch(
  "/:id",
//   auth("admin", "user", "creator", "company", "director"),
EmployeeTrainingControllers.updateEmployeeTraining
);



export const EmployeeTrainingRoutes = router;
