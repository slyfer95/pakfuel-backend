import express from "express";
import { body } from "express-validator";
import protectCustomerRoute from "../middleware/protectCustomerRoute.js";
import {
  changePassword,
  getCustomerList,
  getCustomerProfile,
  updateCustomerProfile,
  uploadImage,
  updatePushToken,
} from "../controllers/customer.controller.js";
import protectAdminRoute from "../middleware/protectAdminRoute.js";

const router = express.Router();

const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .isString()
    .withMessage("Current password is required"),
  body("newPassword")
    .notEmpty()
    .isString()
    .withMessage("New password is required"),
  body("confirmPassword")
    .notEmpty()
    .isString()
    .withMessage("Confirm password is required"),
  body("confirmPassword")
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage("Passwords do not match"),
];

// @access customer
router.get("/profile", protectCustomerRoute, getCustomerProfile);

// @access customer
router.post("/updateProfile", protectCustomerRoute, updateCustomerProfile);

// @access customer
router.post(
  "/changePassword",
  changePasswordValidation,
  protectCustomerRoute,
  changePassword
);

// @access customer
router.post("/image", protectCustomerRoute, uploadImage);

// @access Admin
router.get("/getCustomerList", protectAdminRoute, getCustomerList);

// @access customer
router.post("/updatePushToken", protectCustomerRoute, updatePushToken);

export default router;
