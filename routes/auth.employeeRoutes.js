import express from "express";
import { body } from "express-validator";
import {
  loginEmployee,
  logoutEmployee,
  requetsNewOtp,
  signupEmployee,
  verifyOtpEmployee,
  requestPasswordReset,
  verifyOtpForgetPassword,
  resetPassword,
} from "../controllers/auth.employeeController.js";

const router = express.Router();

// Validation rules for signup
const signupValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("confirmPassword")
    .isLength({ min: 6 })
    .withMessage("Confirm password must be at least 6 characters"),
  body("phoneNumber").isString().withMessage("Phone number must be a string"), // Changed to string validation
  body("type")
    .isString()
    .isIn(["manager", "refueler"])
    .withMessage("Employee type is required, and must be manager or employee"),
  // body("pumpId")
  //   .isString()
  //   .withMessage("pumpId is required obtain it from your manager"),
  //   body("cnic").optional().isString().withMessage("CNIC must be a string"),
];

// Validation rules for login
const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Validation rules for OTP verification
const otpValidation = [
  body("otp")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 characters long"),
];

// Define routes with validation
router.post("/signup", signupValidation, signupEmployee);

router.post("/login", loginValidation, loginEmployee);

router.post("/logout", logoutEmployee);

router.post("/verify-otp", otpValidation, verifyOtpEmployee);

router.get("/requestNewOtp", requetsNewOtp);

router.post("/requestPasswordReset", requestPasswordReset);

router.post("/verifyOtpForgetPassword", verifyOtpForgetPassword);

router.post("/resetPassword", resetPassword);

export default router;
