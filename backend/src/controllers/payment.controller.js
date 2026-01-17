import { db } from "../utils/db.js";
import { paymentQueue } from "../utils/queue.js";
import { refundQueue } from "../utils/refundQueue.js"; 

/**
 * CREATE PAYMENT (ASYNC – DELIVERABLE 2)
 */
export const createPayment = async (req, res) => {
  try {
    const { order_id, method, vpa, card } = req.body;

    // --- BASIC VALIDATION ---
    if (!order_id || !method) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "order_id and method are required"
        }
      });
    }

    // --- FETCH ORDER ---
    const orderResult = await db.query(
      "SELECT * FROM orders WHERE id = $1",
      [order_id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND_ERROR",
          description: "Order not found"
        }
      });
    }

    const order = orderResult.rows[0];

    // --- CREATE PAYMENT ID ---
    const paymentId =
      "pay_" + Math.random().toString(36).substring(2, 18);

    // --- METHOD HANDLING ---
    let cardNetwork = null;
    let cardLast4 = null;

    if (method === "upi") {
      if (!vpa) {
        return res.status(400).json({
          error: {
            code: "BAD_REQUEST_ERROR",
            description: "VPA is required for UPI payments"
          }
        });
      }
    }

    if (method === "card") {
      if (!card || !card.number) {
        return res.status(400).json({
          error: {
            code: "BAD_REQUEST_ERROR",
            description: "Card details are required"
          }
        });
      }

      cardLast4 = card.number.slice(-4);
      cardNetwork = card.number.startsWith("4")
        ? "visa"
        : "unknown";
    }

    // --- INSERT PAYMENT (PENDING) ---
    const paymentResult = await db.query(
      `
      INSERT INTO payments (
        id,
        order_id,
        merchant_id,
        amount,
        currency,
        method,
        vpa,
        card_network,
        card_last4,
        status,
        created_at,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending',NOW(),NOW())
      RETURNING *
      `,
      [
        paymentId,
        order.id,
        order.merchant_id,
        order.amount,
        order.currency,
        method,
        vpa || null,
        cardNetwork,
        cardLast4
      ]
    );

    const payment = paymentResult.rows[0];

    // --- ENQUEUE BACKGROUND JOB ---
    await paymentQueue.add("process-payment", {
      paymentId: payment.id
    });

    // --- RETURN IMMEDIATELY ---
    return res.status(201).json({
      id: payment.id,
      order_id: payment.order_id,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      vpa: payment.vpa,
      card_network: payment.card_network,
      card_last4: payment.card_last4,
      status: "pending",
      created_at: payment.created_at
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        description: "Something went wrong"
      }
    });
  }
};

/**
 * GET PAYMENT BY ID
 */
export const getPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const result = await db.query(
      "SELECT * FROM payments WHERE id = $1",
      [paymentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND_ERROR",
          description: "Payment not found"
        }
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        description: "Something went wrong"
      }
    });
  }
};

/**
 * LIST PAYMENTS (DASHBOARD)
 */
export const listPayments = async (req, res) => {
  const result = await db.query(
    "SELECT * FROM payments ORDER BY created_at DESC"
  );
  return res.status(200).json(result.rows);
};
// add at top

function generateRefundId() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let random = "";
  for (let i = 0; i < 16; i++) {
    random += chars[Math.floor(Math.random() * chars.length)];
  }
  return `rfnd_${random}`;
}

export const createRefund = async (req, res) => {
  try {
    const merchant = req.merchant; // from authMiddleware
    const { paymentId } = req.params;
    const { amount, reason } = req.body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "amount is required"
        }
      });
    }

    // 1) fetch payment and ensure belongs to merchant
    const payRes = await db.query(
      "SELECT * FROM payments WHERE id=$1 AND merchant_id=$2",
      [paymentId, merchant.id]
    );

    if (payRes.rows.length === 0) {
      return res.status(404).json({
        error: { code: "NOT_FOUND_ERROR", description: "Payment not found" }
      });
    }

    const payment = payRes.rows[0];

    // 2) only success payments refundable
    if (payment.status !== "success") {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "Payment not in refundable state"
        }
      });
    }

    // 3) total refunded amount (processed + pending)
    const totalRefundRes = await db.query(
      `
      SELECT COALESCE(SUM(amount),0) as total
      FROM refunds
      WHERE payment_id=$1 AND (status='processed' OR status='pending')
      `,
      [paymentId]
    );

    const totalRefunded = Number(totalRefundRes.rows[0].total);
    const available = payment.amount - totalRefunded;

    if (amount > available) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "Refund amount exceeds available amount"
        }
      });
    }

    // 4) create refund row
    let refundId = generateRefundId();

    // collision protection
    let exists = true;
    while (exists) {
      const check = await db.query("SELECT id FROM refunds WHERE id=$1", [
        refundId
      ]);
      if (check.rows.length === 0) exists = false;
      else refundId = generateRefundId();
    }

    const refundRes = await db.query(
      `
      INSERT INTO refunds (id, payment_id, merchant_id, amount, reason, status, created_at)
      VALUES ($1,$2,$3,$4,$5,'pending', NOW())
      RETURNING *
      `,
      [refundId, paymentId, merchant.id, amount, reason || null]
    );

    const refund = refundRes.rows[0];

    // 5) enqueue refund job
    await refundQueue.add("process-refund", { refundId });

    return res.status(201).json({
      id: refund.id,
      payment_id: refund.payment_id,
      amount: refund.amount,
      reason: refund.reason,
      status: refund.status,
      created_at: refund.created_at
    });
  } catch (err) {
    console.error("createRefund error:", err);
    return res.status(500).json({
      error: { code: "SERVER_ERROR", description: "Something went wrong" }
    });
  }
};
