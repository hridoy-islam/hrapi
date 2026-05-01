











/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { LeaverControllers } from "./leaver.controller";
import auth from "../../../middlewares/auth";


const router = express.Router();
router.get(
  "/",
  auth("admin", "company"),
  LeaverControllers.getAllLeaver
);
router.get(
  "/:id",
  auth("admin", "company"),
LeaverControllers.getSingleLeaver
);
router.post(
  "/",
  auth("admin", "company"),
LeaverControllers.createLeaver
);

router.patch(
  "/:id",
  auth("admin", "company"),
LeaverControllers.updateLeaver
);
router.delete(
  "/:id",
  auth("admin", "company"),
LeaverControllers.deleteSingleLeaver
);



export const LeaverRoutes = router;
