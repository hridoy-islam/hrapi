/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { RotaControllers } from "./plannedRota.controller";
import auth from "../../middlewares/auth";


const router = express.Router();
router.get(
  "/",
  auth("admin", "company", "creator", "user", "director","employee","companyAdmin"),
  RotaControllers.getAllPlannedRota
);
router.get(
  "/upcoming-rota",
  auth("admin", "user", "director", "company", "creator","employee","companyAdmin"),
  RotaControllers.getUpcomingPlannedRota
);
router.get(
  "/missed-attendance",
  auth("admin", "user", "director", "company", "creator","employee","companyAdmin"),
  RotaControllers.getAllMissePlannedRota
);
router.get(
  "/:id",
  auth("admin", "user", "director", "company", "creator","employee","companyAdmin"),
RotaControllers.getSinglePlannedRota
);
router.post(
  "/",
  auth("admin", "user", "director", "company", "creator","companyAdmin"),
RotaControllers.createPlannedRota
);

router.patch(
  "/:id",
  auth("admin", "user", "creator", "company", "director","companyAdmin"),
RotaControllers.updatePlannedRota
);

router.delete(
  "/:id",
  auth("admin", "user", "creator", "company", "director","companyAdmin"),
  RotaControllers.deletePlannedRota
);

router.post(
  "/bulk-assign",
  auth("admin", "user", "director", "company", "creator","companyAdmin"),
  RotaControllers.bulkAssignPlannedRota
);


router.post(
  "/copy",
  auth("admin", "user", "director", "company", "creator","companyAdmin"),
  RotaControllers.copyPlannedRota
);

router.post(
  "/attendance",
  // auth("admin", "user", "director", "company", "creator"),
  RotaControllers.getAttendance,
);

export const PlannedRotaRoutes = router;
