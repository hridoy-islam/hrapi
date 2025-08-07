/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { BankHolidayControllers } from "./bank-holiday.controller";


const router = express.Router();
router.get(
  "/",
//   auth("admin", "company", "creator", "user", "director"),
  BankHolidayControllers.getAllBankHoliday
);
router.get(
  "/:id",
//   auth("admin", "user", "director", "company", "creator"),
BankHolidayControllers.getSingleBankHoliday
);
router.post(
  "/",
//   auth("admin", "user", "director", "company", "creator"),
BankHolidayControllers.createBankHoliday
);

router.patch(
  "/:id",
//   auth("admin", "user", "creator", "company", "director"),
BankHolidayControllers.updateBankHoliday
);
router.delete(
  "/:id",
//   auth("admin", "user", "creator", "company", "director"),
BankHolidayControllers.deleteBankHoliday
);



export const BankHolidayRoutes = router;
