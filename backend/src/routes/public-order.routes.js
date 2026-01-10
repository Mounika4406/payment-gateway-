import express from "express";
import { pool } from "../db/pool.js";

const router = express.Router();

/* PUBLIC ORDER FETCH (NO AUTH) */
router.get("/api/v1/orders/:orderId/public", async (req, res) => {
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

  res.json(rows[0]);
});

export default router;
