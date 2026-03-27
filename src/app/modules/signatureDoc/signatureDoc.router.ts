/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { SignatureDocControllers } from "./signatureDoc.controller";
import auth from "../../middlewares/auth";


const router = express.Router();
router.get(
  "/",
  auth("admin", "company", "creator", "user", "director","companyAdmin"),
  SignatureDocControllers.getAllSignatureDoc
);
router.get(
  "/:id",
  auth("admin", "user", "director", "company", "creator","companyAdmin"),
SignatureDocControllers.getSingleSignatureDoc
);
router.post(
  "/",
  auth("admin", "user", "director", "company", "creator","companyAdmin"),
SignatureDocControllers.createSignatureDoc
);

router.patch(
  "/:id",
  auth("admin", "user", "creator", "company", "director","companyAdmin"),
SignatureDocControllers.updateSignatureDoc
);

router.delete(
  "/:id",
  auth("admin", "user", "creator", "company", "director","companyAdmin"),
  SignatureDocControllers.deleteSignatureDoc
);



export const SignatureDocRoutes = router;
