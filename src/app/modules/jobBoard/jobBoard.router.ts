/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { JobBoardControllers } from "./jobBoard.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get(
  "/",
  auth("admin", "company", "companyAdmin", "employee"),
  JobBoardControllers.getAllJobBoard
);

// Declared before "/:id", so the path is not read as a board id
router.get(
  "/staff-access",
  auth("admin", "company", "companyAdmin", "employee"),
  JobBoardControllers.getStaffJobBoardAccess
);

router.get(
  "/:id",
  auth("admin", "company", "companyAdmin", "employee"),
  JobBoardControllers.getSingleJobBoard
);

router.post(
  "/",
  auth("admin", "company", "companyAdmin"),
  JobBoardControllers.createJobBoard
);

router.patch(
  "/:id",
  auth("admin", "company", "companyAdmin"),
  JobBoardControllers.updateJobBoard
);

router.patch(
  "/:id/employees",
  auth("admin", "company", "companyAdmin"),
  JobBoardControllers.assignEmployees
);

router.delete(
  "/:id/employees/:employeeId",
  auth("admin", "company", "companyAdmin"),
  JobBoardControllers.removeEmployee
);

router.delete(
  "/:id",
  auth("admin", "company", "companyAdmin"),
  JobBoardControllers.deleteJobBoard
);

export const JobBoardRoutes = router;
