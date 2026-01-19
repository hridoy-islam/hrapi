/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { ImmigrationStatusControllers } from "./immigrationStatus.controller";


const router = express.Router();

router.get(
  "/",
//   auth("admin", "company", "creator", "user", "director"),
ImmigrationStatusControllers.getAllImmigrationStatus
);


router.get(
  "/:id",
//   auth("admin", "user", "director", "company", "creator"),
ImmigrationStatusControllers.getSingleImmigrationStatus
);


router.post(
  "/",
//   auth("admin", "user", "director", "company", "creator"),
ImmigrationStatusControllers.createImmigrationStatus
);


router.patch(
  "/:id",
//   auth("admin", "user", "creator", "company", "director"),
ImmigrationStatusControllers.updateImmigrationStatus
);



export const ImmigrationStatusRoutes = router;
