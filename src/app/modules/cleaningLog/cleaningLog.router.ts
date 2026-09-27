import express from "express";
import { CleaningLogControllers } from "./cleaningLog.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get(
  "/",
  auth("admin", "company", "companyAdmin", "employee"),
  CleaningLogControllers.getAllCleaningLog
);

router.get(
  "/:id",
  auth("admin", "company", "companyAdmin", "employee"),
  CleaningLogControllers.getSingleCleaningLog
);

router.post(
  "/",
  auth("admin", "company", "companyAdmin", "employee"),
  CleaningLogControllers.createCleaningLog
);

// Editing and deleting a signed log stays with the company side
router.patch(
  "/:id",
  auth("admin", "company", "companyAdmin"),
  CleaningLogControllers.updateCleaningLog
);

router.delete(
  "/:id",
  auth("admin", "company", "companyAdmin"),
  CleaningLogControllers.deleteCleaningLog
);

export const CleaningLogRoutes = router;
