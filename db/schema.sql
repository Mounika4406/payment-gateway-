-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================
-- Merchants Table
-- =========================
CREATE TABLE IF NOT EXISTS merchants (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  api_key VARCHAR(64) NOT NULL UNIQUE,
  api_secret VARCHAR(64) NOT NULL,
  webhook_url TEXT,
  webhook_secret VARCHAR(64) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- Orders Table
-- =========================
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  merchant_id UUID NOT NULL,
  amount INTEGER NOT NULL CHECK (amount >= 100),
  currency VARCHAR(3) DEFAULT 'INR',
  receipt VARCHAR(255),
  notes JSONB,
  status VARCHAR(20) DEFAULT 'created',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_merchant
    FOREIGN KEY (merchant_id) REFERENCES merchants(id)
);

CREATE INDEX IF NOT EXISTS idx_orders_merchant_id
ON orders(merchant_id);

-- =========================
-- Payments Table
-- =========================
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  merchant_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  method VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'processing',
  vpa VARCHAR(255),
  card_network VARCHAR(20),
  card_last4 VARCHAR(4),
  error_code VARCHAR(50),
  error_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_order
    FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_payments_merchant
    FOREIGN KEY (merchant_id) REFERENCES merchants(id)
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id
ON payments(order_id);

CREATE INDEX IF NOT EXISTS idx_payments_status
ON payments(status);

-- =========================
-- Seed Test Merchant
-- =========================
INSERT INTO merchants (
  id,
  name,
  email,
  api_key,
  api_secret,
  webhook_url,
  webhook_secret,
  created_at,
  updated_at
)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Test Merchant',
  'test@example.com',
  'key_test_abc123',
  'secret_test_xyz789',
  'http://192.168.55.104:4000/webhook',
  'whsec_test_abc123',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;
