import express from "express";
import cors from "cors";

import { env } from "./config/env.js";
import healthRoutes from "./routes/health.routes.js";
import checkoutRoutes from "./routes/checkout.routes.js";
import publicOrderRoutes from "./routes/public-order.routes.js";
import testRoutes from "./routes/test.routes.js";

import { authMiddleware } from "./middleware/auth.middleware.js";
import refundRoutes from "./routes/refund.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";



import orderRoutes from "./routes/order.routes.js";
import paymentRoutes from "./routes/payment.routes.js";

const app = express();

/* =========================
   CORS (THIS IS THE FIX)
========================= */
app.use(cors({
  origin: "*", // allow requests from checkout (3001) & dashboard (3000)
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "X-Api-Key", "X-Api-Secret"]
}));

/* =========================
   BODY PARSER
========================= */
app.use(express.json());

// PUBLIC
app.use(healthRoutes);
app.use(checkoutRoutes);
app.use(publicOrderRoutes);   // 👈 ADD THIS

// AUTH REQUIRED
app.use(testRoutes);
app.use(authMiddleware);


app.use(webhookRoutes);

app.use(refundRoutes);


app.use(orderRoutes);
app.use(paymentRoutes);
/* =========================
   START SERVER
========================= */
app.listen(env.PORT, () => {
  console.log(`API running on port ${env.PORT}`);
});
