/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { ManageEmployeeControllers } from "./manageEmployee.controller";

const router = express.Router();

router.get("/", ManageEmployeeControllers.getAllCompanyDailyWorkFlowAccess);

router.get(
  "/company/:companyId",
  ManageEmployeeControllers.getCompanyDailyWorkFlowAccessByCompany
);

router.get("/:id", ManageEmployeeControllers.getSingleCompanyDailyWorkFlowAccess);

router.post("/", ManageEmployeeControllers.createCompanyDailyWorkFlowAccess);

router.patch(
  "/company/:companyId",
  ManageEmployeeControllers.upsertCompanyDailyWorkFlowAccessByCompany
);

router.patch("/:id", ManageEmployeeControllers.updateCompanyDailyWorkFlowAccess);

router.delete(
  "/:id",
  ManageEmployeeControllers.deleteCompanyDailyWorkFlowAccess
);

export const ManageEmployeeRoutes = router;
