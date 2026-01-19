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


export const UploadDocumentRoutes = router;
