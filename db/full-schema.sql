-- =============================================================
-- Petita full schema — generated; idempotent
-- =============================================================
SET search_path TO petita, public;

CREATE TABLE IF NOT EXISTS petita.product_families (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  display_order INT DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS petita.products (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  family_id INT REFERENCES petita.product_families(id) ON DELETE RESTRICT,
  description TEXT,
  technical_specs JSONB DEFAULT '{}',
  cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'UN',
  photo_url TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by INT REFERENCES petita.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_family ON petita.products(family_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON petita.products(active);
CREATE INDEX IF NOT EXISTS idx_products_code ON petita.products(code);

CREATE TABLE IF NOT EXISTS petita.product_images (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES petita.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  display_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS petita.customers (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('PF','PJ')),
  name TEXT NOT NULL,
  trade_name TEXT,
  doc TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_district TEXT,
  address_city TEXT,
  address_state CHAR(2),
  address_zip TEXT,
  segment TEXT,
  credit_limit NUMERIC(14,2) DEFAULT 0,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by INT REFERENCES petita.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_customers_name ON petita.customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_doc ON petita.customers(doc);
CREATE INDEX IF NOT EXISTS idx_customers_active ON petita.customers(active);

CREATE TABLE IF NOT EXISTS petita.family_rules (
  id SERIAL PRIMARY KEY,
  family_id INT REFERENCES petita.product_families(id) ON DELETE CASCADE,
  max_discount_pct NUMERIC(5,2) DEFAULT 0,
  min_margin_pct NUMERIC(5,2) DEFAULT 15,
  default_markup_pct NUMERIC(5,2) DEFAULT 0,
  override_role TEXT DEFAULT 'admin',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS petita.tax_rules (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  tax_type TEXT NOT NULL CHECK (tax_type IN ('ICMS','PIS','COFINS','IPI','OUTRO')),
  rate NUMERIC(6,4) NOT NULL,
  family_id INT REFERENCES petita.product_families(id) ON DELETE SET NULL,
  state CHAR(2),
  applies_to TEXT DEFAULT 'all' CHECK (applies_to IN ('all','quote','order')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS petita.templates (
  id SERIAL PRIMARY KEY,
  scope TEXT NOT NULL CHECK (scope IN ('quote','order')),
  name TEXT NOT NULL,
  body JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT FALSE,
  created_by INT REFERENCES petita.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS petita.quotes (
  id SERIAL PRIMARY KEY,
  number TEXT UNIQUE NOT NULL,
  customer_id INT REFERENCES petita.customers(id) ON DELETE RESTRICT,
  user_id INT REFERENCES petita.users(id),
  template_id INT REFERENCES petita.templates(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','enviado','aprovado','rejeitado','convertido','expirado')),
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  cost_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  profit_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  profit_pct NUMERIC(6,2) NOT NULL DEFAULT 0,
  profitability TEXT NOT NULL DEFAULT 'desconhecido' CHECK (profitability IN ('rentavel','atencao','nao_rentavel','desconhecido')),
  payment_terms TEXT,
  delivery_terms TEXT,
  valid_until DATE,
  notes TEXT,
  sent_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_quotes_customer ON petita.quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_user ON petita.quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON petita.quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created ON petita.quotes(created_at);

CREATE TABLE IF NOT EXISTS petita.quote_items (
  id SERIAL PRIMARY KEY,
  quote_id INT REFERENCES petita.quotes(id) ON DELETE CASCADE,
  product_id INT REFERENCES petita.products(id) ON DELETE RESTRICT,
  qty NUMERIC(12,3) NOT NULL,
  list_price NUMERIC(12,2) NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  discount_pct NUMERIC(5,2) DEFAULT 0,
  unit_cost NUMERIC(12,2) NOT NULL,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  line_total NUMERIC(14,2) NOT NULL,
  line_profit NUMERIC(14,2) NOT NULL,
  position INT DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote ON petita.quote_items(quote_id);

CREATE TABLE IF NOT EXISTS petita.orders (
  id SERIAL PRIMARY KEY,
  number TEXT UNIQUE NOT NULL,
  customer_id INT REFERENCES petita.customers(id) ON DELETE RESTRICT,
  user_id INT REFERENCES petita.users(id),
  quote_id INT REFERENCES petita.quotes(id) ON DELETE SET NULL,
  template_id INT REFERENCES petita.templates(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','aprovado','faturado','cancelado')),
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  payment_terms TEXT,
  delivery_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON petita.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON petita.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON petita.orders(status);

CREATE TABLE IF NOT EXISTS petita.order_items (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES petita.orders(id) ON DELETE CASCADE,
  product_id INT REFERENCES petita.products(id) ON DELETE RESTRICT,
  qty NUMERIC(12,3) NOT NULL,
  list_price NUMERIC(12,2) NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  discount_pct NUMERIC(5,2) DEFAULT 0,
  unit_cost NUMERIC(12,2) NOT NULL,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  line_total NUMERIC(14,2) NOT NULL,
  line_profit NUMERIC(14,2) NOT NULL,
  position INT DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON petita.order_items(order_id);

CREATE TABLE IF NOT EXISTS petita.config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by INT REFERENCES petita.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS petita.activity_log (
  id SERIAL PRIMARY KEY,
  user_id INT,
  action TEXT,
  entity TEXT,
  entity_id INT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['product_families','products','customers','family_rules','tax_rules','templates','quotes','orders','config']) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON petita.%I', t, t);
    EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON petita.%I FOR EACH ROW EXECUTE FUNCTION petita.touch_updated_at()', t, t);
  END LOOP;
END$$;

-- =============================================================
-- SEEDS
-- =============================================================

INSERT INTO petita.product_families (slug,name,display_order) VALUES
('premium-cherie','Premium Cherie',1),
('premium-duke','Premium Duke',2),
('premium-filhotes','Premium Filhotes',3),
('premium-petit','Premium Petit',4),
('premium-plus','Premium Plus',5),
('refeicao','Refeição',6),
('acessorios','Acessórios',7),
('anplas','Anplas',8)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO petita.family_rules (family_id,max_discount_pct,min_margin_pct,default_markup_pct,override_role)
SELECT id, 15, 25, 200, 'admin' FROM petita.product_families
ON CONFLICT DO NOTHING;

INSERT INTO petita.tax_rules (name,tax_type,rate,family_id,state,applies_to,display_order) VALUES
('ICMS SP','ICMS',0.18,NULL,'SP','all',1),
('PIS','PIS',0.0165,NULL,NULL,'all',2),
('COFINS','COFINS',0.076,NULL,NULL,'all',3),
('IPI Refeicao','IPI',0.05,(SELECT id FROM petita.product_families WHERE slug='refeicao'),NULL,'all',4)
ON CONFLICT DO NOTHING;

INSERT INTO petita.templates (scope,name,body,is_default) VALUES
('quote','Orcamento padrao Premium','{"payment_terms":"28/35/42 dias","delivery_terms":"CIF","notes":"Validade 15 dias"}'::jsonb,TRUE),
('order','Pedido atacado Anplas','{"payment_terms":"30 dias","delivery_terms":"FOB"}'::jsonb,TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO petita.config (key,value) VALUES
('company','{"name":"Petita Industria e Comercio Ltda","cnpj":"00.000.000/0001-00","address":"R. Landri Sales 211, Guarulhos, SP","phone":"(11) 0000-0000","email":"contato@petita.com.br"}'::jsonb),
('quote_defaults','{"valid_days":15,"payment_terms":"28/35/42 dias","delivery_terms":"CIF"}'::jsonb),
('numbering','{"quote_prefix":"ORC","order_prefix":"PED","year":2026}'::jsonb),
('pdf','{"primary_color":"#1e4ba8","logo_path":"/logo-petita.png"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO petita.products (code,name,family_id,description,technical_specs,cost,price,unit,photo_url,active) VALUES
('PRE-CHERIECAB','Cherie Cab',(SELECT id FROM petita.product_families WHERE slug='premium-cherie'),'Cherie Cab - linha Premium Cherie','{}'::jsonb,22.49,83.89,'UN','/produtos/linha-premium-cherie-cherie-cab.jpg',TRUE),
('PRE-COPOTREINAMENTO','Copo Treinamento',(SELECT id FROM petita.product_families WHERE slug='premium-cherie'),'Copo Treinamento - linha Premium Cherie','{}'::jsonb,24.1,87.97,'UN','/produtos/linha-premium-cherie-copo-treinamento.jpg',TRUE),
('PRE-CANECACALCA','Caneca C/ AlçA',(SELECT id FROM petita.product_families WHERE slug='premium-cherie'),'Caneca C/ AlçA - linha Premium Cherie','{}'::jsonb,15.36,54.99,'UN','/produtos/linha-premium-cherie-caneca-c-alca.jpg',TRUE),
('PRE-KITREFEICAO','Kit RefeiçãO',(SELECT id FROM petita.product_families WHERE slug='premium-cherie'),'Kit RefeiçãO - linha Premium Cherie','{}'::jsonb,16.11,41.56,'UN','/produtos/linha-premium-cherie-kit-refeicao.jpg',TRUE),
('PRE-KITREFEICAO2','Kit RefeiçãO 2',(SELECT id FROM petita.product_families WHERE slug='premium-cherie'),'Kit RefeiçãO 2 - linha Premium Cherie','{}'::jsonb,18.47,67.78,'UN','/produtos/linha-premium-cherie-kit-refeicao-2.jpg',TRUE),
('PRE-KITBANHO','Kit Banho',(SELECT id FROM petita.product_families WHERE slug='premium-cherie'),'Kit Banho - linha Premium Cherie','{}'::jsonb,18.63,55.52,'UN','/produtos/linha-premium-cherie-kit-banho.jpg',TRUE),
('PRE-ESCOVAEPENTE','Escova E Pente',(SELECT id FROM petita.product_families WHERE slug='premium-cherie'),'Escova E Pente - linha Premium Cherie','{}'::jsonb,19.31,75.7,'UN','/produtos/linha-premium-cherie-escova-e-pente.jpg',TRUE),
('PRE-PRENDEDORDECHUPETA','Prendedor De Chupeta',(SELECT id FROM petita.product_families WHERE slug='premium-cherie'),'Prendedor De Chupeta - linha Premium Cherie','{}'::jsonb,24.85,95.42,'UN','/produtos/linha-premium-cherie-prendedor-de-chupeta.jpg',TRUE),
('PRE-DUKECAB1','Duke Cab 1',(SELECT id FROM petita.product_families WHERE slug='premium-duke'),'Duke Cab 1 - linha Premium Duke','{}'::jsonb,7.02,18.95,'UN','/produtos/linha-premium-duke-duke-cab-1.jpg',TRUE),
('PRE-COPOTREINAMENTO-1','Copo Treinamento',(SELECT id FROM petita.product_families WHERE slug='premium-duke'),'Copo Treinamento - linha Premium Duke','{}'::jsonb,17.41,65.29,'UN','/produtos/linha-premium-duke-copo-treinamento.jpg',TRUE),
('PRE-CANECACALCA-1','Caneca C/ AlçA',(SELECT id FROM petita.product_families WHERE slug='premium-duke'),'Caneca C/ AlçA - linha Premium Duke','{}'::jsonb,6.59,20.82,'UN','/produtos/linha-premium-duke-caneca-c-alca.jpg',TRUE),
('PRE-KITREFEICAO-1','Kit RefeiçãO',(SELECT id FROM petita.product_families WHERE slug='premium-duke'),'Kit RefeiçãO - linha Premium Duke','{}'::jsonb,9.87,31.98,'UN','/produtos/linha-premium-duke-kit-refeicao.jpg',TRUE),
('PRE-KITREFEICAO2-1','Kit RefeiçãO 2',(SELECT id FROM petita.product_families WHERE slug='premium-duke'),'Kit RefeiçãO 2 - linha Premium Duke','{}'::jsonb,17.75,45.44,'UN','/produtos/linha-premium-duke-kit-refeicao-2.jpg',TRUE),
('PRE-KITBANHO-1','Kit Banho',(SELECT id FROM petita.product_families WHERE slug='premium-duke'),'Kit Banho - linha Premium Duke','{}'::jsonb,15.01,54.64,'UN','/produtos/linha-premium-duke-kit-banho.jpg',TRUE),
('PRE-ESCOVAEPENTE-1','Escova E Pente',(SELECT id FROM petita.product_families WHERE slug='premium-duke'),'Escova E Pente - linha Premium Duke','{}'::jsonb,12.53,45.11,'UN','/produtos/linha-premium-duke-escova-e-pente.jpg',TRUE),
('PRE-PRENDEDORDECHUPETA-1','Prendedor De Chupeta',(SELECT id FROM petita.product_families WHERE slug='premium-duke'),'Prendedor De Chupeta - linha Premium Duke','{}'::jsonb,5.67,21.89,'UN','/produtos/linha-premium-duke-prendedor-de-chupeta.jpg',TRUE),
('PRE-FILHOTESCAB','Filhotes Cab',(SELECT id FROM petita.product_families WHERE slug='premium-filhotes'),'Filhotes Cab - linha Premium Filhotes','{}'::jsonb,13.46,37.15,'UN','/produtos/linha-premium-filhotes-filhotes-cab.jpg',TRUE),
('PRE-COPOTREINAMENTO-2','Copo Treinamento',(SELECT id FROM petita.product_families WHERE slug='premium-filhotes'),'Copo Treinamento - linha Premium Filhotes','{}'::jsonb,22.31,62.02,'UN','/produtos/linha-premium-filhotes-copo-treinamento.jpg',TRUE),
('PRE-CANECACALCA-2','Caneca C/ AlçA',(SELECT id FROM petita.product_families WHERE slug='premium-filhotes'),'Caneca C/ AlçA - linha Premium Filhotes','{}'::jsonb,10.49,38.18,'UN','/produtos/linha-premium-filhotes-caneca-c-alca.jpg',TRUE),
('PRE-KITREFEICAO-2','Kit RefeiçãO',(SELECT id FROM petita.product_families WHERE slug='premium-filhotes'),'Kit RefeiçãO - linha Premium Filhotes','{}'::jsonb,9.25,23.59,'UN','/produtos/linha-premium-filhotes-kit-refeicao.jpg',TRUE),
('PRE-KITBANHO-2','Kit Banho',(SELECT id FROM petita.product_families WHERE slug='premium-filhotes'),'Kit Banho - linha Premium Filhotes','{}'::jsonb,24.55,68.25,'UN','/produtos/linha-premium-filhotes-kit-banho.jpg',TRUE),
('PRE-ESCOVAEPENTE-2','Escova E Pente',(SELECT id FROM petita.product_families WHERE slug='premium-filhotes'),'Escova E Pente - linha Premium Filhotes','{}'::jsonb,17.56,68.84,'UN','/produtos/linha-premium-filhotes-escova-e-pente.jpg',TRUE),
('PRE-COPOTREINAMENTO-3','Copo Treinamento',(SELECT id FROM petita.product_families WHERE slug='premium-filhotes'),'Copo Treinamento - linha Premium Filhotes','{}'::jsonb,9.73,33.86,'UN','/produtos/linha-premium-filhotes-copo-treinamento-1.jpg',TRUE),
('PRE-CANECACALCA-3','Caneca C/ AlçA',(SELECT id FROM petita.product_families WHERE slug='premium-filhotes'),'Caneca C/ AlçA - linha Premium Filhotes','{}'::jsonb,4.59,11.93,'UN','/produtos/linha-premium-filhotes-caneca-c-alca-1.jpg',TRUE),
('PRE-KITREFEICAO-3','Kit RefeiçãO',(SELECT id FROM petita.product_families WHERE slug='premium-filhotes'),'Kit RefeiçãO - linha Premium Filhotes','{}'::jsonb,12.2,44.77,'UN','/produtos/linha-premium-filhotes-kit-refeicao-1.jpg',TRUE),
('PRE-KITBANHO-3','Kit Banho',(SELECT id FROM petita.product_families WHERE slug='premium-filhotes'),'Kit Banho - linha Premium Filhotes','{}'::jsonb,22.23,68.02,'UN','/produtos/linha-premium-filhotes-kit-banho-1.jpg',TRUE),
('PRE-ESCOVAEPENTE-3','Escova E Pente',(SELECT id FROM petita.product_families WHERE slug='premium-filhotes'),'Escova E Pente - linha Premium Filhotes','{}'::jsonb,13.76,37.56,'UN','/produtos/linha-premium-filhotes-escova-e-pente-1.jpg',TRUE),
('PRE-PRENDEDORDECHUPETA-2','Prendedor De Chupeta',(SELECT id FROM petita.product_families WHERE slug='premium-filhotes'),'Prendedor De Chupeta - linha Premium Filhotes','{}'::jsonb,23.75,81.22,'UN','/produtos/linha-premium-filhotes-prendedor-de-chupeta-1.jpg',TRUE),
('PRE-PETITCAB','Petit Cab',(SELECT id FROM petita.product_families WHERE slug='premium-petit'),'Petit Cab - linha Premium Petit','{}'::jsonb,10.08,33.26,'UN','/produtos/linha-premium-petit-petit-cab.jpg',TRUE),
('PRE-COPOTREINAMENTO-4','Copo Treinamento',(SELECT id FROM petita.product_families WHERE slug='premium-petit'),'Copo Treinamento - linha Premium Petit','{}'::jsonb,15.4,56.83,'UN','/produtos/linha-premium-petit-copo-treinamento.jpg',TRUE),
('PRE-CANECACALCA-4','Caneca C/ AlçA',(SELECT id FROM petita.product_families WHERE slug='premium-petit'),'Caneca C/ AlçA - linha Premium Petit','{}'::jsonb,15.54,56.72,'UN','/produtos/linha-premium-petit-caneca-c-alca.jpg',TRUE),
('PRE-KITREFEICAO-4','Kit RefeiçãO',(SELECT id FROM petita.product_families WHERE slug='premium-petit'),'Kit RefeiçãO - linha Premium Petit','{}'::jsonb,24.61,78.51,'UN','/produtos/linha-premium-petit-kit-refeicao.jpg',TRUE),
('PRE-KITREFEICAO2-2','Kit RefeiçãO 2',(SELECT id FROM petita.product_families WHERE slug='premium-petit'),'Kit RefeiçãO 2 - linha Premium Petit','{}'::jsonb,16.83,49.82,'UN','/produtos/linha-premium-petit-kit-refeicao-2.jpg',TRUE),
('PRE-KITBANHO-4','Kit Banho',(SELECT id FROM petita.product_families WHERE slug='premium-petit'),'Kit Banho - linha Premium Petit','{}'::jsonb,16.9,56.78,'UN','/produtos/linha-premium-petit-kit-banho.jpg',TRUE),
('PRE-ESCOVAEPENTE-4','Escova E Pente',(SELECT id FROM petita.product_families WHERE slug='premium-petit'),'Escova E Pente - linha Premium Petit','{}'::jsonb,7.17,23.23,'UN','/produtos/linha-premium-petit-escova-e-pente.jpg',TRUE),
('PRE-COPOTREINAMENTO-5','Copo Treinamento',(SELECT id FROM petita.product_families WHERE slug='premium-petit'),'Copo Treinamento - linha Premium Petit','{}'::jsonb,3.39,8.68,'UN','/produtos/linha-premium-petit-copo-treinamento-1.jpg',TRUE),
('PRE-CANECACALCA-5','Caneca C/ AlçA',(SELECT id FROM petita.product_families WHERE slug='premium-petit'),'Caneca C/ AlçA - linha Premium Petit','{}'::jsonb,13.17,40.3,'UN','/produtos/linha-premium-petit-caneca-c-alca-1.jpg',TRUE),
('PRE-KITREFEICAO-5','Kit RefeiçãO',(SELECT id FROM petita.product_families WHERE slug='premium-petit'),'Kit RefeiçãO - linha Premium Petit','{}'::jsonb,9.07,35.74,'UN','/produtos/linha-premium-petit-kit-refeicao-1.jpg',TRUE),
('PRE-KITREFEICAO2-3','Kit RefeiçãO 2',(SELECT id FROM petita.product_families WHERE slug='premium-petit'),'Kit RefeiçãO 2 - linha Premium Petit','{}'::jsonb,4.41,13.1,'UN','/produtos/linha-premium-petit-kit-refeicao-2-1.jpg',TRUE),
('PRE-KITBANHO-5','Kit Banho',(SELECT id FROM petita.product_families WHERE slug='premium-petit'),'Kit Banho - linha Premium Petit','{}'::jsonb,11.68,37.96,'UN','/produtos/linha-premium-petit-kit-banho-1.jpg',TRUE),
('PRE-ESCOVAEPENTE-5','Escova E Pente',(SELECT id FROM petita.product_families WHERE slug='premium-petit'),'Escova E Pente - linha Premium Petit','{}'::jsonb,15.66,43.69,'UN','/produtos/linha-premium-petit-escova-e-pente-1.jpg',TRUE),
('PRE-PLUSCAB','Plus Cab',(SELECT id FROM petita.product_families WHERE slug='premium-plus'),'Plus Cab - linha Premium Plus','{}'::jsonb,5.23,16.79,'UN','/produtos/linha-plus-plus-cab.jpg',TRUE),
('PRE-COPOTREINAMENTO-6','Copo Treinamento',(SELECT id FROM petita.product_families WHERE slug='premium-plus'),'Copo Treinamento - linha Premium Plus','{}'::jsonb,19.76,57.7,'UN','/produtos/linha-plus-copo-treinamento.jpg',TRUE),
('PRE-CANECACALCA-6','Caneca C/ AlçA',(SELECT id FROM petita.product_families WHERE slug='premium-plus'),'Caneca C/ AlçA - linha Premium Plus','{}'::jsonb,12.27,40.37,'UN','/produtos/linha-plus-caneca-c-alca.jpg',TRUE),
('PRE-KITREFEICAO-6','Kit RefeiçãO',(SELECT id FROM petita.product_families WHERE slug='premium-plus'),'Kit RefeiçãO - linha Premium Plus','{}'::jsonb,13.18,49.56,'UN','/produtos/linha-plus-kit-refeicao.jpg',TRUE),
('PRE-KITBANHO-6','Kit Banho',(SELECT id FROM petita.product_families WHERE slug='premium-plus'),'Kit Banho - linha Premium Plus','{}'::jsonb,22.75,58.7,'UN','/produtos/linha-plus-kit-banho.jpg',TRUE),
('PRE-ESCOVAEPENTE-6','Escova E Pente',(SELECT id FROM petita.product_families WHERE slug='premium-plus'),'Escova E Pente - linha Premium Plus','{}'::jsonb,6.23,18.32,'UN','/produtos/linha-plus-escova-e-pente.jpg',TRUE),
('PRE-COPOTREINAMENTO-7','Copo Treinamento',(SELECT id FROM petita.product_families WHERE slug='premium-plus'),'Copo Treinamento - linha Premium Plus','{}'::jsonb,13.59,49.33,'UN','/produtos/linha-plus-copo-treinamento-1.jpg',TRUE),
('PRE-CANECACALCA-7','Caneca C/ AlçA',(SELECT id FROM petita.product_families WHERE slug='premium-plus'),'Caneca C/ AlçA - linha Premium Plus','{}'::jsonb,5.98,16.33,'UN','/produtos/linha-plus-caneca-c-alca-1.jpg',TRUE),
('PRE-KITREFEICAO-7','Kit RefeiçãO',(SELECT id FROM petita.product_families WHERE slug='premium-plus'),'Kit RefeiçãO - linha Premium Plus','{}'::jsonb,4.88,18.3,'UN','/produtos/linha-plus-kit-refeicao-1.jpg',TRUE),
('PRE-KITBANHO-7','Kit Banho',(SELECT id FROM petita.product_families WHERE slug='premium-plus'),'Kit Banho - linha Premium Plus','{}'::jsonb,13.8,45.95,'UN','/produtos/linha-plus-kit-banho-1.jpg',TRUE),
('PRE-ESCOVAEPENTE-7','Escova E Pente',(SELECT id FROM petita.product_families WHERE slug='premium-plus'),'Escova E Pente - linha Premium Plus','{}'::jsonb,20.79,80.25,'UN','/produtos/linha-plus-escova-e-pente-1.jpg',TRUE),
('REF-REFEICAOCAB','Refeicao Cab',(SELECT id FROM petita.product_families WHERE slug='refeicao'),'Refeicao Cab - linha Refeição','{}'::jsonb,15.54,49.88,'UN','/produtos/linha-refeicao-refeicao-cab.jpg',TRUE),
('REF-COPOTREINAMENTOCOL','Copo Treinamento Color Azul',(SELECT id FROM petita.product_families WHERE slug='refeicao'),'Copo Treinamento Color Azul - linha Refeição','{}'::jsonb,21.13,70.57,'UN','/produtos/linha-refeicao-copo-treinamento-color-azul.jpg',TRUE),
('REF-COPOTREINAMENTOCOL-1','Copo Treinamento Color Rosa',(SELECT id FROM petita.product_families WHERE slug='refeicao'),'Copo Treinamento Color Rosa - linha Refeição','{}'::jsonb,8.51,29.61,'UN','/produtos/linha-refeicao-copo-treinamento-color-rosa.jpg',TRUE),
('REF-COPOTREINAMENTOCRI','Copo Treinamento Cristal Azul',(SELECT id FROM petita.product_families WHERE slug='refeicao'),'Copo Treinamento Cristal Azul - linha Refeição','{}'::jsonb,23.56,78.45,'UN','/produtos/linha-refeicao-copo-treinamento-cristal-azul.jpg',TRUE),
('REF-COPOTREINAMENTOCRI-1','Copo Treinamento Cristal Rosa',(SELECT id FROM petita.product_families WHERE slug='refeicao'),'Copo Treinamento Cristal Rosa - linha Refeição','{}'::jsonb,20.93,55.88,'UN','/produtos/linha-refeicao-copo-treinamento-cristal-rosa.jpg',TRUE),
('REF-KITREFEICAOMENINO','Kit RefeiçãO Menino',(SELECT id FROM petita.product_families WHERE slug='refeicao'),'Kit RefeiçãO Menino - linha Refeição','{}'::jsonb,20.46,73.45,'UN','/produtos/linha-refeicao-kit-refeicao-menino.jpg',TRUE),
('REF-KITREFEICAOMENINA','Kit RefeiçãO Menina',(SELECT id FROM petita.product_families WHERE slug='refeicao'),'Kit RefeiçãO Menina - linha Refeição','{}'::jsonb,14.26,44.06,'UN','/produtos/linha-refeicao-kit-refeicao-menina.jpg',TRUE),
('REF-COPOTREINAMENTO2E','Copo Treinamento 2 Em 1 Azul',(SELECT id FROM petita.product_families WHERE slug='refeicao'),'Copo Treinamento 2 Em 1 Azul - linha Refeição','{}'::jsonb,20.53,68.16,'UN','/produtos/linha-refeicao-copo-treinamento-2-em-1-azul.jpg',TRUE),
('REF-COPOTREINAMENTO2E-1','Copo Treinamento 2 Em 1 Rosa',(SELECT id FROM petita.product_families WHERE slug='refeicao'),'Copo Treinamento 2 Em 1 Rosa - linha Refeição','{}'::jsonb,19.99,63.57,'UN','/produtos/linha-refeicao-copo-treinamento-2-em-1-rosa.jpg',TRUE),
('REF-CANECACOMALCAAZUL','Caneca Com AlçA Azul',(SELECT id FROM petita.product_families WHERE slug='refeicao'),'Caneca Com AlçA Azul - linha Refeição','{}'::jsonb,16.98,51.11,'UN','/produtos/linha-refeicao-caneca-com-alca-azul.jpg',TRUE),
('REF-CANECACOMALCAROSA','Caneca Com AlçA Rosa',(SELECT id FROM petita.product_families WHERE slug='refeicao'),'Caneca Com AlçA Rosa - linha Refeição','{}'::jsonb,5.26,14.68,'UN','/produtos/linha-refeicao-caneca-com-alca-rosa.jpg',TRUE),
('ACE-ACESSORIOSCAB','Acessorios Cab',(SELECT id FROM petita.product_families WHERE slug='acessorios'),'Acessorios Cab - linha Acessórios','{}'::jsonb,14.42,39.66,'UN','/produtos/acessorios-acessorios-cab.jpg',TRUE),
('ACE-PRENDEDORDECHUPETA','Prendedor De Chupeta Boton Azul',(SELECT id FROM petita.product_families WHERE slug='acessorios'),'Prendedor De Chupeta Boton Azul - linha Acessórios','{}'::jsonb,17.05,61.04,'UN','/produtos/acessorios-prendedor-de-chupeta-boton-azul.jpg',TRUE),
('ACE-PRENDEDORDECHUPETA-1','Prendedor De Chupeta Boton Rosa',(SELECT id FROM petita.product_families WHERE slug='acessorios'),'Prendedor De Chupeta Boton Rosa - linha Acessórios','{}'::jsonb,4.45,13.71,'UN','/produtos/acessorios-prendedor-de-chupeta-boton-rosa.jpg',TRUE),
('ACE-PROTETORDESEIO','Protetor De Seio',(SELECT id FROM petita.product_families WHERE slug='acessorios'),'Protetor De Seio - linha Acessórios','{}'::jsonb,11.1,31.3,'UN','/produtos/acessorios-protetor-de-seio.jpg',TRUE),
('ACE-KITMANICUREAZUL','Kit Manicure Azul',(SELECT id FROM petita.product_families WHERE slug='acessorios'),'Kit Manicure Azul - linha Acessórios','{}'::jsonb,21.81,83.1,'UN','/produtos/acessorios-kit-manicure-azul.jpg',TRUE),
('ACE-KITMANICUREROSA','Kit Manicure Rosa',(SELECT id FROM petita.product_families WHERE slug='acessorios'),'Kit Manicure Rosa - linha Acessórios','{}'::jsonb,3.43,10.94,'UN','/produtos/acessorios-kit-manicure-rosa.jpg',TRUE),
('ACE-MASSAGEADORDEGENGI','Massageador De Gengiva Dental Azul',(SELECT id FROM petita.product_families WHERE slug='acessorios'),'Massageador De Gengiva Dental Azul - linha Acessórios','{}'::jsonb,17.35,66.97,'UN','/produtos/acessorios-massageador-de-gengiva-dental-azul.jpg',TRUE),
('ACE-MASSAGEADORDEGENGI-1','Massageador De Gengiva Dental Rosa',(SELECT id FROM petita.product_families WHERE slug='acessorios'),'Massageador De Gengiva Dental Rosa - linha Acessórios','{}'::jsonb,16.58,44.6,'UN','/produtos/acessorios-massageador-de-gengiva-dental-rosa.jpg',TRUE),
('ACE-ESCOVAEPENTEAZUL','Escova E Pente Azul',(SELECT id FROM petita.product_families WHERE slug='acessorios'),'Escova E Pente Azul - linha Acessórios','{}'::jsonb,9.55,34.57,'UN','/produtos/acessorios-escova-e-pente-azul.jpg',TRUE),
('ACE-ESCOVAEPENTEROSA','Escova E Pente Rosa',(SELECT id FROM petita.product_families WHERE slug='acessorios'),'Escova E Pente Rosa - linha Acessórios','{}'::jsonb,18.51,62.93,'UN','/produtos/acessorios-escova-e-pente-rosa.jpg',TRUE),
('ACE-ESCOVADUPLAACAOLI','Escova Dupla AçãO Limpa Bicos E Mamadeira Azul',(SELECT id FROM petita.product_families WHERE slug='acessorios'),'Escova Dupla AçãO Limpa Bicos E Mamadeira Azul - linha Acessórios','{}'::jsonb,8.71,32.4,'UN','/produtos/acessorios-escova-dupla-acao-limpa-bicos-e-mamadeira-azul.jpg',TRUE),
('ACE-ESCOVADUPLAACAOLI-1','Escova Dupla AçãO Limpa Bicos E Mamadeira Rosa',(SELECT id FROM petita.product_families WHERE slug='acessorios'),'Escova Dupla AçãO Limpa Bicos E Mamadeira Rosa - linha Acessórios','{}'::jsonb,8.12,27.36,'UN','/produtos/acessorios-escova-dupla-acao-limpa-bicos-e-mamadeira-rosa.jpg',TRUE),
('ACE-KITBANHOAZUL','Kit Banho Azul',(SELECT id FROM petita.product_families WHERE slug='acessorios'),'Kit Banho Azul - linha Acessórios','{}'::jsonb,21.91,74.93,'UN','/produtos/acessorios-kit-banho-azul.jpg',TRUE),
('ACE-KITBANHOROSA','Kit Banho Rosa',(SELECT id FROM petita.product_families WHERE slug='acessorios'),'Kit Banho Rosa - linha Acessórios','{}'::jsonb,5.52,16.01,'UN','/produtos/acessorios-kit-banho-rosa.jpg',TRUE),
('ACE-EXPOSITORGRANDECHA','Expositor Grande ChãO',(SELECT id FROM petita.product_families WHERE slug='acessorios'),'Expositor Grande ChãO - linha Acessórios','{}'::jsonb,6.5,19.05,'UN','/produtos/acessorios-expositor-grande-chao.jpg',TRUE),
('ANP-ANPLASCAB','Anplas Cab',(SELECT id FROM petita.product_families WHERE slug='anplas'),'Anplas Cab - linha Anplas','{}'::jsonb,12.88,37.74,'UN','/produtos/linha-anplas-anplas-cab.jpg',TRUE),
('ANP-COPOTREINAMENTOCRI','Copo Treinamento Cristal Azul',(SELECT id FROM petita.product_families WHERE slug='anplas'),'Copo Treinamento Cristal Azul - linha Anplas','{}'::jsonb,14.36,53.71,'UN','/produtos/linha-anplas-copo-treinamento-cristal-azul.jpg',TRUE),
('ANP-COPOTREINAMENTOCRI-1','Copo Treinamento Cristal Rosa',(SELECT id FROM petita.product_families WHERE slug='anplas'),'Copo Treinamento Cristal Rosa - linha Anplas','{}'::jsonb,12,33.84,'UN','/produtos/linha-anplas-copo-treinamento-cristal-rosa.jpg',TRUE),
('ANP-COPOTREINAMENTOAZU','Copo Treinamento Azul',(SELECT id FROM petita.product_families WHERE slug='anplas'),'Copo Treinamento Azul - linha Anplas','{}'::jsonb,20.76,81.38,'UN','/produtos/linha-anplas-copo-treinamento-azul.jpg',TRUE),
('ANP-COPOTREINAMENTOPIN','Copo Treinamento Pink',(SELECT id FROM petita.product_families WHERE slug='anplas'),'Copo Treinamento Pink - linha Anplas','{}'::jsonb,20.54,76.41,'UN','/produtos/linha-anplas-copo-treinamento-pink.jpg',TRUE),
('ANP-COPOTREINAMENTOAZU-1','Copo Treinamento Azul',(SELECT id FROM petita.product_families WHERE slug='anplas'),'Copo Treinamento Azul - linha Anplas','{}'::jsonb,9.97,35.19,'UN','/produtos/linha-anplas-copo-treinamento-azul-1.jpg',TRUE),
('ANP-COPOTREINAMENTOROS','Copo Treinamento Rosa',(SELECT id FROM petita.product_families WHERE slug='anplas'),'Copo Treinamento Rosa - linha Anplas','{}'::jsonb,8.88,34.63,'UN','/produtos/linha-anplas-copo-treinamento-rosa.jpg',TRUE),
('ANP-REDUTORDEASSENTO','Redutor De Assento',(SELECT id FROM petita.product_families WHERE slug='anplas'),'Redutor De Assento - linha Anplas','{}'::jsonb,9.41,31.71,'UN','/produtos/linha-anplas-redutor-de-assento.jpg',TRUE),
('ANP-SABONETEIRAAZUL','Saboneteira Azul',(SELECT id FROM petita.product_families WHERE slug='anplas'),'Saboneteira Azul - linha Anplas','{}'::jsonb,7.73,19.71,'UN','/produtos/linha-anplas-saboneteira-azul.jpg',TRUE),
('ANP-SABONETEIRAROSA','Saboneteira Rosa',(SELECT id FROM petita.product_families WHERE slug='anplas'),'Saboneteira Rosa - linha Anplas','{}'::jsonb,6.58,22.17,'UN','/produtos/linha-anplas-saboneteira-rosa.jpg',TRUE),
('ANP-COPOCRISTALCOMCAN','Copo Cristal Com Canudo RetráTil Azul',(SELECT id FROM petita.product_families WHERE slug='anplas'),'Copo Cristal Com Canudo RetráTil Azul - linha Anplas','{}'::jsonb,10.29,32.52,'UN','/produtos/linha-anplas-copo-cristal-com-canudo-retratil-azul.jpg',TRUE),
('ANP-COPOCRISTALCOMCAN-1','Copo Cristal Com Canudo RetráTil Rosa',(SELECT id FROM petita.product_families WHERE slug='anplas'),'Copo Cristal Com Canudo RetráTil Rosa - linha Anplas','{}'::jsonb,12.63,42.94,'UN','/produtos/linha-anplas-copo-cristal-com-canudo-retratil-rosa.jpg',TRUE),
('ANP-PORTALEITEEMPOAZ','Porta Leite Em Pó Azul',(SELECT id FROM petita.product_families WHERE slug='anplas'),'Porta Leite Em Pó Azul - linha Anplas','{}'::jsonb,21.18,59.73,'UN','/produtos/linha-anplas-porta-leite-em-po-azul.jpg',TRUE),
('ANP-PORTALEITEEMPORO','Porta Leite Em Pó Rosa',(SELECT id FROM petita.product_families WHERE slug='anplas'),'Porta Leite Em Pó Rosa - linha Anplas','{}'::jsonb,8.53,30.79,'UN','/produtos/linha-anplas-porta-leite-em-po-rosa.jpg',TRUE),
('ANP-PRATOCTAMPATALHER','Prato C/ Tampa, Talher E Ventosa Azul',(SELECT id FROM petita.product_families WHERE slug='anplas'),'Prato C/ Tampa, Talher E Ventosa Azul - linha Anplas','{}'::jsonb,9.98,35.53,'UN','/produtos/linha-anplas-prato-c-tampa-talher-e-ventosa-azul.jpg',TRUE),
('ANP-PRATOCTAMPATALHER-1','Prato C/ Tampa, Talher E Ventosa Rosa',(SELECT id FROM petita.product_families WHERE slug='anplas'),'Prato C/ Tampa, Talher E Ventosa Rosa - linha Anplas','{}'::jsonb,16.03,44.24,'UN','/produtos/linha-anplas-prato-c-tampa-talher-e-ventosa-rosa.jpg',TRUE),
('ANP-ESCOVADEMAMADEIRA','Escova De Mamadeira E Bico Azul',(SELECT id FROM petita.product_families WHERE slug='anplas'),'Escova De Mamadeira E Bico Azul - linha Anplas','{}'::jsonb,11.46,42.52,'UN','/produtos/linha-anplas-escova-de-mamadeira-e-bico-azul.jpg',TRUE),
('ANP-ESCOVADEMAMADEIRA-1','Escova De Mamadeira E Bico Rosa',(SELECT id FROM petita.product_families WHERE slug='anplas'),'Escova De Mamadeira E Bico Rosa - linha Anplas','{}'::jsonb,7.13,25.31,'UN','/produtos/linha-anplas-escova-de-mamadeira-e-bico-rosa.jpg',TRUE),
('ANP-ESCOVADEMAMADEIRA-2','Escova De Mamadeira E Bico C/ Espuma Azul',(SELECT id FROM petita.product_families WHERE slug='anplas'),'Escova De Mamadeira E Bico C/ Espuma Azul - linha Anplas','{}'::jsonb,20.44,75.22,'UN','/produtos/linha-anplas-escova-de-mamadeira-e-bico-c-espuma-azul.jpg',TRUE),
('ANP-ESCOVADEMAMADEIRA-3','Escova De Mamadeira E Bico C/ Espuma Rosa',(SELECT id FROM petita.product_families WHERE slug='anplas'),'Escova De Mamadeira E Bico C/ Espuma Rosa - linha Anplas','{}'::jsonb,4.4,17.42,'UN','/produtos/linha-anplas-escova-de-mamadeira-e-bico-c-espuma-rosa.jpg',TRUE),
('ANP-ESCOVADEMAMADEIRA-4','Escova De Mamadeira C/ Espuma E Cabo RemovíVel Azul',(SELECT id FROM petita.product_families WHERE slug='anplas'),'Escova De Mamadeira C/ Espuma E Cabo RemovíVel Azul - linha Anplas','{}'::jsonb,11.42,43.97,'UN','/produtos/linha-anplas-escova-de-mamadeira-c-espuma-e-cabo-removivel-azul.jpg',TRUE),
('ANP-ESCOVADEMAMADEIRA-5','Escova De Mamadeira C/ Espuma E Cabo RemovíVel Rosa',(SELECT id FROM petita.product_families WHERE slug='anplas'),'Escova De Mamadeira C/ Espuma E Cabo RemovíVel Rosa - linha Anplas','{}'::jsonb,19.77,61.09,'UN','/produtos/linha-anplas-escova-de-mamadeira-c-espuma-e-cabo-removivel-rosa.jpg',TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO petita.customers (type,name,trade_name,doc,email,phone,whatsapp,address_street,address_number,address_complement,address_district,address_city,address_state,address_zip,segment,credit_limit,notes,active) VALUES
('PF','Pet Shop Amigo Fiel','Pet Shop Amigo Fiel','652.683.390-01','pet-shop-amigo-fiel@example.com.br','(11) 93488-4057','(11) 93488-4057','Rua das Flores','100','','Centro','Sao Paulo','SP','01000-000','farmacia',1000,'Cliente seed dummy',TRUE),
('PJ','Farmacia Pet Carinho','Farmacia Pet Carinho','97.421.649/0001-18','farmacia-pet-carinho@example.com.br','(11) 94543-3885','(11) 94543-3885','Rua das Flores','101','','Centro','Rio de Janeiro','RJ','01000-000','loja bebe',2000,'Cliente seed dummy',TRUE),
('PJ','Distribuidora BabyBem','Distribuidora BabyBem','08.789.270/0001-35','distribuidora-babybem@example.com.br','(11) 91033-8370','(11) 91033-8370','Rua das Flores','102','','Centro','Belo Horizonte','MG','01000-000','distribuidor',3000,'Cliente seed dummy',TRUE),
('PJ','Loja Bebe Feliz','Loja Bebe Feliz','20.319.611/0001-04','loja-bebe-feliz@example.com.br','(11) 93736-1624','(11) 93736-1624','Rua das Flores','103','','Centro','Curitiba','PR','01000-000','atacado',4000,'Cliente seed dummy',TRUE),
('PF','Marketplace Maes e Bebes','Marketplace Maes e Bebes','425.490.298-01','marketplace-maes-e-bebes@example.com.br','(11) 93210-5628','(11) 93210-5628','Rua das Flores','104','','Centro','Campinas','SP','01000-000','marketplace',5000,'Cliente seed dummy',TRUE),
('PJ','Atacado Sul Nutricao','Atacado Sul Nutricao','47.123.262/0001-07','atacado-sul-nutricao@example.com.br','(11) 99686-1933','(11) 99686-1933','Rua das Flores','105','','Centro','Santos','SP','01000-000','pet shop',6000,'Cliente seed dummy',TRUE),
('PJ','Mercado Infantil Boa Vista','Mercado Infantil Boa Vista','56.876.543/0001-21','mercado-infantil-boa-vista@example.com.br','(11) 93042-5673','(11) 93042-5673','Rua das Flores','106','','Centro','Niteroi','RJ','01000-000','farmacia',7000,'Cliente seed dummy',TRUE),
('PJ','Casa do Bebe','Casa do Bebe','51.781.429/0001-02','casa-do-bebe@example.com.br','(11) 93721-9625','(11) 93721-9625','Rua das Flores','107','','Centro','Uberlandia','MG','01000-000','loja bebe',8000,'Cliente seed dummy',TRUE),
('PF','Pet Center Aurora','Pet Center Aurora','670.895.547-40','pet-center-aurora@example.com.br','(11) 91568-6974','(11) 91568-6974','Rua das Flores','108','','Centro','Londrina','PR','01000-000','distribuidor',9000,'Cliente seed dummy',TRUE),
('PJ','Drogaria Vital Mae','Drogaria Vital Mae','08.983.669/0001-52','drogaria-vital-mae@example.com.br','(11) 99076-2700','(11) 99076-2700','Rua das Flores','109','','Centro','Guarulhos','SP','01000-000','atacado',10000,'Cliente seed dummy',TRUE),
('PJ','Lojas Pequeninos','Lojas Pequeninos','01.699.849/0001-68','lojas-pequeninos@example.com.br','(11) 98576-6306','(11) 98576-6306','Rua das Flores','110','','Centro','Sao Paulo','SP','01000-000','marketplace',11000,'Cliente seed dummy',TRUE),
('PJ','Distribuidora Norte Pet','Distribuidora Norte Pet','25.175.411/0001-49','distribuidora-norte-pet@example.com.br','(11) 91177-2236','(11) 91177-2236','Rua das Flores','111','','Centro','Rio de Janeiro','RJ','01000-000','pet shop',12000,'Cliente seed dummy',TRUE),
('PF','Bebe Show Atacado','Bebe Show Atacado','842.237.329-78','bebe-show-atacado@example.com.br','(11) 97590-5458','(11) 97590-5458','Rua das Flores','112','','Centro','Belo Horizonte','MG','01000-000','farmacia',13000,'Cliente seed dummy',TRUE),
('PJ','Pet Vida Boutique','Pet Vida Boutique','37.528.723/0001-78','pet-vida-boutique@example.com.br','(11) 98409-5216','(11) 98409-5216','Rua das Flores','113','','Centro','Curitiba','PR','01000-000','loja bebe',14000,'Cliente seed dummy',TRUE),
('PJ','Farmacia Mamae e Filho','Farmacia Mamae e Filho','62.983.425/0001-15','farmacia-mamae-e-filho@example.com.br','(11) 95996-8965','(11) 95996-8965','Rua das Flores','114','','Centro','Campinas','SP','01000-000','distribuidor',15000,'Cliente seed dummy',TRUE),
('PJ','MultiMarcas Infantil','MultiMarcas Infantil','23.849.500/0001-06','multimarcas-infantil@example.com.br','(11) 94129-8816','(11) 94129-8816','Rua das Flores','115','','Centro','Santos','SP','01000-000','atacado',16000,'Cliente seed dummy',TRUE),
('PF','Distribuidora Sul Bebe','Distribuidora Sul Bebe','204.051.742-17','distribuidora-sul-bebe@example.com.br','(11) 96972-1105','(11) 96972-1105','Rua das Flores','116','','Centro','Niteroi','RJ','01000-000','marketplace',17000,'Cliente seed dummy',TRUE),
('PJ','Loja Cantinho Materno','Loja Cantinho Materno','12.749.930/0001-21','loja-cantinho-materno@example.com.br','(11) 99045-6174','(11) 99045-6174','Rua das Flores','117','','Centro','Uberlandia','MG','01000-000','pet shop',18000,'Cliente seed dummy',TRUE),
('PJ','Atacadao Pet Brasil','Atacadao Pet Brasil','23.792.028/0001-04','atacadao-pet-brasil@example.com.br','(11) 94331-2011','(11) 94331-2011','Rua das Flores','118','','Centro','Londrina','PR','01000-000','farmacia',19000,'Cliente seed dummy',TRUE),
('PJ','Pet Glamour SP','Pet Glamour SP','10.530.477/0001-32','pet-glamour-sp@example.com.br','(11) 99275-1394','(11) 99275-1394','Rua das Flores','119','','Centro','Guarulhos','SP','01000-000','loja bebe',20000,'Cliente seed dummy',TRUE),
('PF','Bebe Premium Store','Bebe Premium Store','954.711.197-38','bebe-premium-store@example.com.br','(11) 95073-6611','(11) 95073-6611','Rua das Flores','120','','Centro','Sao Paulo','SP','01000-000','distribuidor',21000,'Cliente seed dummy',TRUE),
('PJ','Farma Bebe 24h','Farma Bebe 24h','51.495.741/0001-21','farma-bebe-24h@example.com.br','(11) 93012-6934','(11) 93012-6934','Rua das Flores','121','','Centro','Rio de Janeiro','RJ','01000-000','atacado',22000,'Cliente seed dummy',TRUE),
('PJ','Distribuidora ABC Bebe','Distribuidora ABC Bebe','53.342.992/0001-00','distribuidora-abc-bebe@example.com.br','(11) 97275-3471','(11) 97275-3471','Rua das Flores','122','','Centro','Belo Horizonte','MG','01000-000','marketplace',23000,'Cliente seed dummy',TRUE),
('PJ','Loja Maezinha Eireli','Loja Maezinha Eireli','97.100.811/0001-04','loja-maezinha-eireli@example.com.br','(11) 98973-3664','(11) 98973-3664','Rua das Flores','123','','Centro','Curitiba','PR','01000-000','pet shop',24000,'Cliente seed dummy',TRUE),
('PF','Pet Lovers Marketplace','Pet Lovers Marketplace','931.034.044-41','pet-lovers-marketplace@example.com.br','(11) 93921-9337','(11) 93921-9337','Rua das Flores','124','','Centro','Campinas','SP','01000-000','farmacia',25000,'Cliente seed dummy',TRUE),
('PJ','Casa Materna Curitiba','Casa Materna Curitiba','83.284.991/0001-09','casa-materna-curitiba@example.com.br','(11) 91004-8526','(11) 91004-8526','Rua das Flores','125','','Centro','Santos','SP','01000-000','loja bebe',26000,'Cliente seed dummy',TRUE),
('PJ','BabyMix Distribuidora','BabyMix Distribuidora','68.654.781/0001-71','babymix-distribuidora@example.com.br','(11) 92188-8039','(11) 92188-8039','Rua das Flores','126','','Centro','Niteroi','RJ','01000-000','distribuidor',27000,'Cliente seed dummy',TRUE),
('PJ','Pet Boutique Ipanema','Pet Boutique Ipanema','49.558.091/0001-74','pet-boutique-ipanema@example.com.br','(11) 94252-7988','(11) 94252-7988','Rua das Flores','127','','Centro','Uberlandia','MG','01000-000','atacado',28000,'Cliente seed dummy',TRUE),
('PF','Loja Filhotes e Bebes','Loja Filhotes e Bebes','919.991.919-27','loja-filhotes-e-bebes@example.com.br','(11) 93212-2311','(11) 93212-2311','Rua das Flores','128','','Centro','Londrina','PR','01000-000','marketplace',29000,'Cliente seed dummy',TRUE),
('PJ','Mercadinho Infantil Bom Preco','Mercadinho Infantil Bom Preco','62.375.152/0001-26','mercadinho-infantil-bom-preco@example.com.br','(11) 93383-3644','(11) 93383-3644','Rua das Flores','129','','Centro','Guarulhos','SP','01000-000','pet shop',30000,'Cliente seed dummy',TRUE)
ON CONFLICT DO NOTHING;
