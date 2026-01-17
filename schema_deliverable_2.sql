-- REFUNDS
CREATE TABLE IF NOT EXISTS refunds (
  id VARCHAR(64) PRIMARY KEY,
  payment_id VARCHAR(64) NOT NULL,
  merchant_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP
);

-- WEBHOOK LOGS
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL,
  event VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP,
  next_retry_at TIMESTAMP,
  response_code INTEGER,
  response_body TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- IDEMPOTENCY KEYS
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key VARCHAR(255),
  merchant_id UUID,
  response JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  PRIMARY KEY (key, merchant_id)
);

-- PAYMENTS MODIFICATION
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS captured BOOLEAN DEFAULT false;

-- MERCHANTS MODIFICATION
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS webhook_secret VARCHAR(64);
