import express from "express";
import { body } from "express-validator";
import protectCustomerRoute from "./../middleware/protectCustomerRoute.js";
import {
  findReceiver,
  getFundsTransferHistory,
  transferFunds,
} from "../controllers/fundsTransfer.controller.js";

const router = express.Router();

const findReceiverValidation = [
  body("phoneNumber")
    .notEmpty()
    .isString()
    .isLength({ min: 11, max: 11 })
    .withMessage("Valid Phone Number of 11 digit long is required"),
];

router.get("/getHistory", protectCustomerRoute, getFundsTransferHistory);

router.post("/transferFunds", protectCustomerRoute, transferFunds);

router.post(
  "/findReceiver",
  protectCustomerRoute,
  findReceiverValidation,
  findReceiver
);

export default router;
