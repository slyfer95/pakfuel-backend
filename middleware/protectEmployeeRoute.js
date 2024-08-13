import jwt from "jsonwebtoken";
import Employee from "../models/employee.model.js";

const JWT_SECRET = process.env.JWT_SECRET;

const protectEmployeeRoute = async (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const employee = await Employee.findById(decoded.userId).select(
      "-password"
    );

    if (!employee) {
      return res.status(401).json({ error: "Employee not found" });
    }

    if (!employee.isVerified) {
      return res.status(401).json({ error: "Employee not verified" });
    }

    req.employee = decoded;
    next();
  } catch (error) {
    console.log("Error in protect employee route", error);
    return res.status(400).json({ error: "Invalid Token" });
  }
};

export default protectEmployeeRoute;
