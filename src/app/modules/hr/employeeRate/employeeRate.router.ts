/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { EmployeeRateControllers } from "./employeeRate.controller";
import auth from "../../../middlewares/auth";


const router = express.Router();
router.get(
  "/",
  auth("admin", "company", "creator", "user", "director","companyAdmin"),
  EmployeeRateControllers.getAllEmployeeRate
);
router.get(
  "/:id",
  auth("admin", "user", "director", "company", "creator","companyAdmin"),
EmployeeRateControllers.getSingleEmployeeRate
);
router.post(
  "/",
  auth("admin", "user", "director", "company", "creator","companyAdmin"),
EmployeeRateControllers.createEmployeeRate
);

router.patch(
  "/:id",
  auth("admin", "user", "creator", "company", "director","companyAdmin"),
EmployeeRateControllers.updateEmployeeRate
);

router.delete(
  "/:id",
  auth("admin", "user", "creator", "company", "director","companyAdmin"),
  EmployeeRateControllers.deleteEmployeeRate
);



export const EmployeeRateRoutes = router;
