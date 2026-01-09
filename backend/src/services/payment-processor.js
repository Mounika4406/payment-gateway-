import { pool } from "../db/pool.js";
import { env } from "../config/env.js";

export const processPaymentAsync = async (paymentId, method) => {
  let delay;
  let success;

  if (env.TEST_MODE) {
    delay = env.TEST_PROCESSING_DELAY;
    success = env.TEST_PAYMENT_SUCCESS;
  } else {
    delay = Math.floor(Math.random() * 5000) + 5000; // 5–10 sec
    const rate =
      method === "upi" ? env.SUCCESS_RATE_UPI : env.SUCCESS_RATE_CARD;
    success = Math.random() < rate;
  }

  setTimeout(async () => {
    if (success) {
      await pool.query(
        `UPDATE payments
         SET status = 'success', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [paymentId]
      );
    } else {
      await pool.query(
        `UPDATE payments
         SET status = 'failed',
             error_code = 'PAYMENT_FAILED',
             error_description = 'Payment failed',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [paymentId]
      );
    }
  }, delay);
};
