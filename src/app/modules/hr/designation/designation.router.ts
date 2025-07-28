/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { DesignationControllers } from "./designation.controller";


const router = express.Router();
router.get(
  "/",
//   auth("admin", "company", "creator", "user", "director"),
  DesignationControllers.getAllDesignation
);
router.get(
  "/:id",
//   auth("admin", "user", "director", "company", "creator"),
DesignationControllers.getSingleDesignation
);
router.post(
  "/",
//   auth("admin", "user", "director", "company", "creator"),
DesignationControllers.createDesignation
);

router.patch(
  "/:id",
//   auth("admin", "user", "creator", "company", "director"),
DesignationControllers.updateDesignation
);



export const DesignationRoutes = router;
