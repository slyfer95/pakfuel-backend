import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";

const JWT_SECRET = process.env.JWT_SECRET;

const protectAdminRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ error: "Uanuthorized - Invalid Token" });
    }

    const admin = await Admin.findById(decoded.userId).select("-password");
    // console.log(admin);

    if (!admin) {
      return res.status(401).json({ error: "Admin not found." });
    }

    if (!admin.isVerified) {
      return res.status(401).json({ error: "Admin not verified." });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.log("Error in protect admin route", error);

    return res.status(400).json({ error: "Invalid token." });
  }
};

export default protectAdminRoute;
