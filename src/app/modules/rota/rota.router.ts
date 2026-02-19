/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { RotaControllers } from "./rota.controller";
import auth from "../../middlewares/auth";


const router = express.Router();
router.get(
  "/",
  auth("admin", "company", "creator", "user", "director"),
  RotaControllers.getAllRota
);
router.get(
  "/:id",
  auth("admin", "user", "director", "company", "creator"),
RotaControllers.getSingleRota
);
router.post(
  "/",
  auth("admin", "user", "director", "company", "creator"),
RotaControllers.createRota
);

router.patch(
  "/:id",
  auth("admin", "user", "creator", "company", "director"),
RotaControllers.updateRota
);

router.delete(
  "/:id",
  auth("admin", "user", "creator", "company", "director"),
  RotaControllers.deleteRota
);

router.post(
  "/bulk-assign",
  auth("admin", "user", "director", "company", "creator"),
  RotaControllers.bulkAssignRota
);

router.post(
  "/copy",
  auth("admin", "user", "director", "company", "creator"),
  RotaControllers.copyRota
);

export const RotaRoutes = router;
