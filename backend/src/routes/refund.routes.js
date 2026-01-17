import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { getRefund } from "../controllers/refund.controller.js";

const router = express.Router();

// GET REFUND BY ID
router.get("/api/v1/refunds/:refundId", authMiddleware, getRefund);

export default router;
