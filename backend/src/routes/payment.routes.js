import express from "express";
import {
  createPayment,
  getPayment,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/api/v1/payments", createPayment);
router.get("/api/v1/payments/:paymentId", getPayment);

export default router;
