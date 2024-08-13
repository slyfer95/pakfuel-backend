import mongoose from "mongoose";

const topUpSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    topUpThrough: {
      type: String,
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
  },
  { timestamps: true }
);

const TopUp = mongoose.model("TopUp", topUpSchema);
export default TopUp;
