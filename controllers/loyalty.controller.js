import Pump from "../models/pump.model.js";
import Customer from "../models/customer.model.js";
import { validationResult } from "express-validator";

// Set loyalty threshold for a pump
export const setLoyaltyThreshold = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { pumpId, threshold } = req.body;
  const managerId = req.employee.userId;
  try {
    const pump = await Pump.findById(pumpId);
    if (!pump) {
      return res.status(404).json({ error: "Pump not found" });
    }

    if (pump.manager.toString() !== managerId) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    pump.loyaltyThreshold = threshold;
    await pump.save();

    res
      .status(200)
      .json({ message: "Loyalty threshold updated successfully", pump });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get customer's loyalty points for all pumps
export const getCustomerLoyaltyPoints = async (req, res) => {
  const customerId = req.customer.userId;

  try {
    const customer = await Customer.findById(customerId)
      .select("loyaltyPoints")
      .populate("loyaltyPoints.pumpId", "name");

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.status(200).json({ loyaltyPrograms: customer.loyaltyPoints });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Redeem loyalty points for a customer
export const redeemLoyaltyPoints = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { pumpId } = req.body;
  const customerId = req.customer.userId;

  try {
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const loyaltyProgram = customer.loyaltyPoints.find(
      (lp) => lp.pumpId.toString() === pumpId
    );

    if (!loyaltyProgram) {
      return res
        .status(404)
        .json({ error: "Loyalty program not found for this pump" });
    }

    if (loyaltyProgram.points < 100) {
      return res
        .status(400)
        .json({ error: "Not enough loyalty points to redeem" });
    }

    // Redeem points
    loyaltyProgram.points -= 100;
    customer.balance += 100;

    await customer.save();

    res
      .status(200)
      .json({ message: "Loyalty points redeemed successfully", customer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
