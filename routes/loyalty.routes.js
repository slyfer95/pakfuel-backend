import express from "express";
import { body } from "express-validator";
import {
  setLoyaltyThreshold,
  getCustomerLoyaltyPoints,
} from "../controllers/loyalty.controller.js";
import protectEmployeeRoute from "../middleware/protectEmployeeRoute.js";
import protectCustomerRoute from "../middleware/protectCustomerRoute.js";

const router = express.Router();

const setLoyaltyThresholdValidation = [
  body("pumpId").notEmpty().withMessage("Pump ID is required"),
  body("threshold")
    .isInt({ min: 1 })
    .withMessage("Threshold must be a positive integer"),
];

router.post(
  "/setThreshold",
  setLoyaltyThresholdValidation,
  protectEmployeeRoute,
  setLoyaltyThreshold
);

router.get("/points", protectCustomerRoute, getCustomerLoyaltyPoints);

export default router;
