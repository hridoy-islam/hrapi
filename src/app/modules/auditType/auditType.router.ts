/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { AuditTypeControllers } from "./auditType.controller";
import auth from "../../middlewares/auth";


const router = express.Router();
router.get(
  "/",
  auth("admin", "company","companyAdmin"),
  AuditTypeControllers.getAllAuditType
);
router.get(
  "/:id",
  auth("admin", "company","companyAdmin"),
AuditTypeControllers.getSingleAuditType
);
router.post(
  "/",
  auth("admin", "company","companyAdmin"),
AuditTypeControllers.createAuditType
);

router.patch(
  "/:id",
  auth("admin", "company","companyAdmin"),
AuditTypeControllers.updateAuditType
);

router.delete(
  "/:id",
  auth("admin", "company", "companyAdmin"),
  AuditTypeControllers.deleteAuditType
);



export const AuditTypeRoutes = router;
