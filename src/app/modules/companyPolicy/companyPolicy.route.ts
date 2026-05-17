/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/multer";
import { CompanyPolicyControllers } from "./companyPolicy.controller";

const router = express.Router();
router.get(
  "/",
  CompanyPolicyControllers.getAllCompanyPolicy
);
router.post(
  "/",
  CompanyPolicyControllers.createCompanyPolicy
);
router.get(
  "/:id",
  CompanyPolicyControllers.getSingleCompanyPolicy
);

router.patch(
  "/:id",
  CompanyPolicyControllers.updateCompanyPolicy
);
router.delete(
  "/:id",
  CompanyPolicyControllers.deleteCompanyPolicy
);


export const CompanyPolicyRoutes = router;
