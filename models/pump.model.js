import mongoose from "mongoose";

// Define the schema for the Pump model
const pumpSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    coordinates: {
      type: new mongoose.Schema(
        {
          latitude: {
            type: Number,
            required: true,
          },
          longitude: {
            type: Number,
            required: true,
          },
        },
        { _id: false } // Disable _id for coordinates
      ),
      required: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      // required: true,
    },
    employees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],
  },
  { timestamps: true }
);

// Create the Pump model using the schema
const Pump = mongoose.model("Pump", pumpSchema);

export default Pump;
