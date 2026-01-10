import express from "express";
import {
  createPayment,
  getPayment,
  listPayments
} from "../controllers/payment.controller.js";

const router = express.Router();

// LIST PAYMENTS (FOR DASHBOARD & TRANSACTIONS)
router.get("/api/v1/payments", listPayments);

// CREATE PAYMENT
router.post("/api/v1/payments", createPayment);

// GET PAYMENT BY ID
router.get("/api/v1/payments/:paymentId", getPayment);

export default router;
