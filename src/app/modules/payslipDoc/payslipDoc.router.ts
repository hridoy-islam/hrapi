/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { PayslipDocControllers } from "./payslipDoc.controller";
import auth from "../../middlewares/auth";


const router = express.Router();
router.get(
  "/",
  auth("admin", "company","companyAdmin"),
  PayslipDocControllers.getAllPayslipDoc
);
router.get(
  "/:id",
  auth("admin", "company","companyAdmin"),
PayslipDocControllers.getSinglePayslipDoc
);

router.post(
  "/",
  auth("admin", "company","companyAdmin"),
PayslipDocControllers.createPayslipDoc
);

router.post(
  "/copy/:id",
  auth("admin", "company","companyAdmin"),
  PayslipDocControllers.copyPayslipDoc
);

router.patch(
  "/move/:id",
  auth("admin", "company","companyAdmin"),
  PayslipDocControllers.movePayslipDoc
);

router.patch(
  "/:id",
  auth("admin", "company","companyAdmin"),
PayslipDocControllers.updatePayslipDoc
);

router.delete(
  "/:id",
  auth("admin", "company","companyAdmin"),
  PayslipDocControllers.deletePayslipDoc
);



export const PayslipDocRoutes = router;
