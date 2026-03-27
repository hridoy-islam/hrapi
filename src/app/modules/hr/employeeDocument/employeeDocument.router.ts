/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { EmployeeDocumentControllers } from "./employeeDocument.controller";
import auth from "../../../middlewares/auth";


const router = express.Router();
router.get(
  "/",
  auth("admin", "company","companyAdmin"),
  EmployeeDocumentControllers.getAllEmployeeDocument
);
router.get(
  "/:id",
  auth("admin", "company","companyAdmin"),
EmployeeDocumentControllers.getSingleEmployeeDocument
);
router.get(
  "/status/:id",
  auth("admin", "company","companyAdmin"),
  EmployeeDocumentControllers.getEmployeeComplianceStatus,
);
router.post(
  "/",
  auth("admin", "company","companyAdmin"),
EmployeeDocumentControllers.createEmployeeDocument
);

router.patch(
  "/:id",
  auth("admin", "company","companyAdmin"),
EmployeeDocumentControllers.updateEmployeeDocument
);

router.delete(
  "/:id",
  auth("admin", "company","companyAdmin"),
  EmployeeDocumentControllers.deleteEmployeeDocument
);



export const EmployeeDocumentRoutes = router;
