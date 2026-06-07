
CREATE TABLE t_p24317549_honest_sign_integrat.settings (
  id SERIAL PRIMARY KEY,
  oms_id TEXT NOT NULL DEFAULT '',
  client_token TEXT NOT NULL DEFAULT '',
  api_key TEXT NOT NULL DEFAULT '',
  env TEXT NOT NULL DEFAULT 'sandbox',
  inn TEXT NOT NULL DEFAULT '',
  org_name TEXT NOT NULL DEFAULT '',
  webhook_url TEXT NOT NULL DEFAULT '',
  webhook_token TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO t_p24317549_honest_sign_integrat.settings (id) VALUES (1);

CREATE TABLE t_p24317549_honest_sign_integrat.orders (
  id TEXT PRIMARY KEY,
  product TEXT NOT NULL,
  gtin TEXT NOT NULL,
  count INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  received INTEGER NOT NULL DEFAULT 0,
  order_id_cz TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p24317549_honest_sign_integrat.codes (
  id SERIAL PRIMARY KEY,
  order_id TEXT REFERENCES t_p24317549_honest_sign_integrat.orders(id),
  code TEXT NOT NULL,
  gtin TEXT NOT NULL,
  product TEXT NOT NULL,
  serial TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
