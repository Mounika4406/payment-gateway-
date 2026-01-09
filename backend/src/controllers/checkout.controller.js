import { pool } from "../db/pool.js";

export const getCheckoutOrder = async (req, res) => {
  const { orderId } = req.params;

  const { rows } = await pool.query(
    `SELECT id, amount, currency, status
     FROM orders
     WHERE id = $1`,
    [orderId]
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
};
import { createPayment } from "./payment.controller.js";

export const createCheckoutPayment = async (req, res) => {
  // Inject fake merchant context using order ownership
  const { order_id } = req.body;

  const { rows } = await pool.query(
    `SELECT merchant_id FROM orders WHERE id = $1`,
    [order_id]
  );

  if (rows.length === 0) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND_ERROR",
        description: "Order not found",
      },
    });
  }

  req.merchant = { id: rows[0].merchant_id };

  return createPayment(req, res);
};
