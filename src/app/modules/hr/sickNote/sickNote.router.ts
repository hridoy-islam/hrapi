/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";


import { SickNoteControllers } from "./sickNote.controller";


const router = express.Router();
router.get(
  "/",
//   auth("admin", "company", "creator", "user", "director"),
SickNoteControllers.getAllSickNote
);
router.get(
  "/:id",
  //   auth("admin", "user", "director", "company", "creator"),
  SickNoteControllers.getSingleSickNote,
);
router.post(
  "/",
//   auth("admin", "user", "director", "company", "creator"),
SickNoteControllers.createSickNote
);

router.patch(
  "/:id",
//   auth("admin", "user", "creator", "company", "director"),
SickNoteControllers.updateSickNote
);



export const SickNoteRoutes = router;
