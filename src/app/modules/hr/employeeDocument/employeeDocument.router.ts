/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { EmployeeDocumentControllers } from "./employeeDocument.controller";
import auth from "../../../middlewares/auth";


const router = express.Router();
router.get(
  "/",
  auth("admin", "company"),
  EmployeeDocumentControllers.getAllEmployeeDocument
);
router.get(
  "/:id",
  auth("admin", "company"),
EmployeeDocumentControllers.getSingleEmployeeDocument
);
router.get(
  "/status/:id",
  auth("admin", "company"),
  EmployeeDocumentControllers.getEmployeeComplianceStatus,
);
router.post(
  "/",
  auth("admin", "company"),
EmployeeDocumentControllers.createEmployeeDocument
);

router.patch(
  "/:id",
  auth("admin", "company"),
EmployeeDocumentControllers.updateEmployeeDocument
);

router.delete(
  "/:id",
  auth("admin", "company"),
  EmployeeDocumentControllers.deleteEmployeeDocument
);



export const EmployeeDocumentRoutes = router;
