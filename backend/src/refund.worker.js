import { Worker } from "bullmq";
import IORedis from "ioredis";
import { db } from "./utils/db.js";
import { webhookQueue } from "./utils/webhookQueue.js";

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null
});

console.log("🟠 Refund Worker booted");

new Worker(
  "refund-queue",
  async job => {
    const { refundId } = job.data;
    console.log("💸 Processing refund:", refundId);

    // 1) Fetch refund
    const refundRes = await db.query("SELECT * FROM refunds WHERE id=$1", [
      refundId
    ]);

    if (refundRes.rows.length === 0) throw new Error("Refund not found");
    const refund = refundRes.rows[0];

    // 2) Fetch payment
    const payRes = await db.query("SELECT * FROM payments WHERE id=$1", [
      refund.payment_id
    ]);
    if (payRes.rows.length === 0) throw new Error("Payment not found");
    const payment = payRes.rows[0];

    if (payment.status !== "success") {
      throw new Error("Payment not refundable");
    }

    // 3) simulate delay 3-5 sec
    const delay = Math.floor(Math.random() * 2000) + 3000;
    await new Promise(r => setTimeout(r, delay));

    // 4) mark refund processed
    const updatedRefundRes = await db.query(
      `
      UPDATE refunds
      SET status='processed',
          processed_at=NOW()
      WHERE id=$1
      RETURNING *
      `,
      [refundId]
    );

    const processedRefund = updatedRefundRes.rows[0];

    console.log("✅ Refund processed:", refundId);

    // 5) enqueue refund.processed webhook
    await webhookQueue.add("deliver-webhook", {
      merchantId: processedRefund.merchant_id,
      event: "refund.processed",
      payload: {
        event: "refund.processed",
        timestamp: Math.floor(Date.now() / 1000),
        data: {
          refund: {
            id: processedRefund.id,
            payment_id: processedRefund.payment_id,
            amount: processedRefund.amount,
            reason: processedRefund.reason,
            status: processedRefund.status,
            created_at: processedRefund.created_at,
            processed_at: processedRefund.processed_at
          }
        }
      }
    });
  },
  { connection }
);
