import { Worker } from "bullmq";
import IORedis from "ioredis";
import { db } from "./utils/db.js";
import { webhookQueue } from "./utils/webhookQueue.js";

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null
});

console.log("🚀 Payment Worker starting...");

new Worker(
  "payment-queue",
  async job => {
    const { paymentId } = job.data;
    console.log("📦 Processing payment:", paymentId);

    // 1️⃣ Fetch payment
    const result = await db.query(
      "SELECT * FROM payments WHERE id = $1",
      [paymentId]
    );

    if (result.rows.length === 0) {
      throw new Error("Payment not found");
    }

    const payment = result.rows[0];

    // 2️⃣ Simulate delay
    const delay =
      process.env.TEST_MODE === "true"
        ? Number(process.env.TEST_PROCESSING_DELAY || 1000)
        : Math.floor(Math.random() * 5000) + 5000;

    await new Promise(r => setTimeout(r, delay));

    // 3️⃣ Decide success/failure
    const success =
      process.env.TEST_MODE === "true"
        ? process.env.TEST_PAYMENT_SUCCESS !== "false"
        : Math.random() <
          (payment.method === "upi" ? 0.9 : 0.95);

    if (success) {
      // ✅ Update DB
      await db.query(
        "UPDATE payments SET status='success', updated_at=NOW() WHERE id=$1",
        [paymentId]
      );

    console.log("🔔 Enqueuing SUCCESS webhook for:", paymentId);

await webhookQueue.add("deliver-webhook", {
  merchantId: payment.merchant_id,
  event: "payment.success",
  payload: {
    event: "payment.success",
    timestamp: Math.floor(Date.now() / 1000),
    data: { payment }
  }
});


    } else {
      // ❌ Update DB
      await db.query(
        `
        UPDATE payments
        SET status='failed',
            error_code='PAYMENT_FAILED',
            error_description='Payment failed',
            updated_at=NOW()
        WHERE id=$1
        `,
        [paymentId]
      );

      console.log("❌ Payment failed:", paymentId);

      // 🔔 Enqueue webhook (FAILED)
      await webhookQueue.add("deliver-webhook", {
        merchantId: payment.merchant_id,
        event: "payment.failed",
        payload: {
          event: "payment.failed",
          timestamp: Math.floor(Date.now() / 1000),
          data: { payment }
        }
      });
    }
  },
  { connection }
);

console.log("✅ Payment Worker connected to Redis");
