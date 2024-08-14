import Transaction from "../models/transaction.model.js";
import Customer from "../models/customer.model.js";
import Employee from "../models/employee.model.js";
import Pump from "../models/pump.model.js";
import { validationResult } from "express-validator";
import { Expo } from "expo-server-sdk";

// accessed by customers to view their transaction history
export const getCustomerTransactionHistory = async (req, res) => {
  // retreive the customer id from the protecgt customer middleware
  const customerId = req.customer.userId;

  // testing error response
  // return res.status(400).json({ error: "this is just a test error" });

  try {
    // find transactions using customer id

    const transactions = await Transaction.find({ customerId })
      .sort({ createdAt: -1 })
      .populate("pumpId", "name") // Populate pump details
      .populate("employeeId", "name"); // Populate employee details

    if (!transactions || transactions.length === 0) {
      return res
        .status(404)
        .json({ error: "No transactions found for this customer" });
    }

    // return the transaction history
    res.status(200).json({
      message: "Transaction history successfully retrieved",
      transactions,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// accessed by employees to get thier own transaction history
export const getRefuelerTransactionHistory = async (req, res) => {
  // get employee id from the protect employee route middleware

  const employeeId = req.employee.userId;
  try {
    // find transactions in the Transaction model
    const refuelerTransactions = await Transaction.find({ employeeId })
      .sort({ createdAt: -1 })
      .populate("customerId", "name");

    if (refuelerTransactions.length === 0) {
      return res.status(404).json({ error: "No refueler transactions found" });
    }

    // return the refueler transaction history
    res.status(200).json({
      message: "Refueler transaction history successfully retrieved",
      transactions: refuelerTransactions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ........................................ //
// performs bad needs optimization
// accessed by managers to geth thier employees transaction history
export const getEmployeeTransactionHistory = async (req, res) => {
  // Get manager id from the protect employee route middleware
  const managerId = req.employee.userId;

  const { employeeId } = req.body;

  try {
    // Find manager in the employee table
    const managerEmployee = await Employee.findById(managerId).lean();

    // Check if manager type is not manager
    if (managerEmployee.type !== "manager") {
      return res.status(403).json({
        error: "Access denied! Employee History only available to the manager",
      });
    }

    // Find employee in the employee table
    const employee = await Employee.findById(employeeId);
    // Check if employee exists
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Find transactions in the Transaction model
    const employeeTransactions = await Transaction.find({
      employeeId: employeeId,
    })
      .sort({ createdAt: -1 })
      .populate("customerId", "name")
      .lean(); // Use lean for better performance

    // If no transactions are found
    if (employeeTransactions.length === 0) {
      return res.status(404).json({ error: "No employee transactions found" });
    }

    // Return the employee transaction history
    res.status(200).json({
      message: "Employee transaction history successfully retrieved",
      transactions: employeeTransactions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// accessed by employees to create a transaction
export const createTransaction = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { amount, paymentMethod, fuelType, fuelAmount, customerId } = req.body;
  const employeeId = req.employee.userId;

  try {
    // Find customer in the database
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Check if customer does not have enough balance
    if (paymentMethod === "app" && amount > customer.balance) {
      return res.status(403).json({
        error: "Customer has Insufficient funds, Can not pay with app",
      });
    }

    // Find employee in the database
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Find pump in the database
    const pump = await Pump.findById(employee.pumpId);
    if (!pump) {
      return res.status(404).json({ error: "Pump not found" });
    }

    let transaction;

    if (paymentMethod === "app") {
      // Subtract amount from customer balance
      customer.balance -= amount;

      // Add amount to pump balance (ensure you have a balance field in Pump schema)
      pump.balance += amount;

      // Create transaction
      transaction = new Transaction({
        amount,
        paymentMethod,
        fuelType,
        fuelAmount,
        customerId,
        pumpId: pump._id,
        employeeId,
      });

      // Save transaction, customer, and pump to the database
      await Promise.all([transaction.save(), customer.save(), pump.save()]);
    } else {
      // If payment through cash
      // Create transaction
      transaction = new Transaction({
        amount,
        paymentMethod,
        fuelType,
        fuelAmount,
        customerId,
        pumpId: pump._id,
        employeeId,
      });

      // Save transaction
      await transaction.save();
    }
    // Check if customer and employee have push tokens
    if (!customer.pushToken) {
      console.error("Customer does not have a push token");
    }

    if (!employee.pushToken) {
      console.error("Employee does not have a push token");
    }

    // Function to send notifications
    async function sendNotifications(
      customerToken,
      employeeToken,
      amount,
      fuelAmount,
      fuelType,
      customerName,
      transactionId
    ) {
      let expo = new Expo({
        accessToken: process.env.EXPO_ACCESS_TOKEN,
        useFcmV1: false,
      });

      let messages = [];

      // Prepare message for customer
      if (Expo.isExpoPushToken(customerToken)) {
        messages.push({
          to: customerToken,
          sound: "default",
          body: `Transaction of ${amount} completed for ${fuelAmount} ${fuelType}`,
          data: { transactionId: transactionId },
        });
      } else {
        console.error(
          `Customer push token ${customerToken} is not a valid Expo push token`
        );
      }

      // Prepare message for refueler
      if (Expo.isExpoPushToken(employeeToken)) {
        messages.push({
          to: employeeToken,
          sound: "default",
          body: `Transaction of ${amount} completed for customer ${customerName}`,
          data: { transactionId: transactionId },
        });
      } else {
        console.error(
          `Employee push token ${employeeToken} is not a valid Expo push token`
        );
      }

      let chunks = expo.chunkPushNotifications(messages);
      let tickets = [];
      for (let chunk of chunks) {
        try {
          let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          console.log(ticketChunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error("Error sending push notification:", error);
        }
      }

      let receiptIds = [];
      for (let ticket of tickets) {
        if (ticket.status === "ok") {
          receiptIds.push(ticket.id);
        }
      }

      let receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
      for (let chunk of receiptIdChunks) {
        try {
          let receipts = await expo.getPushNotificationReceiptsAsync(chunk);
          console.log(receipts);

          for (let receiptId in receipts) {
            let { status, message, details } = receipts[receiptId];
            if (status === "ok") {
              continue;
            } else if (status === "error") {
              console.error(
                `There was an error sending a notification: ${message}`
              );
              if (details && details.error) {
                console.error(`The error code is ${details.error}`);
              }
            }
          }
        } catch (error) {
          console.error(error);
        }
      }
    }

    // Call the sendNotifications function
    await sendNotifications(
      customer.pushToken,
      employee.pushToken,
      amount,
      fuelAmount,
      fuelType,
      customer.name,
      transaction._id
    );

    res.status(200).json({
      message:
        paymentMethod === "app"
          ? "Transaction successful, payment received through app"
          : "Transaction successful, kindly take cash payment from customer",
      transaction,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
