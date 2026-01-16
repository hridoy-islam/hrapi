/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { SubscriptionPlanControllers } from "./subscriptionPlan.controller";
import auth from "../../middlewares/auth";


const router = express.Router();
router.get(
  "/",
  auth("admin", "company"),
  SubscriptionPlanControllers.getAllSubscriptionPlan
);
router.get(
  "/:id",
  auth("admin", "company"),
SubscriptionPlanControllers.getSingleSubscriptionPlan
);
router.post(
  "/",
  auth("admin"),
SubscriptionPlanControllers.createSubscriptionPlan
);

router.patch(
  "/:id",
  auth("admin"),
SubscriptionPlanControllers.updateSubscriptionPlan
);

router.delete(
  "/:id",
  auth("admin"),
  SubscriptionPlanControllers.deleteSubscriptionPlan
);



export const SubscriptionPlanRoutes = router;
