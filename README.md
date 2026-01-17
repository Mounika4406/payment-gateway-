# Payment Gateway (Async Workers + Webhooks + Refunds)

## Services
- API (Express + Postgres)
- Redis (BullMQ queues)
- Payment Worker
- Webhook Worker (with retry + signature)
- Refund Worker
- Dashboard (static placeholder)
- Checkout Page (simple HTML)

## Run locally (Docker)
```bash
docker-compose up -d --build
API auth headers
All protected endpoints require:

X-Api-Key: key_test_abc123

X-Api-Secret: secret_test_xyz789

Endpoints
Create Order
bash
Copy code
curl -X POST http://localhost:8000/api/v1/orders \
  -H "X-Api-Key: key_test_abc123" \
  -H "X-Api-Secret: secret_test_xyz789" \
  -H "Content-Type: application/json" \
  -d '{"amount":50000}'
Create Payment
bash
Copy code
curl -X POST http://localhost:8000/api/v1/payments \
  -H "X-Api-Key: key_test_abc123" \
  -H "X-Api-Secret: secret_test_xyz789" \
  -H "Content-Type: application/json" \
  -d '{"order_id":"<order_id>","method":"upi","vpa":"user@paytm"}'
List webhook logs
bash
Copy code
curl "http://localhost:8000/api/v1/webhooks?limit=10&offset=0" \
  -H "X-Api-Key: key_test_abc123" \
  -H "X-Api-Secret: secret_test_xyz789"
Retry webhook
bash
Copy code
curl -X POST "http://localhost:8000/api/v1/webhooks/<webhookId>/retry" \
  -H "X-Api-Key: key_test_abc123" \
  -H "X-Api-Secret: secret_test_xyz789"
Create refund
bash
Copy code
curl -X POST http://localhost:8000/api/v1/payments/<paymentId>/refunds \
  -H "X-Api-Key: key_test_abc123" \
  -H "X-Api-Secret: secret_test_xyz789" \
  -H "Content-Type: application/json" \
  -d '{"amount":10000,"reason":"partial refund"}'
Get refund
bash
Copy code
curl http://localhost:8000/api/v1/refunds/<refundId> \
  -H "X-Api-Key: key_test_abc123" \
  -H "X-Api-Secret: secret_test_xyz789"
Frontend
Dashboard: http://localhost:3000

Checkout Page: http://localhost:3001
