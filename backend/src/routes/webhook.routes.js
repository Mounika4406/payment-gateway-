import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { retryWebhook, listWebhooks } from "../controllers/webhook.controller.js";

const router = express.Router();

// LIST WEBHOOK LOGS
router.get("/api/v1/webhooks", authMiddleware, listWebhooks);

// RETRY WEBHOOK
router.post("/api/v1/webhooks/:webhookId/retry", authMiddleware, retryWebhook);

export default router;
