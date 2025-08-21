/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { RequestDocumentControllers } from "./requestDocument.controller";




const router = express.Router();
router.get(
  "/",
//   auth("admin", "company", "creator", "user", "director"),
RequestDocumentControllers.getAllRequestDocument
);

router.get(
  "/:id",
//   auth("admin", "user", "director", "company", "creator"),
RequestDocumentControllers.getSingleRequestDocument
);
router.post(
  "/",
//   auth("admin", "user", "director", "company", "creator"),
RequestDocumentControllers.createRequestDocument
);

router.patch(
  "/:id",
//   auth("admin", "user", "creator", "company", "director"),
RequestDocumentControllers.updateRequestDocument
);





export const RequestDocumentRoutes = router;
