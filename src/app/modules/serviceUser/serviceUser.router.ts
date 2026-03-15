/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";


import { ServiceUserControllers } from "./serviceUser.controller";


const router = express.Router();
router.get(
  "/",
//   auth("admin", "company", "creator", "user", "director"),
ServiceUserControllers.getAllServiceUser
);

router.post(
  "/",
//   auth("admin", "user", "director", "company", "creator"),
ServiceUserControllers.createServiceUser
);

router.patch(
  "/:id",
//   auth("admin", "user", "creator", "company", "director"),
ServiceUserControllers.updateServiceUser
);



export const ServiceUserRoutes = router;
