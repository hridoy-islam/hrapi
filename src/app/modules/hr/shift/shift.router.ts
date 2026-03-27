/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { ShiftControllers } from "./shift.controller";
import auth from "../../../middlewares/auth";


const router = express.Router();
router.get(
  "/",
  auth("admin", "company", "creator", "user", "director","companyAdmin"),
  ShiftControllers.getAllShift
);
router.get(
  "/:id",
  auth("admin", "user", "director", "company", "creator","companyAdmin"),
ShiftControllers.getSingleShift
);
router.post(
  "/",
  auth("admin", "user", "director", "company", "creator","companyAdmin"),
ShiftControllers.createShift
);

router.patch(
  "/:id",
  auth("admin", "user", "creator", "company", "director","companyAdmin"),
ShiftControllers.updateShift
);

router.delete(
  "/:id",
  auth("admin", "user", "creator", "company", "director","companyAdmin"),
  ShiftControllers.deleteShift
);



export const ShiftRoutes = router;
