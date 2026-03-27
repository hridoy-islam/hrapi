/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { CompanyBranchControllers } from "./companyBranch.controller";
import auth from "../../middlewares/auth";


const router = express.Router();
router.get(
  "/",
  auth("admin", "company", "creator", "user", "director","companyAdmin"),
  CompanyBranchControllers.getAllCompanyBranch
);
router.get(
  "/:id",
  auth("admin", "user", "director", "company", "creator","companyAdmin"),
CompanyBranchControllers.getSingleCompanyBranch
);
router.post(
  "/",
  auth("admin", "user", "director", "company", "creator","companyAdmin"),
CompanyBranchControllers.createCompanyBranch
);

router.patch(
  "/:id",
  auth("admin", "user", "creator", "company", "director","companyAdmin"),
CompanyBranchControllers.updateCompanyBranch
);

router.delete(
  "/:id",
  auth("admin", "user", "creator", "company", "director","companyAdmin"),
  CompanyBranchControllers.deleteCompanyBranch
);



export const CompanyBranchRoutes = router;
