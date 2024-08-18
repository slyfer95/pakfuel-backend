import Employee from "../models/employee.model.js";
import { validationResult } from "express-validator";
import Pump from "../models/pump.model.js";
import bcrypt from "bcryptjs";
import { uploadToCloudinary } from "../utils/cloudinary.js";

import Customer from "../models/customer.model.js";
import Transaction from "../models/transaction.model.js";

// @desc get own profile
// @route /api/employee/profile
// @access employees (refueler and manager)
export const getEmployeeProfile = async (req, res) => {
  // get employee id from auth middleware
  const employeeId = req.employee.userId;

  try {
    // find employee in the database
    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // return employee profile
    res
      .status(200)
      .json({ message: "Employee profile successfully retreived", employee });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// @desc update profile
// @route /api/employee/updateProfile
// @access employees (refueler and manager)
export const updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const employee = req.employee.userId;

  const { name, phoneNumber } = req.body;

  try {
    const updatedEmployee = await Employee.findByIdAndUpdate(
      employee,
      {
        name,
        phoneNumber,
      },
      { new: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res
      .status(200)
      .json({ message: "Profile updated successfully", updatedEmployee });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// @desc change current password while logged in
// @route /api/employee/changePassword
// @access employees (refueler and manager)
export const changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    let errorMsg = "";

    errors
      .array()
      .forEach((error) => (errorMsg += `for: ${error.path}, ${error.msg} \n`));
    return res.status(400).json({ error: errorMsg });
  }

  const employeeId = req.employee.userId;

  const { currentPassword, newPassword } = req.body;

  try {
    // find employee in the database
    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // compare old password with the one in the database
    const isMatch = await bcrypt.compare(currentPassword, employee.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid old password" });
    }

    // hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // update password in the database
    employee.password = hashedPassword;
    await employee.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// @desc get list of all employees in a single pump by manager
// @route /api/employee/employeeList
// @access manager
export const getEmployeeList = async (req, res) => {
  // Get employee id
  const managerId = req.employee.userId;

  try {
    // Find employee in the database
    const manager = await Employee.findById(managerId);

    // Check if employee type is manager
    if (manager.type !== "manager") {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    // Find pump where manager is the employee
    // it returns a list
    const pumps = await Pump.find({ manager: managerId }).populate(
      "employees",
      "name email phoneNumber createdAt"
    );

    // If no pumps found, this manager is not assigned to a pump
    if (pumps.length === 0) {
      return res.status(404).json({ error: "Manager not assigned to a pump" });
    }

    // Since a manager can manage only one pump, get the employees of the first pump
    const employees = pumps[0].employees;

    // Return list of employees assigned to the pump
    res
      .status(200)
      .json({ message: "Employee list successfully retrieved", employees });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// @desc get list of all employees in the database
// @route /api/employee/getAllEmployeesList
// @access admin
export const getAllEmployeesList = async (req, res) => {
  try {
    // Find all employees in the database
    const employees = await Employee.find().populate("pumpId", "name");

    // return error if no employees

    if (employees.length === 0) {
      return res.status(404).json({ error: "No employees found" });
    }

    // Return list of employees
    res
      .status(200)
      .json({ message: "Employee list successfully retrieved", employees });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const uploadImage = async (req, res) => {
  try {
    const employee = req.employee;
    const { image } = req.body;
    const { url } = await uploadToCloudinary(image);
    const updatedEmployee = await Employee.findById(employee.userId);

    updatedEmployee.imageUrl = url;
    await updatedEmployee.save();

    res.status(200).json({
      message: "Image updated successfully",
      url: url,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// @desc update push token
// @route /api/employee/updatePushToken
// @access employees (refueler and manager)
export const updatePushToken = async (req, res) => {
  const employee = req.employee;
  const { pushToken } = req.body;

  try {
    const updatedEmployee = await Employee.findByIdAndUpdate(employee.userId, {
      pushToken,
    });

    res.status(200).json({
      message: "Push token updated successfully",
    });
  } catch (error) {
    console.error("Error updating push token:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
