import { Worker } from "bullmq";
import IORedis from "ioredis";
import fetch from "node-fetch";
import { db } from "./utils/db.js";
import { generateWebhookSignature } from "./utils/webhook.js";

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null
});

const RETRY_DELAYS_TEST = [0, 5, 10, 15, 20];

console.log("🟣 Webhook Worker booted");

new Worker(
  "webhook-queue",
  async job => {
    try {
      console.log("📨 Webhook job received:", job.id, job.data.event);

      const { merchantId, event, payload } = job.data;

      // 1️⃣ Fetch merchant
      const merchantRes = await db.query(
        "SELECT webhook_url, webhook_secret FROM merchants WHERE id = $1",
        [merchantId]
      );

      if (merchantRes.rows.length === 0) {
        console.log("⚠️ Merchant not found");
        return;
      }

      const { webhook_url, webhook_secret } = merchantRes.rows[0];

      if (!webhook_url || !webhook_secret) {
        console.log("⚠️ Missing webhook_url or webhook_secret");
        return;
      }

      // 2️⃣ Prepare payload
      const payloadString = JSON.stringify(payload);
      const signature = generateWebhookSignature(
        payloadString,
        webhook_secret
      );

      // 3️⃣ Insert log
      const logRes = await db.query(
        `
        INSERT INTO webhook_logs
        (id, merchant_id, event, payload, status, attempts, created_at)
        VALUES (gen_random_uuid(), $1, $2, $3, 'pending', 0, NOW())
        RETURNING id
        `,
        [merchantId, event, payload]
      );

      const webhookLogId = logRes.rows[0].id;

      // 4️⃣ Attempt delivery
      for (let attempt = 0; attempt < RETRY_DELAYS_TEST.length; attempt++) {
        try {
          console.log(`🌐 Sending webhook attempt ${attempt + 1}`);

          const res = await fetch(webhook_url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Webhook-Signature": signature
            },
            body: payloadString
          });

          if (res.ok) {
            await db.query(
              `
              UPDATE webhook_logs
              SET status='success',
                  attempts=$2,
                  response_code=$3,
                  last_attempt_at=NOW()
              WHERE id=$1
              `,
              [webhookLogId, attempt + 1, res.status]
            );

            console.log("✅ Webhook delivered successfully");
            return;
          } else {
            throw new Error(`HTTP ${res.status}`);
          }
        } catch (err) {
          console.error(
            `❌ Webhook attempt ${attempt + 1} failed:`,
            err.message
          );

          await db.query(
            `
            UPDATE webhook_logs
            SET attempts=$2, last_attempt_at=NOW()
            WHERE id=$1
            `,
            [webhookLogId, attempt + 1]
          );

          if (attempt + 1 < RETRY_DELAYS_TEST.length) {
            await new Promise(r =>
              setTimeout(r, RETRY_DELAYS_TEST[attempt + 1] * 1000)
            );
          }
        }
      }

      await db.query(
        "UPDATE webhook_logs SET status='failed' WHERE id=$1",
        [webhookLogId]
      );

      console.log("🚨 Webhook permanently failed");
    } catch (err) {
      // 🚨 THIS IS THE KEY
      console.error("🔥 FATAL WEBHOOK WORKER ERROR:", err);
      throw err; // force BullMQ to log it
    }
  },
  { connection }
);
