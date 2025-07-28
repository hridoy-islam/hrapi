/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { VacancyControllers } from "./vacancy.controller";


const router = express.Router();

router.get(
  "/",
//   auth("admin", "company", "creator", "user", "director"),
VacancyControllers.getAllVacancy
);


router.get(
  "/:id",
//   auth("admin", "user", "director", "company", "creator"),
VacancyControllers.getSingleVacancy
);


router.post(
  "/",
//   auth("admin", "user", "director", "company", "creator"),
VacancyControllers.createVacancy
);


router.patch(
  "/:id",
//   auth("admin", "user", "creator", "company", "director"),
VacancyControllers.updateVacancy
);



export const VacancyRoutes = router;
