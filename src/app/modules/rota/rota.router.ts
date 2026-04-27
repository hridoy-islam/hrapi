/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { RotaControllers } from "./rota.controller";
import auth from "../../middlewares/auth";


const router = express.Router();
router.get(
  "/",
  auth("admin", "company", "creator", "user", "director","employee","companyAdmin"),
  RotaControllers.getAllRota
);
router.get(
  "/upcoming-rota",
  auth("admin", "user", "director", "company", "creator","employee","companyAdmin"),
  RotaControllers.getUpcomingRota
);
router.get(
  "/missed-attendance",
  auth("admin", "user", "director", "company", "creator","employee","companyAdmin"),
  RotaControllers.getAllMissedRota
);
router.get(
  "/:id",
  auth("admin", "user", "director", "company", "creator","employee","companyAdmin"),
RotaControllers.getSingleRota
);
router.post(
  "/",
  auth("admin", "user", "director", "company", "creator","companyAdmin"),
RotaControllers.createRota
);

router.patch(
  "/:id",
  auth("admin", "user", "creator", "company", "director","companyAdmin"),
RotaControllers.updateRota
);

router.delete(
  "/:id",
  auth("admin", "user", "creator", "company", "director","companyAdmin"),
  RotaControllers.deleteRota
);

router.post(
  "/bulk-assign",
  auth("admin", "user", "director", "company", "creator","companyAdmin"),
  RotaControllers.bulkAssignRota
);


router.post(
  "/copy",
  auth("admin", "user", "director", "company", "creator","companyAdmin"),
  RotaControllers.copyRota
);

router.post(
  "/attendance",
  // auth("admin", "user", "director", "company", "creator"),
  RotaControllers.getAttendance,
);

export const RotaRoutes = router;
