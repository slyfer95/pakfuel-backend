import FundsTransfer from "../models/fundsTransfer.model.js";
import { validationResult } from "express-validator";
import Customer from "../models/customer.model.js";

// funds transfer history
export const getFundsTransferHistory = async (req, res) => {
  // retreive the customer id from the protect customer middleware
  const customerId = req.customer.userId;

  try {
    // find funds transfer history using customer id
    // this wont work need to find transfers where sender or receiver is customerId
    const fundsTransferHistory = await FundsTransfer.find({
      $or: [{ senderId: customerId }, { receiverId: customerId }],
    })
      .sort({ createdAt: -1 })
      .populate("receiverId", "name email phoneNumber")
      .populate("senderId", "name email phoneNumber");

    if (!fundsTransferHistory || fundsTransferHistory.length === 0) {
      return res
        .status(404)
        .json({ error: "No funds transfer history found for this customer" });
    }

    // return the funds transfer history
    res.status(200).json({
      message: "Funds transfer history successfully retrieved",
      fundsTransferHistory,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// balance or points transfer
export const transferFunds = async (req, res) => {
  // console.log("transfer funds accessed");
  // validate the request
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const customerId = req.customer.userId;
  const { amount, entityTransfered, receiverId } = req.body;

  // console.log(typeof amount);

  try {
    // find the sender and receiver customer profile
    const sender = await Customer.findById(customerId);
    const receiver = await Customer.findById(receiverId);

    // console.log(sender.name);
    // console.log(receiver.name);

    // return res.status(400).json({ error: "checking the api" });

    if (!receiver) {
      return res.status(404).json({ error: "Receiver not found" });
    }

    // when sending points check if sender has sufficien points
    if (entityTransfered === "points" && sender.points < amount) {
      return res.status(400).json({ error: "Insufficient points" });
    }

    // when sending balance check if sender has sufficient balance
    if (entityTransfered === "balance" && sender.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // if transfering balance transfer the balance
    if (entityTransfered === "balance") {
      sender.balance = sender.balance - Number(amount);
      receiver.balance = receiver.balance + Number(amount);
    }

    // if transfering points transfer the points
    if (entityTransfered === "points") {
      sender.points -= amount;
      receiver.points += amount;
    }

    // create a funds transfer record
    const fundsTransfer = new FundsTransfer({
      amount,
      entityTransfered,
      senderId: customerId,
      receiverId,
    });

    // save the changes to the database in a single promise
    Promise.all([sender.save(), receiver.save(), fundsTransfer.save()]);

    // Send notifications to both sender and receiver
    async function sendFundsTransferNotifications(
      senderToken,
      receiverToken,
      amount,
      entityTransfered
    ) {
      let expo = new Expo({
        accessToken: process.env.EXPO_ACCESS_TOKEN,
        useFcmV1: true,
      });

      let senderMessages = [];
      let receiverMessages = [];

      // Prepare message for sender
      if (Expo.isExpoPushToken(senderToken)) {
        senderMessages.push({
          to: senderToken,
          sound: "default",
          body: `You have successfully transferred ${amount} ${entityTransfered} to ${receiver.name}`,
          data: { transactionId: fundsTransfer._id },
        });
      } else {
        console.error(
          `Sender push token ${senderToken} is not a valid Expo push token`
        );
      }

      // Prepare message for receiver
      if (Expo.isExpoPushToken(receiverToken)) {
        receiverMessages.push({
          to: receiverToken,
          sound: "default",
          body: `You have received ${amount} ${entityTransfered} from ${sender.name}`,
          data: { transactionId: fundsTransfer._id },
        });
      } else {
        console.error(
          `Receiver push token ${receiverToken} is not a valid Expo push token`
        );
      }

      // Send sender notifications
      if (senderMessages.length > 0) {
        let senderChunks = expo.chunkPushNotifications(senderMessages);
        for (let chunk of senderChunks) {
          try {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            console.log(ticketChunk);
          } catch (error) {
            console.error("Error sending sender push notification:", error);
          }
        }
      }

      // Send receiver notifications
      if (receiverMessages.length > 0) {
        let receiverChunks = expo.chunkPushNotifications(receiverMessages);
        for (let chunk of receiverChunks) {
          try {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            console.log(ticketChunk);
          } catch (error) {
            console.error("Error sending receiver push notification:", error);
          }
        }
      }
    }

    // Call the sendFundsTransferNotifications function
    await sendFundsTransferNotifications(
      sender.pushToken,
      receiver.pushToken,
      amount,
      entityTransfered
    );

    // return the updated customer profiles and funds trnasfer record
    res.status(200).json({
      message: "Balance transfer successful",
      sender,
      receiver,
      fundsTransfer,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// find the receiver for transfer fund (customer access)
export const findReceiver = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { phoneNumber } = req.body;
  const sender = req.customer.userId;
  // console.log(req.body);
  // console.log(phoneNumber);
  // const sender = req.customer.userId;

  try {
    // find receiver using email
    const receiver = await Customer.findOne({ phoneNumber });

    if (!receiver) {
      return res.status(404).json({ error: "Receiver not found" });
    }

    if (!receiver.isVerified) {
      return res.status(401).json({ error: "Receiver not verified" });
    }

    if (receiver._id.equals(sender)) {
      return res.status(400).json({ error: "You cannot transfer to yourself" });
    }

    // return the receiver profile
    res.status(200).json({
      message: "Receiver profile successfully retrieved",
      receiver,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
