import express from "express";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import authCustomerRoutes from "./routes/auth.customerRoutes.js";
import authEmployeeRoutes from "./routes/auth.employeeRoutes.js";
import authAdminRoutes from "./routes/auth.adminRoutes.js";

import pumpRoutes from "./routes/pump.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import employeeRoutes from "./routes/employee.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import fundsTransferRoutes from "./routes/fundsTransfer.routes.js";
import topUpRoutes from "./routes/topUp.routes.js";
import adminRoutes from "./routes/admin.routes.js";

import connectToMongoDB from "./db/connectToMongoDB.js";

import serverless from "serverless-http";

const app = express();
const PORT = process.env.PORT || 5000;

config();

app.use(express.json({ limit: "10mb" })); // to parse the incoming request with JSON payloads (from req.body)
app.use(cookieParser());

// app.use(
//   cors({
//     origin: "http://localhost:3000",
//     methods: "GET,POST,PUT,DELETE,OPTIONS",
//     allowedHeaders: "Content-Type,Authorization",
//     credentials: true,
//   })
// );

app.use(
  cors({
    origin: "https://pakfuel-admin.netlify.app",
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization",
    credentials: true,
  })
);

app.use("/api/auth/customer", authCustomerRoutes);
app.use("/api/auth/employee", authEmployeeRoutes);
app.use("/api/auth/admin", authAdminRoutes);

app.use("/api/pump", pumpRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/transaction", transactionRoutes);
app.use("/api/fundsTransfer", fundsTransferRoutes);
app.use("/api/topUp", topUpRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(PORT, () => {
  connectToMongoDB();
  console.log(
    `Server listening on port ${PORT}, in ${process.env.NODE_ENV} mode`
  );
});

export const handler = serverless(api);
