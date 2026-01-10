import { pool } from "../db/pool.js";
import { processPaymentAsync } from "../services/payment-processor.js";

import { generatePaymentId } from "../utils/payment-id.util.js";
import { isValidVPA } from "../utils/vpa.util.js";
import { isValidCardNumber } from "../utils/luhn.util.js";
import { detectCardNetwork } from "../utils/card-network.util.js";
import { isValidExpiry } from "../utils/expiry.util.js";

/**
 * CREATE PAYMENT
 */
export const createPayment = async (req, res) => {
  const { order_id, method } = req.body;

  // 1️⃣ Validate order ownership
  const orderResult = await pool.query(
    `SELECT id, amount, currency
     FROM orders
     WHERE id = $1 AND merchant_id = $2`,
    [order_id, req.merchant.id]
  );

  if (orderResult.rows.length === 0) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND_ERROR",
        description: "Order not found",
      },
    });
  }

  const order = orderResult.rows[0];
  const paymentId = generatePaymentId();

  /**
   * 2️⃣ UPI PAYMENT
   */
  if (method === "upi") {
    const { vpa } = req.body;

    if (!isValidVPA(vpa)) {
      return res.status(400).json({
        error: {
          code: "INVALID_VPA",
          description: "Invalid VPA",
        },
      });
    }

    await pool.query(
      `INSERT INTO payments (
        id,
        order_id,
        merchant_id,
        amount,
        currency,
        method,
        status,
        vpa
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        paymentId,
        order.id,
        req.merchant.id,
        order.amount,
        order.currency,
        "upi",
        "processing",
        vpa,
      ]
    );

    // ✅ START ASYNC PROCESSING
    processPaymentAsync(paymentId, "upi");

    return res.status(200).json({
      id: paymentId,
      status: "processing",
    });
  }

  /**
   * 3️⃣ CARD PAYMENT
   */
  if (method === "card") {
    const { card } = req.body;

    if (!card) {
      return res.status(400).json({
        error: {
          code: "INVALID_CARD",
          description: "Invalid card details",
        },
      });
    }

    const { number, expiry } = card;

    if (!isValidCardNumber(number)) {
      return res.status(400).json({
        error: {
          code: "INVALID_CARD",
          description: "Invalid card number",
        },
      });
    }

    if (!isValidExpiry(expiry)) {
      return res.status(400).json({
        error: {
          code: "EXPIRED_CARD",
          description: "Card expired",
        },
      });
    }

    const cardNetwork = detectCardNetwork(number);
    const last4 = number.replace(/[\s-]/g, "").slice(-4);

    await pool.query(
      `INSERT INTO payments (
        id,
        order_id,
        merchant_id,
        amount,
        currency,
        method,
        status,
        card_network,
        card_last4
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        paymentId,
        order.id,
        req.merchant.id,
        order.amount,
        order.currency,
        "card",
        "processing",
        cardNetwork,
        last4,
      ]
    );

    // ✅ START ASYNC PROCESSING
    processPaymentAsync(paymentId, "card");

    return res.status(200).json({
      id: paymentId,
      status: "processing",
    });
  }

  /**
   * 4️⃣ Unsupported method
   */
  return res.status(400).json({
    error: {
      code: "BAD_REQUEST_ERROR",
      description: "Unsupported payment method",
    },
  });
};

/**
 * GET PAYMENT STATUS
 */
export const getPayment = async (req, res) => {
  const { paymentId } = req.params;

  const { rows } = await pool.query(
    `SELECT id, status, error_code, error_description
     FROM payments
     WHERE id = $1 AND merchant_id = $2`,
    [paymentId, req.merchant.id]
  );

  if (rows.length === 0) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND_ERROR",
        description: "Payment not found",
      },
    });
  }

  const payment = rows[0];

  if (payment.status === "failed") {
    return res.status(200).json({
      id: payment.id,
      status: payment.status,
      error: {
        code: payment.error_code,
        description: payment.error_description,
      },
    });
  }

  return res.status(200).json({
    id: payment.id,
    status: payment.status,
  });
};
/**
 * LIST PAYMENTS (DASHBOARD)
 */
export const listPayments = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, order_id, amount, currency, method, status, created_at
       FROM payments
       WHERE merchant_id = $1
       ORDER BY created_at DESC`,
      [req.merchant.id]
    );

    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        description: "Failed to fetch payments",
      },
    });
  }
};
