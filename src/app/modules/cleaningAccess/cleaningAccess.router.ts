import express from "express";
import { CleaningAccessControllers } from "./cleaningAccess.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get(
  "/",
  auth("admin", "company", "companyAdmin"),
  CleaningAccessControllers.getCompanyAccess
);

router.get(
  "/staff-access",
  auth("admin", "company", "companyAdmin", "employee"),
  CleaningAccessControllers.getStaffAccess
);

router.patch(
  "/employees",
  auth("admin", "company", "companyAdmin"),
  CleaningAccessControllers.assignEmployees
);

router.delete(
  "/:companyId/employees/:employeeId",
  auth("admin", "company", "companyAdmin"),
  CleaningAccessControllers.removeEmployee
);

export const CleaningAccessRoutes = router;
