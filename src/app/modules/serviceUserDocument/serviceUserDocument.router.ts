/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { ServiceUserDocumentControllers } from "./serviceUserDocument.controller";
import auth from "../../middlewares/auth";


const router = express.Router();
router.get(
  "/",
  auth("admin", "company","companyAdmin"),
  ServiceUserDocumentControllers.getAllServiceUserDocument
);
router.get(
  "/:id",
  auth("admin", "company","companyAdmin"),
ServiceUserDocumentControllers.getSingleServiceUserDocument
);

router.post(
  "/",
  auth("admin", "company","companyAdmin"),
ServiceUserDocumentControllers.createServiceUserDocument
);

router.patch(
  "/:id",
  auth("admin", "company","companyAdmin"),
ServiceUserDocumentControllers.updateServiceUserDocument
);

router.delete(
  "/:id",
  auth("admin", "company","companyAdmin"),
  ServiceUserDocumentControllers.deleteServiceUserDocument
);



export const ServiceUserDocumentRoutes = router;
