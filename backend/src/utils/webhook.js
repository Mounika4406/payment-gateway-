import crypto from "crypto";

export function generateWebhookSignature(payload, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}
