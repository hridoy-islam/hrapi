import express from "express";
import { CleaningAreaControllers } from "./cleaningArea.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get(
  "/",
  auth("admin", "company", "companyAdmin", "employee"),
  CleaningAreaControllers.getAllCleaningArea
);

router.get(
  "/:id",
  auth("admin", "company", "companyAdmin", "employee"),
  CleaningAreaControllers.getSingleCleaningArea
);

router.post(
  "/",
  auth("admin", "company", "companyAdmin"),
  CleaningAreaControllers.createCleaningArea
);

router.patch(
  "/:id",
  auth("admin", "company", "companyAdmin"),
  CleaningAreaControllers.updateCleaningArea
);

router.delete(
  "/:id",
  auth("admin", "company", "companyAdmin"),
  CleaningAreaControllers.deleteCleaningArea
);

export const CleaningAreaRoutes = router;
