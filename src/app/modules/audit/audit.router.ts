/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { AuditControllers } from "./audit.controller";
import auth from "../../middlewares/auth";


const router = express.Router();
router.get(
  "/",
  auth("admin", "company","companyAdmin"),
  AuditControllers.getAllAudit
);
router.get(
  "/:id",
  auth("admin", "company","companyAdmin"),
AuditControllers.getSingleAudit
);

router.post(
  "/",
  auth("admin", "company","companyAdmin"),
AuditControllers.createAudit
);

router.patch(
  "/:id",
  auth("admin", "company","companyAdmin"),
AuditControllers.updateAudit
);

router.delete(
  "/:id",
  auth("admin", "company","companyAdmin"),
  AuditControllers.deleteAudit
);



export const AuditRoutes = router;
