import { db } from "../utils/db.js";
import { webhookQueue } from "../utils/webhookQueue.js";

export const retryWebhook = async (req, res) => {
  try {
    const merchantId = req.merchant.id;
    const webhookId = req.params.webhookId;

    // check webhook log exists + belongs to merchant
    const result = await db.query(
      "SELECT * FROM webhook_logs WHERE id=$1 AND merchant_id=$2",
      [webhookId, merchantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND_ERROR",
          description: "Webhook log not found"
        }
      });
    }

    const webhookLog = result.rows[0];

    // reset attempts and set pending
    await db.query(
      `
      UPDATE webhook_logs
      SET status='pending',
          attempts=0,
          last_attempt_at=NULL,
          next_retry_at=NULL,
          response_code=NULL,
          response_body=NULL
      WHERE id=$1
      `,
      [webhookId]
    );

    // enqueue job again
    await webhookQueue.add("deliver-webhook", {
      merchantId: webhookLog.merchant_id,
      event: webhookLog.event,
      payload: webhookLog.payload
    });

    return res.status(200).json({
      id: webhookId,
      status: "pending",
      message: "Webhook retry scheduled"
    });
  } catch (err) {
    console.error("retryWebhook error:", err);
    return res.status(500).json({
      error: {
        code: "SERVER_ERROR",
        description: "Something went wrong"
      }
    });
  }
};
export const listWebhooks = async (req, res) => {
  try {
    const merchantId = req.merchant.id;

    const limit = Number(req.query.limit || 10);
    const offset = Number(req.query.offset || 0);

    const logsRes = await db.query(
      `
      SELECT id, event, status, attempts, created_at, last_attempt_at, response_code
      FROM webhook_logs
      WHERE merchant_id=$1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [merchantId, limit, offset]
    );

    const countRes = await db.query(
      `SELECT COUNT(*)::int AS total FROM webhook_logs WHERE merchant_id=$1`,
      [merchantId]
    );

    return res.status(200).json({
      data: logsRes.rows,
      total: countRes.rows[0].total,
      limit,
      offset
    });
  } catch (err) {
    console.error("listWebhooks error:", err);
    return res.status(500).json({
      error: {
        code: "SERVER_ERROR",
        description: "Something went wrong"
      }
    });
  }
};

