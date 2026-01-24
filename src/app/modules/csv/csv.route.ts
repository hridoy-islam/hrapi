import express from "express";
import { CSVControllers } from "./csv.controller";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";

const router = express.Router();

router.post(
  "/",
  auth("admin", "user","company",),
  CSVControllers.createCSV
);

router.delete(
  "/:id",
  auth("admin", "user","company",),
  CSVControllers.deleteCSV
);

router.patch(
  "/:id",
  auth("admin", "user","company",),
  CSVControllers.updateCSV
);

router.get(
  "/",
  auth("admin", "user","company",),
  CSVControllers.getAllCSVs
);

router.get(
  "/company/:id",
  auth("admin", "user","company",),
  CSVControllers.getAllCompanyCSVs
);

router.get(
  "/:id",
  auth("admin", "user","company",),
  CSVControllers.getOneCSV
);

export const CSVRouter = router;
