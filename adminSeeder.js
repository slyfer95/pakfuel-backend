import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import Admin from "./models/admin.model.js";

dotenv.config();

// Admin data to seed
const admins = [
  {
    name: "Kaleemullah",
    email: "kalimdurrani22@gmail.com",
    password: "123456",
    role: "supremeOverlord",
    isVerified: true,
  },
  {
    name: "Waleed Ahmad",
    email: "waleedporsche@gmail.com",
    password: "123456",
    role: "supremeOverlord",
    isVerified: true,
  },
];

// Function to seed admins
const seedAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("MongoDB connected");

    // Hash passwords
    for (const admin of admins) {
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(admin.password, salt);
    }

    // Remove existing admins
    await Admin.deleteMany();

    // Insert new admins
    await Admin.insertMany(admins);

    console.log("Admins seeded successfully");
    mongoose.disconnect();
  } catch (error) {
    console.error("Error seeding admins", error);
    process.exit(1);
  }
};

seedAdmins();
