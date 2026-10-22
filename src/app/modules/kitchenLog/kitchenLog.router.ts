import express from "express";
import { KitchenLogControllers } from "./kitchenLog.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

const everyone = auth("admin", "company", "companyAdmin", "employee");
const companySide = auth("admin", "company", "companyAdmin");
const employeeOnly = auth("employee");

router.get("/", everyone, KitchenLogControllers.getAllKitchenLog);

// Fixed paths sit above "/:id" so they are not read as an id
router.get("/board", everyone, KitchenLogControllers.getKitchenBoard);
router.get(
  "/approval-counts",
  companySide,
  KitchenLogControllers.getApprovalCounts
);
router.get("/report", companySide, KitchenLogControllers.getKitchenReport);

router.get("/:id", everyone, KitchenLogControllers.getSingleKitchenLog);

// A finished log recorded in one go: by the company side for any module, or
// by an employee for a log that is not timed (equipment temperatures)
router.post("/", everyone, KitchenLogControllers.createKitchenLog);

// A timed log is a session the employee runs: start -> stop -> complete. The
// company side can complete or discard a session left open.
router.post("/start", employeeOnly, KitchenLogControllers.startKitchenLog);
router.patch(
  "/:id/progress",
  employeeOnly,
  KitchenLogControllers.saveKitchenLogProgress
);
router.patch("/:id/stop", employeeOnly, KitchenLogControllers.stopKitchenLog);
router.patch(
  "/:id/complete",
  everyone,
  KitchenLogControllers.completeKitchenLog
);
router.delete(
  "/:id/discard",
  everyone,
  KitchenLogControllers.discardKitchenLog
);

// Management sign off, editing and deleting stay with the company side
router.patch(
  "/:id/approve",
  companySide,
  KitchenLogControllers.approveKitchenLog
);
router.patch("/:id", companySide, KitchenLogControllers.updateKitchenLog);
router.delete("/:id", companySide, KitchenLogControllers.deleteKitchenLog);

export const KitchenLogRoutes = router;
