/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { HolidayControllers } from "../holidays/holiday.controller";



const router = express.Router();
router.get(
  "/",
//   auth("admin", "company", "creator", "user", "director"),
  HolidayControllers.getAllHoliday
);
router.get(
  "/:id",
//   auth("admin", "user", "director", "company", "creator"),
HolidayControllers.getSingleHoliday
);
router.post(
  "/",
//   auth("admin", "user", "director", "company", "creator"),
HolidayControllers.createHoliday
);

router.patch(
  "/:id",
//   auth("admin", "user", "creator", "company", "director"),
HolidayControllers.updateHoliday
);



export const HolidayRoutes = router;
