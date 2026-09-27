import express from "express";
import { CleaningElementControllers } from "./cleaningElement.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get(
  "/",
  auth("admin", "company", "companyAdmin", "employee"),
  CleaningElementControllers.getAllCleaningElement
);

router.post(
  "/",
  auth("admin", "company", "companyAdmin"),
  CleaningElementControllers.createCleaningElement
);

router.patch(
  "/:id",
  auth("admin", "company", "companyAdmin"),
  CleaningElementControllers.updateCleaningElement
);

router.delete(
  "/:id",
  auth("admin", "company", "companyAdmin"),
  CleaningElementControllers.deleteCleaningElement
);

export const CleaningElementRoutes = router;
