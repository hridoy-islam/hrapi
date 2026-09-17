/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { JobBoardTaskControllers } from "./jobBoardTask.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get(
  "/",
  auth("admin", "company", "companyAdmin", "employee"),
  JobBoardTaskControllers.getAllJobBoardTask
);

router.get(
  "/:id",
  auth("admin", "company", "companyAdmin", "employee"),
  JobBoardTaskControllers.getSingleJobBoardTask
);

router.post(
  "/",
  auth("admin", "company", "companyAdmin", "employee"),
  JobBoardTaskControllers.createJobBoardTask
);

router.patch(
  "/:id",
  auth("admin", "company", "companyAdmin", "employee"),
  JobBoardTaskControllers.updateJobBoardTask
);

router.delete(
  "/:id",
  auth("admin", "company", "companyAdmin"),
  JobBoardTaskControllers.deleteJobBoardTask
);

export const JobBoardTaskRoutes = router;
