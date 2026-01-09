export const env = {
  PORT: process.env.PORT || 8000,
  DATABASE_URL: process.env.DATABASE_URL,
  TEST_MODE: process.env.TEST_MODE === "true",

  SUCCESS_RATE_UPI: Number(process.env.SUCCESS_RATE_UPI || 0.9),
  SUCCESS_RATE_CARD: Number(process.env.SUCCESS_RATE_CARD || 0.95),
  TEST_PAYMENT_SUCCESS: process.env.TEST_PAYMENT_SUCCESS === "true",
  TEST_PROCESSING_DELAY: Number(process.env.TEST_PROCESSING_DELAY || 1000),
};
