/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { CompanyBranchControllers } from "./companyBranch.controller";
import auth from "../../middlewares/auth";


const router = express.Router();
router.get(
  "/",
  auth("admin", "company", "creator", "user", "director"),
  CompanyBranchControllers.getAllCompanyBranch
);
router.get(
  "/:id",
  auth("admin", "user", "director", "company", "creator"),
CompanyBranchControllers.getSingleCompanyBranch
);
router.post(
  "/",
  auth("admin", "user", "director", "company", "creator"),
CompanyBranchControllers.createCompanyBranch
);

router.patch(
  "/:id",
  auth("admin", "user", "creator", "company", "director"),
CompanyBranchControllers.updateCompanyBranch
);

router.delete(
  "/:id",
  auth("admin", "user", "creator", "company", "director"),
  CompanyBranchControllers.deleteCompanyBranch
);



export const CompanyBranchRoutes = router;
