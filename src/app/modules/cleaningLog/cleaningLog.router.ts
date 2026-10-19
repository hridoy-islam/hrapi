import express from "express";
import { CleaningLogControllers } from "./cleaningLog.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

const everyone = auth("admin", "company", "companyAdmin", "employee");
const companySide = auth("admin", "company", "companyAdmin");
const employeeOnly = auth("employee");

router.get("/", everyone, CleaningLogControllers.getAllCleaningLog);

// Fixed paths sit above "/:id" so they are not read as an id
router.get("/active", everyone, CleaningLogControllers.getActiveCleaningLogs);
router.get("/report", companySide, CleaningLogControllers.getCleaningReport);

router.get("/:id", everyone, CleaningLogControllers.getSingleCleaningLog);

// A finished log recorded in one go, times typed in. An employee files only
// for themselves.
router.post("/", everyone, CleaningLogControllers.createCleaningLog);

// An employee's log can also be a session: start (timer optional) ->
// pause / resume -> stop -> complete. Only the employee runs it; the company
// side has no pause or timer and only completes or clears a session.
router.post("/start", employeeOnly, CleaningLogControllers.startCleaningLog);
router.patch("/:id/pause", employeeOnly, CleaningLogControllers.pauseCleaningLog);
router.patch(
  "/:id/resume",
  employeeOnly,
  CleaningLogControllers.resumeCleaningLog
);
router.patch("/:id/stop", employeeOnly, CleaningLogControllers.stopCleaningLog);
router.patch(
  "/:id/complete",
  everyone,
  CleaningLogControllers.completeCleaningLog
);
// Ticks and times saved as they are made during a session
router.patch(
  "/:id/items",
  employeeOnly,
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
