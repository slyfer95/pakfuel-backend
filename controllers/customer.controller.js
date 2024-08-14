import Customer from "../models/customer.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import Transaction from "../models/transaction.model.js";
import FundsTransfer from "../models/fundsTransfer.model.js";
import TopUp from "../models/topUp.model.js";
import bcrypt from "bcryptjs";

import { validationResult } from "express-validator";

// @desc customer gets his profile info after login or refresh
// @route /api/customer/profile
// @access customer
export const getCustomerProfile = async (req, res) => {
  // retreive the customer id from the protecgt customer middleware
  const customerId = req.customer.userId;

  try {
    // find customer
    const customer = await Customer.findById(customerId);

    if (!customer) {
      res.status(404).json({ error: "Customer not found" });
    }

    // console.log(customer);

    // return the customer profile
    // the overridden toJson method inside the customer model
    // automatically removes sensitive fields
    res
      .status(200)
      .json({ message: "Customer profile successfully retrieved", customer });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// @desc customer updates his profile info while logged in
// @route /api/customer/updateProfile
// @access customer
export const updateCustomerProfile = async (req, res) => {
  // validate the request
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const customerId = req.customer.userId;
  const { name, phoneNumber } = req.body;

  try {
    // make sure the number does not already exist except for current user
    const existingCustomer = await Customer.findOne({
      $and: [{ _id: { $ne: customerId } }, { phoneNumber }],
    });

    if (existingCustomer) {
      return res.status(400).json({ error: "Phone number already exists" });
    }

    // find and update the customer
    const customer = await Customer.findByIdAndUpdate(
      customerId,
      {
        name,
        phoneNumber,
      },
      { new: true }
    );

    // return the updated customer profile
    res
      .status(200)
      .json({ message: "Customer profile updated successfully", customer });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// @desc customer changes his password while logged in
// @route /api/customer/changePassword
// @access customer
export const changePassword = async (req, res) => {
  // validate the request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    let errorMsg = "";

    errors
      .array()
      .forEach((error) => (errorMsg += `for: ${error.path}, ${error.msg} \n`));
    return res.status(400).json({ error: errorMsg });
  }

  const customerId = req.customer.userId;
  const { currentPassword, newPassword } = req.body;

  try {
    // find the customer
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // check if the old password matches
    const isMatch = await bcrypt.compare(currentPassword, customer.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid old password" });
    }

    // hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // update the password
    customer.password = hashedPassword;
    await customer.save();

    // return the updated customer profile
    res
      .status(200)
      .json({ message: "Password updated successfully", customer });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// @desc admin gets list of all the customers in the database
// @route /api/customer/getCustomerList
// @access admin
export const getCustomerList = async (req, res) => {
  try {
    // find all the customers in the database
    const customers = await Customer.find({});

    // if there are no customers in the database return error
    if (customers.length === 0) {
      return res.status(404).json({ error: "No customers found" });
    }

    // return the list of customers
    res
      .status(200)
      .json({ message: "Customers retrieved successfully", customers });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// @desc customer uploads his image
// @route /api/customer/uploadImage
// @access customer
export const uploadImage = async (req, res) => {
  try {
    const customer = req.customer;
    const { image } = req.body;
    const { url } = await uploadToCloudinary(image);
    const updatedCustomer = await Customer.findById(customer.userId);

    updatedCustomer.imageUrl = url;
    await updatedCustomer.save();

    res.status(200).json({
      message: "Image updated successfully",
      url: url,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// @desc customer updates his push token
// @route /api/customer/updatePushToken
// @access customer
export const updatePushToken = async (req, res) => {
  const customer = req.customer;
  const { pushToken } = req.body;

  try {
    const updatedCustomer = await Customer.findByIdAndUpdate(customer.userId, {
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
