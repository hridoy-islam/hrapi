/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";

import { UploadDocumentController } from "./documents.controller";
import { upload } from "../../utils/multer";
// import auth from '../../middlewares/auth';

const router = express.Router();

router.post(
  "/",
  // auth("admin", "student", "user"),
  upload.single('file'),
  UploadDocumentController.UploadDocument
);

router.delete(
  "/",
  // auth("admin", "student", "user"), // Uncomment if you want to protect it
  UploadDocumentController.DeleteDocument
);
export const UploadDocumentRoutes = router;
