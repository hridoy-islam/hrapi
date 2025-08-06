/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { RightToWorkControllers } from "./rightToWork.controller";


const router = express.Router();

router.get(
  "/",
//   auth("admin", "company", "creator", "user", "director"),
RightToWorkControllers.getAllRightToWork
);


router.get(
  "/:id",
//   auth("admin", "user", "director", "company", "creator"),
RightToWorkControllers.getSingleRightToWork
);


router.post(
  "/",
//   auth("admin", "user", "director", "company", "creator"),
RightToWorkControllers.createRightToWork
);


router.patch(
  "/:id",
//   auth("admin", "user", "creator", "company", "director"),
RightToWorkControllers.updateRightToWork
);



export const RightToWorkRoutes = router;
