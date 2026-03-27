/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { UserControllers } from "./user.controller";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/multer";
// import auth from '../../middlewares/auth';

const router = express.Router();
router.get(
  "/",
  // auth("admin", "company", "creator", "user", "director"),
  UserControllers.getAllUser
);
router.get(
  "/:id",
  // auth("admin", "user", "director", "company", "employee"),
  UserControllers.getSingleUser
);

router.patch(
  "/:id",
  auth("admin", "user", "creator", "company", "director","companyAdmin"),
  UserControllers.updateUser
);

router.patch('/addmember/:id/', auth('admin',  'creator', 'company', 'director','companyAdmin'),UserControllers.assignUser);


router.get(
  "/company/:userId",
  auth("admin", "company", "creator", "user", "director","companyAdmin"),
  UserControllers.getCompanyUser
);

export const UserRoutes = router;
