/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { LeaveControllers } from "./leave.controller";



const router = express.Router();
router.get(
  "/",
//   auth("admin", "company", "creator", "user", "director"),
  LeaveControllers.getAllLeave
);
router.get(
  "/:id",
//   auth("admin", "user", "director", "company", "creator"),
LeaveControllers.getSingleLeave
);
router.post(
  "/",
//   auth("admin", "user", "director", "company", "creator"),
LeaveControllers.createLeave
);

router.patch(
  "/:id",
//   auth("admin", "user", "creator", "company", "director"),
LeaveControllers.updateLeave
);



export const LeaveRoutes = router;
