import express from "express";
import { KitchenAccessControllers } from "./kitchenAccess.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get(
  "/",
  auth("admin", "company", "companyAdmin"),
  KitchenAccessControllers.getCompanyAccess
);

router.get(
  "/staff-access",
  auth("admin", "company", "companyAdmin", "employee"),
  KitchenAccessControllers.getStaffAccess
);

router.patch(
  "/employees",
  auth("admin", "company", "companyAdmin"),
  KitchenAccessControllers.assignEmployees
);

router.delete(
  "/:companyId/employees/:employeeId",
  auth("admin", "company", "companyAdmin"),
  KitchenAccessControllers.removeEmployee
);

export const KitchenAccessRoutes = router;
