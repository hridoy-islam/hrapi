import express from "express";
import { CleaningLogControllers } from "./cleaningLog.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

const everyone = auth("admin", "company", "companyAdmin", "employee");
const companySide = auth("admin", "company", "companyAdmin");

router.get("/", everyone, CleaningLogControllers.getAllCleaningLog);

// Fixed paths sit above "/:id" so they are not read as an id
router.get("/active", everyone, CleaningLogControllers.getActiveCleaningLogs);
router.get("/report", companySide, CleaningLogControllers.getCleaningReport);

router.get("/:id", everyone, CleaningLogControllers.getSingleCleaningLog);

// The company side records a finished log in one go, times typed in
router.post("/", companySide, CleaningLogControllers.createCleaningLog);

// An employee's log is a session: start -> pause / resume -> stop -> complete
router.post("/start", everyone, CleaningLogControllers.startCleaningLog);
router.patch("/:id/pause", everyone, CleaningLogControllers.pauseCleaningLog);
router.patch("/:id/resume", everyone, CleaningLogControllers.resumeCleaningLog);
router.patch("/:id/stop", everyone, CleaningLogControllers.stopCleaningLog);
router.patch(
  "/:id/complete",
  everyone,
  CleaningLogControllers.completeCleaningLog
);
// Ticks saved as they are made during a session
router.patch(
  "/:id/items",
  everyone,
  CleaningLogControllers.updateCleaningLogItems
);
router.delete(
  "/:id/discard",
  everyone,
  CleaningLogControllers.discardCleaningLog
);

// Editing and deleting a signed log stays with the company side
router.patch("/:id", companySide, CleaningLogControllers.updateCleaningLog);
router.delete("/:id", companySide, CleaningLogControllers.deleteCleaningLog);

export const CleaningLogRoutes = router;
