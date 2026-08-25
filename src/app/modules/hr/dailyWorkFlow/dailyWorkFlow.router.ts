/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { DailyWorkFlowControllers } from "./dailyWorkFlow.controller";

const router = express.Router();

router.get("/", DailyWorkFlowControllers.getAllDailyWorkFlow);

router.get("/:id", DailyWorkFlowControllers.getSingleDailyWorkFlow);

router.post("/", DailyWorkFlowControllers.createDailyWorkFlow);

router.patch("/:id", DailyWorkFlowControllers.updateDailyWorkFlow);

router.delete("/:id", DailyWorkFlowControllers.deleteDailyWorkFlow);

export const DailyWorkFlowRoutes = router;
