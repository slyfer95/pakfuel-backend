import express from "express";
import {
  addEmployeeToPump,
  addEmployeeToPumpByManager,
  addManagerToPump,
  addPump,
  getEmployeeListByPump,
  getPumpList,
  getPumpLocations,
  removeEmployeeFromPump,
} from "../controllers/pump.controller.js";
import protectAdminRoute from "../middleware/protectAdminRoute.js";

import { body } from "express-validator";
import protectEmployeeRoute from "../middleware/protectEmployeeRoute.js";
import protectCustomerRoute from "../middleware/protectCustomerRoute.js";

const router = express.Router();

// validating the body of addPump api
const validateAddPump = [
  body("name").notEmpty().withMessage("Name is required"),
  body("location").notEmpty().withMessage("Location is required"),
  body("coordinates.latitude")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Valid latitude is required"),
  body("coordinates.longitude")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Valid longitude is required"),
  // Add any other validation rules as needed
];

// validate the body of add manager to pump api
const validateAddManagerToPump = [
  body("pumpId").notEmpty().withMessage("Pump ID is required"),
  body("managerEmail")
    .notEmpty()
    .isEmail()
    .withMessage("Manager email is required"),
];

const validateAddEmployeeToPump = [
  body("pumpId").notEmpty().withMessage("Pump ID is required"),
  body("employeeEmail")
    .notEmpty()
    .isEmail()
    .withMessage("Employee email is required"),
  // Add any other validation rules as needed
];

const validateAddEmployeeToPumpByManager = [
  body("employeeEmail")
    .notEmpty()
    .isEmail()
    .withMessage("Employee email is required"),
];

// @access Admin
router.post("/addPump", validateAddPump, protectAdminRoute, addPump);

// @access Admin
router.post(
  "/addManagerToPump",
  validateAddManagerToPump,
  protectAdminRoute,
  addManagerToPump
);

// @access Admin
router.post(
  "/addEmployeeToPump",
  validateAddEmployeeToPump,
  protectAdminRoute,
  addEmployeeToPump
);

// @access Admin
router.get("/getPumpList", protectAdminRoute, getPumpList);

// @access Admin
router.post("employeeListByPump", protectAdminRoute, getEmployeeListByPump);

// @access Admin
router.post(
  "/removeEmployeeFromPump",
  protectAdminRoute,
  removeEmployeeFromPump
);

// @access Manager
router.post(
  "/addEmployeeToPumpByManager",
  validateAddEmployeeToPumpByManager,
  protectEmployeeRoute,
  addEmployeeToPumpByManager
);

// @access Customer
router.get("/pumpLocations", protectCustomerRoute, getPumpLocations);

export default router;
