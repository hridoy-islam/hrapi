/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { PresetTaskControllers } from "./presetTask.controller";

const router = express.Router();

router.get("/", PresetTaskControllers.getAllPresetTask);

router.get("/:id", PresetTaskControllers.getSinglePresetTask);

router.post("/", PresetTaskControllers.createPresetTask);

router.patch("/:id", PresetTaskControllers.updatePresetTask);

router.delete("/:id", PresetTaskControllers.deletePresetTask);

export const PresetTaskRoutes = router;
