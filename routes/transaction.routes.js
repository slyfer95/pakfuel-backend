import express from "express";
import { body } from "express-validator";
import protectCustomerRoute from "../middleware/protectCustomerRoute.js";
import {
  createTransaction,
  getCustomerTransactionHistory,
  getEmployeeTransactionHistory,
  getRefuelerTransactionHistory,
} from "../controllers/transaction.controller.js";
import protectEmployeeRoute from "../middleware/protectEmployeeRoute.js";

const router = express.Router();

// validation rules for createTransaction function
const createTransactionValidation = [
  body("amount").notEmpty().isNumeric().withMessage("Amount is required"),
  body("paymentMethod")
    .notEmpty()
    .isIn(["app", "cash"])
    .withMessage("PaymentMethod is required"),
  body("fuelType")
    .notEmpty()
    .isIn(["petrol", "diesel", "cng"])
    .withMessage(
      "fuelType is required, and must either 'petrol', 'diesel' or 'cng' "
    ),
  body("fuelAmount")
    .notEmpty()
    .isNumeric()
    .withMessage("fuel amount is required"),
  body("customerId")
    .notEmpty()
    .isString()
    .withMessage("Customer ID is required"),
];

router.post(
  "/createTransaction",
  createTransactionValidation,
  protectEmployeeRoute,
  createTransaction
);

router.get(
  "/customerHistory",
  protectCustomerRoute,
  getCustomerTransactionHistory
);

router.get(
  "/refuelerHistory",
  protectEmployeeRoute,
  getRefuelerTransactionHistory
);

router.post(
  "/employeeHistory",
  protectEmployeeRoute,
  getEmployeeTransactionHistory
);

export default router;
