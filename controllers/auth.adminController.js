import { validationResult } from "express-validator";
import Admin from "../models/admin.model.js";
import bcrypt from "bcryptjs";
import generateCookieToken from "../utils/generateCookieToken.js";
import jwt from "jsonwebtoken";

export const loginAdmin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    let errorMsg = "";

    errors
      .array()
      .forEach((error) => (errorMsg += `for: ${error.path}, ${error.msg} \n`));
    return res.status(400).json({ error: errorMsg });
  }

  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // console.log(admin);

    generateCookieToken(admin._id, admin.isVerified, res);

    res.status(200).json({
      message: "Admin Login successful",
      user: {
        userId: admin._id,
        isVerified: admin.isVerified,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const logoutAdmin = (req, res) => {
  try {
    // remove token from the client side
    res.cookie("jwt", "", {
      maxAge: 0,
      httpOnly: true,
      sameSite: "none",
      secure: process.env.NODE_ENV !== "development",
      path: "/",
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res
        .status(403)
        .json({ error: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(403).json({ error: "Uanauthorized - Invalid Token" });
    }

    res.status(200).json({
      message: "Admin loaded successfully",
      user: decoded,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
