/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { PayrollControllers } from "./payroll.controller";




const router = express.Router();
router.get(
  "/",
//   auth("admin", "company", "creator", "user", "director"),
PayrollControllers.getAllPayroll
);

router.get(
  "/:id",
//   auth("admin", "user", "director", "company", "creator"),
PayrollControllers.getSinglePayroll
);
router.post(
  "/",
//   auth("admin", "user", "director", "company", "creator"),
PayrollControllers.createPayroll
);

router.patch(
  "/:id",
//   auth("admin", "user", "creator", "company", "director"),
PayrollControllers.updatePayroll
);
router.get(
  "/regenerate/:id",
//   auth("admin", "user", "creator", "company", "director"),
PayrollControllers.regeneratePayroll
);





export const PayrollRoutes = router;
