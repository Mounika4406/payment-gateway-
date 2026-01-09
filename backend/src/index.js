import express from "express";
import { env } from "./config/env.js";
import healthRoutes from "./routes/health.routes.js";
import checkoutRoutes from "./routes/checkout.routes.js";
import { authenticateMerchant } from "./middleware/auth.middleware.js";
import orderRoutes from "./routes/order.routes.js";
import paymentRoutes from "./routes/payment.routes.js";

const app = express();

app.use(express.json());


// Public
app.use(healthRoutes);
app.use("/checkout", checkoutRoutes);


// Auth-required
app.use(authenticateMerchant);
app.use(orderRoutes);
app.use(paymentRoutes);


/* =========================
   PUBLIC ROUTES (NO AUTH)
========================= */

app.listen(env.PORT, () => {
  console.log(`API running on port ${env.PORT}`);
});

