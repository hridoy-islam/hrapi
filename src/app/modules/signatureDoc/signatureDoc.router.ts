/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { SignatureDocControllers } from "./signatureDoc.controller";
import auth from "../../middlewares/auth";


const router = express.Router();
router.get(
  "/",
  auth("admin", "company", "creator", "user", "director"),
  SignatureDocControllers.getAllSignatureDoc
);
router.get(
  "/:id",
  auth("admin", "user", "director", "company", "creator"),
SignatureDocControllers.getSingleSignatureDoc
);
router.post(
  "/",
  auth("admin", "user", "director", "company", "creator"),
SignatureDocControllers.createSignatureDoc
);

router.patch(
  "/:id",
  auth("admin", "user", "creator", "company", "director"),
SignatureDocControllers.updateSignatureDoc
);

router.delete(
  "/:id",
  auth("admin", "user", "creator", "company", "director"),
  SignatureDocControllers.deleteSignatureDoc
);



export const SignatureDocRoutes = router;
