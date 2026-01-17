import express from "express";
import crypto from "crypto";

const app = express();
app.use(express.json());

app.post("/webhook", (req, res) => {
  const signature = req.headers["x-webhook-signature"];
  const payload = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac("sha256", "whsec_test_abc123")
    .update(payload)
    .digest("hex");

  if (signature !== expectedSignature) {
    console.log("❌ Invalid signature");
    return res.status(401).send("Invalid signature");
  }

  console.log("✅ Webhook received:", req.body.event);
  res.status(200).send("OK");
});

app.listen(4000, () => {
  console.log("🟢 Test merchant webhook running on port 4000");
});
