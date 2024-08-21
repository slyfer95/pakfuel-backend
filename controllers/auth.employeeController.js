import Employee from "../models/employee.model.js";
import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import generateToken from "../utils/generateToken.js";
import sendEmail from "../utils/sendEmail.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const generateOtp = () => {
  // create a six digit otp
  return crypto.randomInt(100000, 1000000).toString();
};

// signup needs work as to not sent otp until the previous one is expired
export const signupEmployee = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    let errorMsg = "";

    console.log(errors.array());

    errors
      .array()
      .forEach((error) => (errorMsg += `for: ${error.path}, ${error.msg} \n`));
    return res.status(400).json({ error: errorMsg });
  }

  try {
    const { name, email, password, confirmPassword, phoneNumber, type } =
      req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    const existingEmployee = await Employee.findOne({
      $or: [{ email }, { phoneNumber }],
    });

    // If employee already exists and account already verified
    if (existingEmployee && existingEmployee.isVerified) {
      return res
        .status(400)
        .json({ error: "Email or phone number already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP
    const otp = generateOtp();
    const otpExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes from now

    // If employee exists but is not verified, update their details
    if (existingEmployee && !existingEmployee.isVerified) {
      // Check if OTP is still valid
      if (existingEmployee.otp > Date.now()) {
        const remainingTime = (existingCustomer.otpExpiry - Date.now()) / 1000;
        return res.status(400).json({
          error: `OTP already sent. Try again in ${Math.ceil(
            remainingTime
          )} seconds`,
        });
      } else {
        // Update existing employee's details
        existingEmployee.name = name;
        existingEmployee.email = email;
        existingEmployee.password = hashedPassword;
        existingEmployee.phoneNumber = phoneNumber;
        existingEmployee.type = type;
        existingEmployee.otp = otp;
        existingEmployee.otpExpiry = otpExpiry;

        await existingEmployee.save();

        // Send OTP email
        await sendEmail(email, "Your OTP Code", `Your OTP code is ${otp}`);

        return res.status(200).json({
          message: "New OTP sent to email.",
        });
      }
    }

    // Create a new employee
    const newEmployee = new Employee({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      type,
      otp,
      otpExpiry,
    });

    await newEmployee.save();

    // Send OTP email
    await sendEmail(email, "Your OTP Code", `Your OTP code is ${otp}`);

    const token = generateToken(
      newEmployee._id,
      newEmployee.isVerified,
      newEmployee.pumpId
    );

    res.status(201).json({
      message: "Employee created successfully. OTP sent to email.",
      token,
      // employee: employeeResponse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server error" });
  }
};

export const loginEmployee = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    let errorMsg = "";

    errors
      .array()
      .forEach((error) => (errorMsg += `for: ${error.path}, ${error.msg} \n`));
    return res.status(400).json({ error: errorMsg });
  }

  const { email, password } = req.body; // Ensure this line is as shown

  try {
    // find employee with email
    const employee = await Employee.findOne({ email });
    if (!employee) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // compare passwords
    const isMatch = await bcrypt.compare(password, employee.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // console.log(employee);

    const token = generateToken(
      employee._id,
      employee.isVerified,
      employee.pumpId
    );

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server error" });
  }
};

export const logoutEmployee = async (req, res) => {
  res.status(200).json({ message: "Logout successful" });
};

export const verifyOtpEmployee = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array() });
  }

  const { otp } = req.body;

  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const employee = await Employee.findById(userId);
    if (!employee) {
      return res.status(400).json({ error: "Invalid token or user not found" });
    }

    if (employee.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (employee.otpExpiry < Date.now()) {
      return res.status(400).json({ error: "OTP has expired" });
    }

    employee.isVerified = true;
    employee.otp = null; // Clear the OTP
    employee.otpExpiry = null; // Clear the OTP expiry
    await employee.save();

    const resToken = generateToken(
      employee._id,
      employee.isVerified,
      employee.pumpId
    );

    res.status(200).json({
      message: "Account verified successfully",
      employee,
      token: resToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server error" });
  }
};

export const requetsNewOtp = async (req, res) => {
  console.log("new otp requested");

  const authHeader = req.header("Authorization");
  if (!authHeader) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }
  const token = authHeader.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const employee = await Employee.findById(userId);
    if (!employee) {
      return res.status(400).json({ error: "Invalid token or user not found" });
    }

    if (employee.isVerified) {
      return res.status(400).json({ error: "Account is already verified" });
    }

    // check for otp expiry if otp not expired return error
    if (employee.otpExpiry > Date.now()) {
      const remainingTime = (employee.otpExpiry - Date.now()) / 1000;
      return res.status(400).json({
        error: `OTP already sent. Try again in ${Math.ceil(
          remainingTime
        )} seconds`,
      });
    }

    // Generate OTP
    const otp = generateOtp();
    employee.otp = otp;
    employee.otpExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes from now

    await employee.save();

    // Send OTP email
    await sendEmail(employee.email, "Your OTP Code", `Your OTP code is ${otp}`);

    res
      .status(200)
      .json({ message: `New OTP sent to email. \n${employee.email}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server error" });
  }
};

export const requestPasswordReset = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    let errorMsg = "";
    errors
      .array()
      .forEach((error) => (errorMsg += `for: ${error.path}, ${error.msg} \n`));
    return res.status(400).json({ error: errorMsg });
  }

  const { email } = req.body;

  try {
    const employee = await Employee.findOne({ email });
    if (!employee) {
      return res
        .status(400)
        .json({ error: "No employee found with this email" });
    }

    if (!employee.isVerified) {
      return res.status(400).json({
        error:
          "Account is not verified. Please verify your account first, or signup again",
      });
    }

    if (employee.otp && employee.otpExpiry > Date.now()) {
      const remainingTime = (employee.otpExpiry - Date.now()) / 1000;
      return res.status(400).json({
        error: `Password reset request already sent, OTP has been provided. Proceed to the next page to send the otp or Try again in ${Math.ceil(
          remainingTime
        )} seconds`,
      });
    }

    const otp = generateOtp();
    const otpExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes from now

    employee.otp = otp;
    employee.otpExpiry = otpExpiry;

    await Promise.all([
      employee.save(),
      sendEmail(
        employee.email,
        "Password Reset OTP Code",
        `Your OTP code is ${otp}`
      ),
    ]);

    res.status(200).json({
      message: `Password reset OTP sent to email. \n${employee.email}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server error" });
  }
};

export const resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    let errorMsg = "";
    errors
      .array()
      .forEach((error) => (errorMsg += `for: ${error.path}, ${error.msg} \n`));
    return res.status(400).json({ error: errorMsg });
  }

  const { email, newPassword, otp } = req.body;

  try {
    const employee = await Employee.findOne({ email });
    if (!employee) {
      return res
        .status(400)
        .json({ error: "No employee found with this email" });
    }

    if (employee.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (employee.otpExpiry < Date.now()) {
      return res
        .status(400)
        .json({ error: "OTP has expired, \nPlease Request another" });
    }

    const salt = await bcrypt.genSalt(10);
    employee.password = await bcrypt.hash(newPassword, salt);

    employee.otp = null; // Clear the OTP
    employee.otpExpiry = null; // Clear the OTP expiry
    await employee.save();

    res.status(200).json({
      message: "Password reset successful.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server error" });
  }
};

export const verifyOtpForgetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array() });
  }

  const { otp } = req.body;
  const email = otp.email;
  const OTP = otp.otp;

  if (!OTP && !email) {
    return res.status(400).json({ error: "Invalid OTP or email" });
  }

  const employee = await Employee.findOne({ email });

  if (!employee) {
    return res.status(404).json({ error: "Employee not found" });
  }

  if (employee.otp !== OTP) {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  if (employee.otpExpiry < Date.now()) {
    return res
      .status(400)
      .json({ error: "OTP has expired, \nPlease Request another" });
  }

  res.status(200).json({ message: "OTP verified successfully" });
};
