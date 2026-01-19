/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { VisaCheckControllers } from "./visaCheck.controller";


const router = express.Router();

router.get(
  "/",
//   auth("admin", "company", "creator", "user", "director"),
VisaCheckControllers.getAllVisaCheck
);


router.get(
  "/:id",
//   auth("admin", "user", "director", "company", "creator"),
VisaCheckControllers.getSingleVisaCheck
);


router.post(
  "/",
//   auth("admin", "user", "director", "company", "creator"),
VisaCheckControllers.createVisaCheck
);


router.patch(
  "/:id",
//   auth("admin", "user", "creator", "company", "director"),
VisaCheckControllers.updateVisaCheck
);



export const VisaCheckRoutes = router;
