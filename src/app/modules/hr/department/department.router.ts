/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";


import { DepartmentControllers } from "./department.controller";


const router = express.Router();
router.get(
  "/",
//   auth("admin", "company", "creator", "user", "director"),
DepartmentControllers.getAllDepartment
);
// router.get(
//   "/:id",
// //   auth("admin", "user", "director", "company", "creator"),
// NoticeControllers.getSingleNotice
// );
router.post(
  "/",
//   auth("admin", "user", "director", "company", "creator"),
DepartmentControllers.createDepartment
);

router.patch(
  "/:id",
//   auth("admin", "user", "creator", "company", "director"),
DepartmentControllers.updateDepartment
);



export const DepartmentRoutes = router;
