import TopUp from "../models/topUp.model.js";
import Customer from "../models/customer.model.js";
import { validationResult } from "express-validator";

// top up dummy balance
export const topUpAccount = async (req, res) => {
  // validate the request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // console.log("top up api accessed");
  // return res.status(400).json({ error: "just a test error" });

  const customerId = req.customer.userId;
  const { amount, topUpThrough } = req.body;

  try {
    // find the customer
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // create a top up record
    const topUp = new TopUp({
      amount,
      topUpThrough,
      customerId,
    });

    // update the customer balance
    customer.balance += Number(amount);

    // save the changes to the database
    Promise.all([topUp.save(), customer.save()]);

    // return the updated customer profile and top up record
    res.status(200).json({
      message: `Top up of ${amount} through ${topUpThrough} successful`,
      // customer,
      // topUp,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// top up history
export const getTopUpHistory = async (req, res) => {
  // get customer id from the protect customer middleware
  const customerId = req.customer.userId;

  try {
    // find top up history using customer id
    const topUpHistory = await TopUp.find({ customerId }).sort({
      createdAt: -1,
    });

    if (!topUpHistory || topUpHistory.length === 0) {
      // console.log("no top up history found");
      return res
        .status(404)
        .json({ error: "No top up history found for this customer" });
    }
    console.log(topUpHistory);

    // return the top up history
    res.status(200).json({
      message: "Top up history successfully retrieved",
      topUpHistory,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
