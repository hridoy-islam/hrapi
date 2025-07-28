/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { ShiftControllers } from "./shift.controller";
import auth from "../../../middlewares/auth";


const router = express.Router();
router.get(
  "/",
  auth("admin", "company", "creator", "user", "director"),
  ShiftControllers.getAllShift
);
router.get(
  "/:id",
  auth("admin", "user", "director", "company", "creator"),
ShiftControllers.getSingleShift
);
router.post(
  "/",
  auth("admin", "user", "director", "company", "creator"),
ShiftControllers.createShift
);

router.patch(
  "/:id",
  auth("admin", "user", "creator", "company", "director"),
ShiftControllers.updateShift
);

router.delete(
  "/:id",
  auth("admin", "user", "creator", "company", "director"),
  ShiftControllers.deleteShift
);



export const ShiftRoutes = router;
