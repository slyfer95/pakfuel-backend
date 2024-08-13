import mongoose from "mongoose";

const fundsTransferSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    entityTransfered: {
      type: String,
      enum: ["points", "balance"],
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
  },
  { timestamps: true }
);

const FundsTransfer = mongoose.model("FundsTransfer", fundsTransferSchema);
export default FundsTransfer;
