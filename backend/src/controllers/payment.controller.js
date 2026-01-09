import { pool } from "../db/pool.js";
import { generatePaymentId } from "../utils/payment-id.util.js";
import { isValidVPA } from "../utils/vpa.util.js";
import { isValidCardNumber } from "../utils/luhn.util.js";
import { detectCardNetwork } from "../utils/card-network.util.js";
import { isValidExpiry } from "../utils/expiry.util.js";
import { processPaymentAsync } from "../services/payment-processor.js";

/* ======================================================
   CREATE PAYMENT
====================================================== */
export const createPayment = async (req, res) => {
  try {
    const { order_id, method } = req.body;

    if (!order_id || !method) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "order_id and method are required",
        },
      });
    }

    /* 1️⃣ Validate order ownership */
    const orderResult = await pool.query(
      `
      SELECT id, amount, currency
      FROM orders
      WHERE id = $1 AND merchant_id = $2
      `,
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

    /* Prevent duplicate payment */
    const existingPayment = await pool.query(
      `SELECT id FROM payments WHERE order_id = $1`,
      [order.id]
    );

    if (existingPayment.rows.length > 0) {
      return res.status(409).json({
        error: {
          code: "DUPLICATE_PAYMENT",
          description: "Payment already initiated for this order",
        },
      });
    }

    const paymentId = generatePaymentId();

    /* ======================================================
       UPI PAYMENT
    ====================================================== */
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
        `
        INSERT INTO payments (
          id, order_id, merchant_id, amount,
          currency, method, status, vpa
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        `,
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

      // Background processing (DO NOT await)
      processPaymentAsync(paymentId, "upi").catch(console.error);

      return res.status(201).json({
        id: paymentId,
        status: "processing",
        method: "upi",
      });
    }

    /* ======================================================
       CARD PAYMENT
    ====================================================== */
    if (method === "card") {
      const { card } = req.body;

      if (!card) {
        return res.status(400).json({
          error: {
            code: "INVALID_CARD",
            description: "Card details required",
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
      const last4 = number.replace(/\D/g, "").slice(-4);

      await pool.query(
        `
        INSERT INTO payments (
          id, order_id, merchant_id, amount,
          currency, method, status,
          card_network, card_last4
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        `,
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

      processPaymentAsync(paymentId, "card").catch(console.error);

      return res.status(201).json({
        id: paymentId,
        status: "processing",
        method: "card",
        card_network: cardNetwork,
        last4,
      });
    }

    /* ======================================================
       Unsupported Method
    ====================================================== */
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "Unsupported payment method",
      },
    });
  } catch (err) {
    console.error("Create payment error:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        description: "Something went wrong",
      },
    });
  }
};

/* ======================================================
   GET PAYMENT STATUS
====================================================== */
export const getPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const { rows } = await pool.query(
      `
      SELECT id, status, error_code, error_description
      FROM payments
      WHERE id = $1 AND merchant_id = $2
      `,
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
  } catch (err) {
    console.error("Get payment error:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        description: "Something went wrong",
      },
    });
  }
};
