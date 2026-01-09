import express from "express";
import {
  getCheckoutOrder,
  createCheckoutPayment,
} from "../controllers/checkout.controller.js";

const router = express.Router();

// ✅ paths relative to /checkout
router.get("/orders/:orderId", getCheckoutOrder);
router.post("/payments", createCheckoutPayment);

export default router;
