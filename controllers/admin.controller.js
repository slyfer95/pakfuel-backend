import Pump from "../models/pump.model.js";
import Employee from "../models/employee.model.js";
import Admin from "../models/admin.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

export const getProfile = (req, res) => {
  try {
    const admin = req.admin;

    res
      .status(200)
      .json({ message: "Admin Profile retreived successfully", admin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const admin = req.admin;
    const totalPumps = await Pump.countDocuments();
    const totalEmployees = await Employee.countDocuments();

    res.status(200).json({
      message: "Stats retrieved successfully",
      totalPumps,
      totalEmployees,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const uploadImage = async (req, res) => {
  try {
    const admin = req.admin;
    const { image } = req.body;
    const { url } = await uploadToCloudinary(image);
    const updatedAdmin = await Admin.findById(admin._id);

    updatedAdmin.imageUrl = url;
    await updatedAdmin.save();

    res.status(200).json({
      message: "Image updated successfully",
      url: url,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
