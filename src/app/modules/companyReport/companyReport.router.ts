/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { CompanyReportControllers } from "./companyReport.controller";
import auth from "../../middlewares/auth";


const router = express.Router();
router.get(
  "/",
  auth("admin", "company"),
  CompanyReportControllers.getAllCompanyReport
);
router.get(
  "/:id",
  auth("admin", "company"),
CompanyReportControllers.getSingleCompanyReport
);
router.post(
  "/",
  auth("admin"),
CompanyReportControllers.createCompanyReport
);

router.patch(
  "/:id",
  auth("admin"),
CompanyReportControllers.updateCompanyReport
);

router.delete(
  "/:id",
  auth("admin"),
  CompanyReportControllers.deleteCompanyReport
);



export const CompanyReportRoutes = router;
