import express from "express";
import {
  createPayment,
  getPayment,
  listPayments
} from "../controllers/payment.controller.js";
import { createRefund } from "../controllers/payment.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";


const router = express.Router();

router.post("/api/v1/payments", createPayment);
router.get("/api/v1/payments/:paymentId", getPayment);
router.get("/api/v1/payments", listPayments);
router.post(
  "/api/v1/payments/:paymentId/refunds",
  authMiddleware,
  createRefund
);


export default router;
