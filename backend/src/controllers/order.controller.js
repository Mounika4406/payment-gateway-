import { pool } from "../db/pool.js";
import { generateOrderId } from "../utils/id.util.js";

export const createOrder = async (req, res) => {
  const { amount, currency = "INR" } = req.body;

  // Validation
  if (!Number.isInteger(amount) || amount < 100) {
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "Invalid amount",
      },
    });
  }

  const orderId = generateOrderId();

  try {
    await pool.query(
      `INSERT INTO orders (
        id,
        merchant_id,
        amount,
        currency,
        status
      ) VALUES ($1, $2, $3, $4, $5)`,
      [orderId, req.merchant.id, amount, currency, "created"]
    );

    return res.status(200).json({
      id: orderId,
      amount,
      currency,
      status: "created",
    });
  } catch (err) {
    return res.status(500).json({
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "Unable to create order",
      },
    });
  }
};
export const getOrder = async (req, res) => {
  const { orderId } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT id, amount, currency, status
       FROM orders
       WHERE id = $1
       AND merchant_id = $2`,
      [orderId, req.merchant.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND_ERROR",
          description: "Order not found",
        },
      });
    }

    return res.status(200).json(rows[0]);
  } catch (err) {
    return res.status(500).json({
      error: {
        code: "NOT_FOUND_ERROR",
        description: "Order not found",
      },
    });
  }
};

