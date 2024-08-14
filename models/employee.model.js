import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    imageUrl: {
      type: String,
    },
    type: {
      type: String,
      enum: ["manager", "refueler"],
      required: true,
    },
    isEmployed: {
      type: Boolean,
      default: false,
    },
    pumpId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pump",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
    },
    otpExpiry: {
      type: Date,
    },
    pushToken: {
      type: String,
    },
  },
  { timestamps: true }
);

// Modify toJSON method to exclude password and OTP fields
employeeSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpiry;
  return obj;
};

const Employee = mongoose.model("Employee", employeeSchema);
export default Employee;
