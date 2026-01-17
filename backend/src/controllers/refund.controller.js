import { db } from "../utils/db.js";

export const getRefund = async (req, res) => {
  try {
    const merchantId = req.merchant.id;
    const refundId = req.params.refundId;

    const result = await db.query(
      `SELECT id, payment_id, amount, reason, status, created_at, processed_at
       FROM refunds
       WHERE id=$1 AND merchant_id=$2`,
      [refundId, merchantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND_ERROR",
          description: "Refund not found"
        }
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("getRefund error:", err);
    return res.status(500).json({
      error: {
        code: "SERVER_ERROR",
        description: "Something went wrong"
      }
    });
  }
};
