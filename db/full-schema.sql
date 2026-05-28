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

-- Migração PRIMEIRO: realinha slugs legados ANTES de inserir os novos (evita unique conflict)
-- Cada UPDATE só roda se o slug-alvo ainda não existir (NOT EXISTS guard)
DO $$
DECLARE
  pair RECORD;
BEGIN
  FOR pair IN SELECT * FROM (VALUES
    ('premium-cherie','linha-premium-cherie'),
    ('premium-duke','linha-premium-duke'),
    ('premium-filhotes','linha-premium-filhotes'),
    ('premium-petit','linha-premium-petit'),
    ('premium-plus','linha-plus'),
    ('refeicao','linha-refeicao'),
    ('anplas','linha-anplas')
  ) AS t(old_slug,new_slug)
  LOOP
    IF EXISTS (SELECT 1 FROM petita.product_families WHERE slug=pair.old_slug)
       AND NOT EXISTS (SELECT 1 FROM petita.product_families WHERE slug=pair.new_slug) THEN
      UPDATE petita.product_families SET slug=pair.new_slug WHERE slug=pair.old_slug;
    ELSIF EXISTS (SELECT 1 FROM petita.product_families WHERE slug=pair.old_slug)
          AND EXISTS (SELECT 1 FROM petita.product_families WHERE slug=pair.new_slug) THEN
      -- legado e novo coexistem: apaga o legado (produtos serão re-seedados)
      DELETE FROM petita.product_families WHERE slug=pair.old_slug;
    END IF;
  END LOOP;
END $$;

INSERT INTO petita.product_families (slug,name,display_order) VALUES
('linha-premium-cherie','Premium Cherie',1),
('linha-premium-duke','Premium Duke',2),
('linha-premium-filhotes','Premium Filhotes',3),
('linha-premium-petit','Premium Petit',4),
('linha-plus','Premium Plus',5),
('linha-refeicao','Refeição',6),
('acessorios','Acessórios',7),
('linha-anplas','Anplas',8)
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

-- BEGIN_PRODUCTS_SEED
-- AUTO-GENERATED by scripts/gen-products-sql.js — do not edit by hand

-- Limpeza única e definitiva de produtos legados (gated por flag em petita.config)
DO $
BEGIN
  IF NOT EXISTS (SELECT 1 FROM petita.config WHERE key='products_seeded_v2') THEN
    DELETE FROM petita.quote_items;
    DELETE FROM petita.order_items;
    TRUNCATE petita.products RESTART IDENTITY CASCADE;
  END IF;
END$;

INSERT INTO petita.products (code,name,family_id,description,technical_specs,cost,price,unit,photo_url,active) VALUES
('LINPRE-CHERIECAB','Cherie Cab',(SELECT id FROM petita.product_families WHERE slug='linha-premium-cherie'),'cherie-cab da linha linha premium cherie, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"linha-premium-cherie","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,36.89,57.46,'UN','/produtos/linha-premium-cherie-cherie-cab.jpg',TRUE),
('LINPRE-COPOTREINAME','Copo Treinamento',(SELECT id FROM petita.product_families WHERE slug='linha-premium-cherie'),'Copo Treinamento ideal para a fase de transição alimentar. Possui 270 ml de capacidade, bico em silicone antivazamento e formato ergonômico. Recomendada para bebês a partir de 6 meses +.','{"tipo":"Copo de treinamento","capacidade_ml":270,"bico":"Silicone antivazamento","material":"Polipropileno (PP)","idade":"6 meses +","peso_g":100,"dimensoes_cm":"14 × 8 × 8","alca":"Não","cor":"Variadas","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,31.67,50.74,'UN','/produtos/linha-premium-cherie-copo-treinamento.jpg',TRUE),
('LINPRE-KITREFEIO','Kit RefeiçãO',(SELECT id FROM petita.product_families WHERE slug='linha-premium-cherie'),'Kit Refeição da linha linha premium cherie, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"linha-premium-cherie","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,52.06,114.26,'UN','/produtos/linha-premium-cherie-kit-refeicao.jpg',TRUE),
('LINPRE-KITBANHO','Kit Banho',(SELECT id FROM petita.product_families WHERE slug='linha-premium-cherie'),'Kit Banho da linha linha premium cherie, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"linha-premium-cherie","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,43.92,76.8,'UN','/produtos/linha-premium-cherie-kit-banho.jpg',TRUE),
('LINPRE-ESCOVAEPENTE','Escova E Pente',(SELECT id FROM petita.product_families WHERE slug='linha-premium-cherie'),'Escova e Pente da linha linha premium cherie, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"linha-premium-cherie","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,59.21,112.47,'UN','/produtos/linha-premium-cherie-escova-e-pente.jpg',TRUE),
('LINPRE-PRENDEDORDEC','Prendedor De Chupeta',(SELECT id FROM petita.product_families WHERE slug='linha-premium-cherie'),'Prendedor de Chupeta com bico ortodôntico em silicone medicinal, desenvolvida para bebês a partir de 0-6 meses. Leve e atóxica, atende às normas do INMETRO e proporciona conforto e segurança nos momentos de relaxamento.','{"tipo":"Chupeta","bico":"Ortodôntico","material":"PP + Silicone medicinal","idade":"0-6 meses","peso_g":15,"dimensoes_cm":"6 × 4 × 3","ventilada":"Não","cor":"Variadas","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,56.49,117.59,'UN','/produtos/linha-premium-cherie-prendedor-de-chupeta.jpg',TRUE),
('LINPRE-CANECACALA','Caneca C/ AlçA',(SELECT id FROM petita.product_families WHERE slug='linha-premium-duke'),'Caneca c/ Alça ideal para a fase de transição alimentar. Possui 270 ml de capacidade, bico em silicone antivazamento e formato ergonômico. Recomendada para bebês a partir de 6 meses +.','{"tipo":"Caneca de treinamento","capacidade_ml":270,"bico":"Silicone antivazamento","material":"Polipropileno (PP)","idade":"6 meses +","peso_g":100,"dimensoes_cm":"14 × 8 × 8","alca":"Sim","cor":"Variadas","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,68.16,117.68,'UN','/produtos/linha-premium-duke-caneca-c-alca.jpg',TRUE),
('LINPRE-KITREFEIO1','Kit RefeiçãO',(SELECT id FROM petita.product_families WHERE slug='linha-premium-duke'),'Kit Refeição da linha linha premium duke, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"linha-premium-duke","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,57.24,102.61,'UN','/produtos/linha-premium-duke-kit-refeicao.jpg',TRUE),
('LINPRE-KITBANHO1','Kit Banho',(SELECT id FROM petita.product_families WHERE slug='linha-premium-duke'),'Kit Banho da linha linha premium duke, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"linha-premium-duke","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,38.2,63.6,'UN','/produtos/linha-premium-duke-kit-banho.jpg',TRUE),
('LINPRE-ESCOVAEPENTE1','Escova E Pente',(SELECT id FROM petita.product_families WHERE slug='linha-premium-duke'),'Escova e Pente da linha linha premium duke, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"linha-premium-duke","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,43.35,90.77,'UN','/produtos/linha-premium-duke-escova-e-pente.jpg',TRUE),
('LINPRE-PRENDEDORDEC1','Prendedor De Chupeta',(SELECT id FROM petita.product_families WHERE slug='linha-premium-duke'),'Prendedor de Chupeta com bico ortodôntico em silicone medicinal, desenvolvida para bebês a partir de 0-6 meses. Leve e atóxica, atende às normas do INMETRO e proporciona conforto e segurança nos momentos de relaxamento.','{"tipo":"Chupeta","bico":"Ortodôntico","material":"PP + Silicone medicinal","idade":"0-6 meses","peso_g":15,"dimensoes_cm":"6 × 4 × 3","ventilada":"Não","cor":"Variadas","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,54.13,89.69,'UN','/produtos/linha-premium-duke-prendedor-de-chupeta.jpg',TRUE),
('LINPRE-FILHOTESCAB','Filhotes Cab',(SELECT id FROM petita.product_families WHERE slug='linha-premium-filhotes'),'filhotes-cab da linha linha premium filhotes, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"linha-premium-filhotes","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,38.77,70.15,'UN','/produtos/linha-premium-filhotes-filhotes-cab.jpg',TRUE),
('LINPRE-COPOTREINAME1','Copo Treinamento',(SELECT id FROM petita.product_families WHERE slug='linha-premium-filhotes'),'Copo Treinamento ideal para a fase de transição alimentar. Possui 270 ml de capacidade, bico em silicone antivazamento e formato ergonômico. Recomendada para bebês a partir de 6 meses +.','{"tipo":"Copo de treinamento","capacidade_ml":270,"bico":"Silicone antivazamento","material":"Polipropileno (PP)","idade":"6 meses +","peso_g":100,"dimensoes_cm":"14 × 8 × 8","alca":"Não","cor":"Variadas","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,28.01,49.03,'UN','/produtos/linha-premium-filhotes-copo-treinamento.jpg',TRUE),
('LINPRE-KITREFEIO2','Kit RefeiçãO',(SELECT id FROM petita.product_families WHERE slug='linha-premium-filhotes'),'Kit Refeição da linha linha premium filhotes, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"linha-premium-filhotes","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,46.25,82.74,'UN','/produtos/linha-premium-filhotes-kit-refeicao.jpg',TRUE),
('LINPRE-KITBANHO2','Kit Banho',(SELECT id FROM petita.product_families WHERE slug='linha-premium-filhotes'),'Kit Banho da linha linha premium filhotes, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"linha-premium-filhotes","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,60.2,102.26,'UN','/produtos/linha-premium-filhotes-kit-banho.jpg',TRUE),
('LINPRE-ESCOVAEPENTE2','Escova E Pente',(SELECT id FROM petita.product_families WHERE slug='linha-premium-filhotes'),'Escova e Pente da linha linha premium filhotes, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"linha-premium-filhotes","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,60.17,117.55,'UN','/produtos/linha-premium-filhotes-escova-e-pente.jpg',TRUE),
('LINPRE-PETITCAB','Petit Cab',(SELECT id FROM petita.product_families WHERE slug='linha-premium-petit'),'petit-cab da linha linha premium petit, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"linha-premium-petit","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,49.65,95.87,'UN','/produtos/linha-premium-petit-petit-cab.jpg',TRUE),
('LINPRE-COPOTREINAME2','Copo Treinamento',(SELECT id FROM petita.product_families WHERE slug='linha-premium-petit'),'Copo Treinamento ideal para a fase de transição alimentar. Possui 270 ml de capacidade, bico em silicone antivazamento e formato ergonômico. Recomendada para bebês a partir de 6 meses +.','{"tipo":"Copo de treinamento","capacidade_ml":270,"bico":"Silicone antivazamento","material":"Polipropileno (PP)","idade":"6 meses +","peso_g":100,"dimensoes_cm":"14 × 8 × 8","alca":"Não","cor":"Variadas","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,48.04,76.05,'UN','/produtos/linha-premium-petit-copo-treinamento.jpg',TRUE),
('LINPRE-CANECACALA1','Caneca C/ AlçA',(SELECT id FROM petita.product_families WHERE slug='linha-premium-petit'),'Caneca c/ Alça ideal para a fase de transição alimentar. Possui 270 ml de capacidade, bico em silicone antivazamento e formato ergonômico. Recomendada para bebês a partir de 6 meses +.','{"tipo":"Caneca de treinamento","capacidade_ml":270,"bico":"Silicone antivazamento","material":"Polipropileno (PP)","idade":"6 meses +","peso_g":100,"dimensoes_cm":"14 × 8 × 8","alca":"Sim","cor":"Variadas","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,60.53,101.4,'UN','/produtos/linha-premium-petit-caneca-c-alca.jpg',TRUE),
('LINPRE-KITREFEIO3','Kit RefeiçãO',(SELECT id FROM petita.product_families WHERE slug='linha-premium-petit'),'Kit Refeição da linha linha premium petit, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"linha-premium-petit","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,61.13,112,'UN','/produtos/linha-premium-petit-kit-refeicao.jpg',TRUE),
('LINPRE-KITBANHO3','Kit Banho',(SELECT id FROM petita.product_families WHERE slug='linha-premium-petit'),'Kit Banho da linha linha premium petit, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"linha-premium-petit","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,55.89,97.76,'UN','/produtos/linha-premium-petit-kit-banho.jpg',TRUE),
('LINPRE-ESCOVAEPENTE3','Escova E Pente',(SELECT id FROM petita.product_families WHERE slug='linha-premium-petit'),'Escova e Pente da linha linha premium petit, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"linha-premium-petit","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,34.6,62.92,'UN','/produtos/linha-premium-petit-escova-e-pente.jpg',TRUE),
('LINPLU-PLUSCAB','Plus Cab',(SELECT id FROM petita.product_families WHERE slug='linha-plus'),'plus-cab da linha linha plus, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"linha-plus","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,10.95,21.97,'UN','/produtos/linha-plus-plus-cab.jpg',TRUE),
('LINPLU-COPOTREINAME','Copo Treinamento',(SELECT id FROM petita.product_families WHERE slug='linha-plus'),'Copo Treinamento ideal para a fase de transição alimentar. Possui 270 ml de capacidade, bico em silicone antivazamento e formato ergonômico. Recomendada para bebês a partir de 6 meses +.','{"tipo":"Copo de treinamento","capacidade_ml":270,"bico":"Silicone antivazamento","material":"Polipropileno (PP)","idade":"6 meses +","peso_g":100,"dimensoes_cm":"14 × 8 × 8","alca":"Não","cor":"Variadas","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,34.07,55.98,'UN','/produtos/linha-plus-copo-treinamento.jpg',TRUE),
('LINPLU-CANECACALA','Caneca C/ AlçA',(SELECT id FROM petita.product_families WHERE slug='linha-plus'),'Caneca c/ Alça ideal para a fase de transição alimentar. Possui 270 ml de capacidade, bico em silicone antivazamento e formato ergonômico. Recomendada para bebês a partir de 6 meses +.','{"tipo":"Caneca de treinamento","capacidade_ml":270,"bico":"Silicone antivazamento","material":"Polipropileno (PP)","idade":"6 meses +","peso_g":100,"dimensoes_cm":"14 × 8 × 8","alca":"Sim","cor":"Variadas","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,23.68,47.77,'UN','/produtos/linha-plus-caneca-c-alca.jpg',TRUE),
('LINPLU-KITREFEIO','Kit RefeiçãO',(SELECT id FROM petita.product_families WHERE slug='linha-plus'),'Kit Refeição da linha linha plus, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"linha-plus","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,13.31,20.97,'UN','/produtos/linha-plus-kit-refeicao.jpg',TRUE),
('LINPLU-KITBANHO','Kit Banho',(SELECT id FROM petita.product_families WHERE slug='linha-plus'),'Kit Banho da linha linha plus, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"linha-plus","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,14.74,25.16,'UN','/produtos/linha-plus-kit-banho.jpg',TRUE),
('LINPLU-ESCOVAEPENTE','Escova E Pente',(SELECT id FROM petita.product_families WHERE slug='linha-plus'),'Escova e Pente da linha linha plus, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"linha-plus","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,35.84,57.04,'UN','/produtos/linha-plus-escova-e-pente.jpg',TRUE),
('LINREF-REFEICAOCAB','Refeicao Cab',(SELECT id FROM petita.product_families WHERE slug='linha-refeicao'),'refeicao-cab da linha linha refeicao, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"linha-refeicao","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,37.09,64.96,'UN','/produtos/linha-refeicao-refeicao-cab.jpg',TRUE),
('LINREF-COPOTREINAME','Copo Treinamento Color Azul',(SELECT id FROM petita.product_families WHERE slug='linha-refeicao'),'Copo Treinamento Color Azul ideal para a fase de transição alimentar. Possui 270 ml de capacidade, bico em silicone antivazamento e formato ergonômico. Recomendada para bebês a partir de 6 meses +.','{"tipo":"Copo de treinamento","capacidade_ml":270,"bico":"Silicone antivazamento","material":"Polipropileno (PP)","idade":"6 meses +","peso_g":100,"dimensoes_cm":"14 × 8 × 8","alca":"Não","cor":"Azul","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,35.33,59.18,'UN','/produtos/linha-refeicao-copo-treinamento-color-azul.jpg',TRUE),
('LINREF-COPOTREINAME1','Copo Treinamento Cristal Azul',(SELECT id FROM petita.product_families WHERE slug='linha-refeicao'),'Copo Treinamento Cristal Azul ideal para a fase de transição alimentar. Possui 270 ml de capacidade, bico em silicone antivazamento e formato ergonômico. Recomendada para bebês a partir de 6 meses +.','{"tipo":"Copo de treinamento","capacidade_ml":270,"bico":"Silicone antivazamento","material":"Polipropileno (PP)","idade":"6 meses +","peso_g":100,"dimensoes_cm":"14 × 8 × 8","alca":"Não","cor":"Azul","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,37.1,68.82,'UN','/produtos/linha-refeicao-copo-treinamento-cristal-azul.jpg',TRUE),
('LINREF-COPOTREINAME2','Copo Treinamento Cristal Rosa',(SELECT id FROM petita.product_families WHERE slug='linha-refeicao'),'Copo Treinamento Cristal Rosa ideal para a fase de transição alimentar. Possui 270 ml de capacidade, bico em silicone antivazamento e formato ergonômico. Recomendada para bebês a partir de 6 meses +.','{"tipo":"Copo de treinamento","capacidade_ml":270,"bico":"Silicone antivazamento","material":"Polipropileno (PP)","idade":"6 meses +","peso_g":100,"dimensoes_cm":"14 × 8 × 8","alca":"Não","cor":"Rosa","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,37.5,72.98,'UN','/produtos/linha-refeicao-copo-treinamento-cristal-rosa.jpg',TRUE),
('LINREF-KITREFEIOMEN','Kit RefeiçãO Menino',(SELECT id FROM petita.product_families WHERE slug='linha-refeicao'),'Kit Refeição Menino da linha linha refeicao, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"linha-refeicao","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,31.31,49.45,'UN','/produtos/linha-refeicao-kit-refeicao-menino.jpg',TRUE),
('LINREF-COPOTREINAME3','Copo Treinamento 2 Em 1 Azul',(SELECT id FROM petita.product_families WHERE slug='linha-refeicao'),'Copo Treinamento 2 em 1 Azul ideal para a fase de transição alimentar. Possui 270 ml de capacidade, bico em silicone antivazamento e formato ergonômico. Recomendada para bebês a partir de 6 meses +.','{"tipo":"Copo de treinamento","capacidade_ml":270,"bico":"Silicone antivazamento","material":"Polipropileno (PP)","idade":"6 meses +","peso_g":100,"dimensoes_cm":"14 × 8 × 8","alca":"Não","cor":"Azul","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,15.99,29.06,'UN','/produtos/linha-refeicao-copo-treinamento-2-em-1-azul.jpg',TRUE),
('LINREF-COPOTREINAME4','Copo Treinamento 2 Em 1 Rosa',(SELECT id FROM petita.product_families WHERE slug='linha-refeicao'),'Copo Treinamento 2 em 1 Rosa ideal para a fase de transição alimentar. Possui 270 ml de capacidade, bico em silicone antivazamento e formato ergonômico. Recomendada para bebês a partir de 6 meses +.','{"tipo":"Copo de treinamento","capacidade_ml":270,"bico":"Silicone antivazamento","material":"Polipropileno (PP)","idade":"6 meses +","peso_g":100,"dimensoes_cm":"14 × 8 × 8","alca":"Não","cor":"Rosa","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,31.14,56.85,'UN','/produtos/linha-refeicao-copo-treinamento-2-em-1-rosa.jpg',TRUE),
('LINREF-CANECACOMALA','Caneca Com AlçA Azul',(SELECT id FROM petita.product_families WHERE slug='linha-refeicao'),'Caneca com Alça Azul ideal para a fase de transição alimentar. Possui 270 ml de capacidade, bico em silicone antivazamento e formato ergonômico. Recomendada para bebês a partir de 6 meses +.','{"tipo":"Caneca de treinamento","capacidade_ml":270,"bico":"Silicone antivazamento","material":"Polipropileno (PP)","idade":"6 meses +","peso_g":100,"dimensoes_cm":"14 × 8 × 8","alca":"Sim","cor":"Azul","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,19.09,39.4,'UN','/produtos/linha-refeicao-caneca-com-alca-azul.jpg',TRUE),
('LINREF-CANECACOMALA1','Caneca Com AlçA Rosa',(SELECT id FROM petita.product_families WHERE slug='linha-refeicao'),'Caneca com Alça Rosa ideal para a fase de transição alimentar. Possui 270 ml de capacidade, bico em silicone antivazamento e formato ergonômico. Recomendada para bebês a partir de 6 meses +.','{"tipo":"Caneca de treinamento","capacidade_ml":270,"bico":"Silicone antivazamento","material":"Polipropileno (PP)","idade":"6 meses +","peso_g":100,"dimensoes_cm":"14 × 8 × 8","alca":"Sim","cor":"Rosa","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,13.24,25.91,'UN','/produtos/linha-refeicao-caneca-com-alca-rosa.jpg',TRUE),
('ACE-ACESSORIOSCA','Acessorios Cab',(SELECT id FROM petita.product_families WHERE slug='acessorios'),'acessorios-cab da linha acessorios, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"acessorios","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,19.2,30.33,'UN','/produtos/acessorios-acessorios-cab.jpg',TRUE),
('ACE-PRENDEDORDEC','Prendedor De Chupeta Boton Azul',(SELECT id FROM petita.product_families WHERE slug='acessorios'),'Prendedor de Chupeta Boton Azul com bico ortodôntico em silicone medicinal, desenvolvida para bebês a partir de 0-6 meses. Leve e atóxica, atende às normas do INMETRO e proporciona conforto e segurança nos momentos de relaxamento.','{"tipo":"Chupeta","bico":"Ortodôntico","material":"PP + Silicone medicinal","idade":"0-6 meses","peso_g":15,"dimensoes_cm":"6 × 4 × 3","ventilada":"Não","cor":"Azul","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,23.13,47.31,'UN','/produtos/acessorios-prendedor-de-chupeta-boton-azul.jpg',TRUE),
('ACE-PRENDEDORDEC1','Prendedor De Chupeta Boton Rosa',(SELECT id FROM petita.product_families WHERE slug='acessorios'),'Prendedor de Chupeta Boton Rosa com bico ortodôntico em silicone medicinal, desenvolvida para bebês a partir de 0-6 meses. Leve e atóxica, atende às normas do INMETRO e proporciona conforto e segurança nos momentos de relaxamento.','{"tipo":"Chupeta","bico":"Ortodôntico","material":"PP + Silicone medicinal","idade":"0-6 meses","peso_g":15,"dimensoes_cm":"6 × 4 × 3","ventilada":"Não","cor":"Rosa","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,29.41,63.81,'UN','/produtos/acessorios-prendedor-de-chupeta-boton-rosa.jpg',TRUE),
('ACE-PROTETORDESE','Protetor De Seio',(SELECT id FROM petita.product_families WHERE slug='acessorios'),'Protetor de Seio da linha acessorios, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"acessorios","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,16.64,33.69,'UN','/produtos/acessorios-protetor-de-seio.jpg',TRUE),
('ACE-KITMANICUREA','Kit Manicure Azul',(SELECT id FROM petita.product_families WHERE slug='acessorios'),'Kit Manicure Azul da linha acessorios, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"acessorios","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,30.43,65.85,'UN','/produtos/acessorios-kit-manicure-azul.jpg',TRUE),
('ACE-KITMANICURER','Kit Manicure Rosa',(SELECT id FROM petita.product_families WHERE slug='acessorios'),'Kit Manicure Rosa da linha acessorios, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"acessorios","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,15.74,27.57,'UN','/produtos/acessorios-kit-manicure-rosa.jpg',TRUE),
('ACE-MASSAGEADORD','Massageador De Gengiva Dental Azul',(SELECT id FROM petita.product_families WHERE slug='acessorios'),'Massageador de Gengiva Dental Azul da linha acessorios, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"acessorios","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,40.23,70.96,'UN','/produtos/acessorios-massageador-de-gengiva-dental-azul.jpg',TRUE),
('ACE-MASSAGEADORD1','Massageador De Gengiva Dental Rosa',(SELECT id FROM petita.product_families WHERE slug='acessorios'),'Massageador de Gengiva Dental Rosa da linha acessorios, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"acessorios","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,15.82,27.52,'UN','/produtos/acessorios-massageador-de-gengiva-dental-rosa.jpg',TRUE),
('ACE-ESCOVAEPENTE','Escova E Pente Azul',(SELECT id FROM petita.product_families WHERE slug='acessorios'),'Escova e Pente Azul da linha acessorios, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"acessorios","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,26.67,50.83,'UN','/produtos/acessorios-escova-e-pente-azul.jpg',TRUE),
('ACE-ESCOVAEPENTE1','Escova E Pente Rosa',(SELECT id FROM petita.product_families WHERE slug='acessorios'),'Escova e Pente Rosa da linha acessorios, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"acessorios","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,42.64,68.86,'UN','/produtos/acessorios-escova-e-pente-rosa.jpg',TRUE),
('ACE-ESCOVADUPLAA','Escova Dupla AçãO Limpa Bicos E Mamadeira Azul',(SELECT id FROM petita.product_families WHERE slug='acessorios'),'Escova Dupla Ação Limpa Bicos e Mamadeira Azul da linha acessorios, com capacidade de 240 ml e bico silicone. Indicada para a faixa etária 6 meses +, é fabricada em Polipropileno (PP), livre de BPA e ftalatos. Garante alimentação segura, prática e confortável para o bebê.','{"tipo":"Mamadeira","capacidade_ml":240,"bico":"Silicone","material":"Polipropileno (PP)","idade":"6 meses +","peso_g":140,"dimensoes_cm":"18 × 5 × 5","cor":"Azul","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,15.56,34.38,'UN','/produtos/acessorios-escova-dupla-acao-limpa-bicos-e-mamadeira-azul.jpg',TRUE),
('ACE-KITBANHOAZUL','Kit Banho Azul',(SELECT id FROM petita.product_families WHERE slug='acessorios'),'Kit Banho Azul da linha acessorios, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"acessorios","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,20.63,41.04,'UN','/produtos/acessorios-kit-banho-azul.jpg',TRUE),
('ACE-KITBANHOROSA','Kit Banho Rosa',(SELECT id FROM petita.product_families WHERE slug='acessorios'),'Kit Banho Rosa da linha acessorios, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"acessorios","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,22.15,36.36,'UN','/produtos/acessorios-kit-banho-rosa.jpg',TRUE),
('ACE-EXPOSITORGRA','Expositor Grande ChãO',(SELECT id FROM petita.product_families WHERE slug='acessorios'),'Expositor Grande Chão da linha acessorios, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"acessorios","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,12.21,21.8,'UN','/produtos/acessorios-expositor-grande-chao.jpg',TRUE),
('LINANP-ANPLASCAB','Anplas Cab',(SELECT id FROM petita.product_families WHERE slug='linha-anplas'),'anplas-cab da linha linha anplas, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"linha-anplas","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,34.91,58.35,'UN','/produtos/linha-anplas-anplas-cab.jpg',TRUE),
('LINANP-COPOTREINAME','Copo Treinamento Cristal Azul',(SELECT id FROM petita.product_families WHERE slug='linha-anplas'),'Copo Treinamento Cristal Azul ideal para a fase de transição alimentar. Possui 270 ml de capacidade, bico em silicone antivazamento e formato ergonômico. Recomendada para bebês a partir de 6 meses +.','{"tipo":"Copo de treinamento","capacidade_ml":270,"bico":"Silicone antivazamento","material":"Polipropileno (PP)","idade":"6 meses +","peso_g":100,"dimensoes_cm":"14 × 8 × 8","alca":"Não","cor":"Azul","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,35.98,63.71,'UN','/produtos/linha-anplas-copo-treinamento-cristal-azul.jpg',TRUE),
('LINANP-COPOTREINAME1','Copo Treinamento Cristal Rosa',(SELECT id FROM petita.product_families WHERE slug='linha-anplas'),'Copo Treinamento Cristal Rosa ideal para a fase de transição alimentar. Possui 270 ml de capacidade, bico em silicone antivazamento e formato ergonômico. Recomendada para bebês a partir de 6 meses +.','{"tipo":"Copo de treinamento","capacidade_ml":270,"bico":"Silicone antivazamento","material":"Polipropileno (PP)","idade":"6 meses +","peso_g":100,"dimensoes_cm":"14 × 8 × 8","alca":"Não","cor":"Rosa","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,40.83,72.7,'UN','/produtos/linha-anplas-copo-treinamento-cristal-rosa.jpg',TRUE),
('LINANP-COPOTREINAME2','Copo Treinamento Azul',(SELECT id FROM petita.product_families WHERE slug='linha-anplas'),'Copo Treinamento Azul ideal para a fase de transição alimentar. Possui 270 ml de capacidade, bico em silicone antivazamento e formato ergonômico. Recomendada para bebês a partir de 6 meses +.','{"tipo":"Copo de treinamento","capacidade_ml":270,"bico":"Silicone antivazamento","material":"Polipropileno (PP)","idade":"6 meses +","peso_g":100,"dimensoes_cm":"14 × 8 × 8","alca":"Não","cor":"Azul","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,19.79,42.64,'UN','/produtos/linha-anplas-copo-treinamento-azul.jpg',TRUE),
('LINANP-COPOTREINAME3','Copo Treinamento Pink',(SELECT id FROM petita.product_families WHERE slug='linha-anplas'),'Copo Treinamento Pink ideal para a fase de transição alimentar. Possui 270 ml de capacidade, bico em silicone antivazamento e formato ergonômico. Recomendada para bebês a partir de 6 meses +.','{"tipo":"Copo de treinamento","capacidade_ml":270,"bico":"Silicone antivazamento","material":"Polipropileno (PP)","idade":"6 meses +","peso_g":100,"dimensoes_cm":"14 × 8 × 8","alca":"Não","cor":"Variadas","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,29.77,57.32,'UN','/produtos/linha-anplas-copo-treinamento-pink.jpg',TRUE),
('LINANP-REDUTORDEASS','Redutor De Assento',(SELECT id FROM petita.product_families WHERE slug='linha-anplas'),'Redutor de Assento da linha linha anplas, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"linha-anplas","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,13.35,27.2,'UN','/produtos/linha-anplas-redutor-de-assento.jpg',TRUE),
('LINANP-SABONETEIRAA','Saboneteira Azul',(SELECT id FROM petita.product_families WHERE slug='linha-anplas'),'Saboneteira Azul da linha linha anplas, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"linha-anplas","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,11.13,24.25,'UN','/produtos/linha-anplas-saboneteira-azul.jpg',TRUE),
('LINANP-SABONETEIRAR','Saboneteira Rosa',(SELECT id FROM petita.product_families WHERE slug='linha-anplas'),'Saboneteira Rosa da linha linha anplas, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"linha-anplas","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,29.9,65.81,'UN','/produtos/linha-anplas-saboneteira-rosa.jpg',TRUE),
('LINANP-COPOCRISTALC','Copo Cristal Com Canudo RetráTil Azul',(SELECT id FROM petita.product_families WHERE slug='linha-anplas'),'Copo Cristal com Canudo Retrátil Azul ideal para a fase de transição alimentar. Possui 270 ml de capacidade, bico em silicone antivazamento e formato ergonômico. Recomendada para bebês a partir de 6 meses +.','{"tipo":"Copo de treinamento","capacidade_ml":270,"bico":"Silicone antivazamento","material":"Polipropileno (PP)","idade":"6 meses +","peso_g":100,"dimensoes_cm":"14 × 8 × 8","alca":"Não","cor":"Azul","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,31.46,62.2,'UN','/produtos/linha-anplas-copo-cristal-com-canudo-retratil-azul.jpg',TRUE),
('LINANP-COPOCRISTALC1','Copo Cristal Com Canudo RetráTil Rosa',(SELECT id FROM petita.product_families WHERE slug='linha-anplas'),'Copo Cristal com Canudo Retrátil Rosa ideal para a fase de transição alimentar. Possui 270 ml de capacidade, bico em silicone antivazamento e formato ergonômico. Recomendada para bebês a partir de 6 meses +.','{"tipo":"Copo de treinamento","capacidade_ml":270,"bico":"Silicone antivazamento","material":"Polipropileno (PP)","idade":"6 meses +","peso_g":100,"dimensoes_cm":"14 × 8 × 8","alca":"Não","cor":"Rosa","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,20.84,39.13,'UN','/produtos/linha-anplas-copo-cristal-com-canudo-retratil-rosa.jpg',TRUE),
('LINANP-PORTALEITEEM','Porta Leite Em Pó Azul',(SELECT id FROM petita.product_families WHERE slug='linha-anplas'),'Porta Leite em Pó Azul da linha linha anplas, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"linha-anplas","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,33.41,54.09,'UN','/produtos/linha-anplas-porta-leite-em-po-azul.jpg',TRUE),
('LINANP-PORTALEITEEM1','Porta Leite Em Pó Rosa',(SELECT id FROM petita.product_families WHERE slug='linha-anplas'),'Porta Leite em Pó Rosa da linha linha anplas, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"linha-anplas","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,22.92,45.32,'UN','/produtos/linha-anplas-porta-leite-em-po-rosa.jpg',TRUE),
('LINANP-PRATOCTAMPAT','Prato C/ Tampa, Talher E Ventosa Azul',(SELECT id FROM petita.product_families WHERE slug='linha-anplas'),'Prato c/ Tampa, Talher e Ventosa Azul da linha linha anplas, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"linha-anplas","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,26.37,52.03,'UN','/produtos/linha-anplas-prato-c-tampa-talher-e-ventosa-azul.jpg',TRUE),
('LINANP-PRATOCTAMPAT1','Prato C/ Tampa, Talher E Ventosa Rosa',(SELECT id FROM petita.product_families WHERE slug='linha-anplas'),'Prato c/ Tampa, Talher e Ventosa Rosa da linha linha anplas, desenvolvido em Polipropileno (PP) de alta qualidade. Atóxico, livre de BPA e ftalatos, com certificação INMETRO.','{"tipo":"Acessório","material":"Polipropileno (PP)","peso_g":30,"linha":"linha-anplas","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,17.41,28.86,'UN','/produtos/linha-anplas-prato-c-tampa-talher-e-ventosa-rosa.jpg',TRUE),
('LINANP-ESCOVADEMAMA','Escova De Mamadeira E Bico Azul',(SELECT id FROM petita.product_families WHERE slug='linha-anplas'),'Escova de Mamadeira e Bico Azul da linha linha anplas, com capacidade de 240 ml e bico silicone. Indicada para a faixa etária 6 meses +, é fabricada em Polipropileno (PP), livre de BPA e ftalatos. Garante alimentação segura, prática e confortável para o bebê.','{"tipo":"Mamadeira","capacidade_ml":240,"bico":"Silicone","material":"Polipropileno (PP)","idade":"6 meses +","peso_g":140,"dimensoes_cm":"18 × 5 × 5","cor":"Azul","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,44.26,72.97,'UN','/produtos/linha-anplas-escova-de-mamadeira-e-bico-azul.jpg',TRUE),
('LINANP-ESCOVADEMAMA1','Escova De Mamadeira E Bico Rosa',(SELECT id FROM petita.product_families WHERE slug='linha-anplas'),'Escova de Mamadeira e Bico Rosa da linha linha anplas, com capacidade de 240 ml e bico silicone. Indicada para a faixa etária 6 meses +, é fabricada em Polipropileno (PP), livre de BPA e ftalatos. Garante alimentação segura, prática e confortável para o bebê.','{"tipo":"Mamadeira","capacidade_ml":240,"bico":"Silicone","material":"Polipropileno (PP)","idade":"6 meses +","peso_g":140,"dimensoes_cm":"18 × 5 × 5","cor":"Rosa","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,13.21,25.2,'UN','/produtos/linha-anplas-escova-de-mamadeira-e-bico-rosa.jpg',TRUE),
('LINANP-ESCOVADEMAMA2','Escova De Mamadeira E Bico C/ Espuma Azul',(SELECT id FROM petita.product_families WHERE slug='linha-anplas'),'Escova de Mamadeira e Bico c/ Espuma Azul da linha linha anplas, com capacidade de 240 ml e bico silicone. Indicada para a faixa etária 6 meses +, é fabricada em Polipropileno (PP), livre de BPA e ftalatos. Garante alimentação segura, prática e confortável para o bebê.','{"tipo":"Mamadeira","capacidade_ml":240,"bico":"Silicone","material":"Polipropileno (PP)","idade":"6 meses +","peso_g":140,"dimensoes_cm":"18 × 5 × 5","cor":"Azul","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,45.18,72.12,'UN','/produtos/linha-anplas-escova-de-mamadeira-e-bico-c-espuma-azul.jpg',TRUE),
('LINANP-ESCOVADEMAMA3','Escova De Mamadeira C/ Espuma E Cabo RemovíVel Azul',(SELECT id FROM petita.product_families WHERE slug='linha-anplas'),'Escova de Mamadeira c/ Espuma e Cabo Removível Azul da linha linha anplas, com capacidade de 240 ml e bico silicone. Indicada para a faixa etária 6 meses +, é fabricada em Polipropileno (PP), livre de BPA e ftalatos. Garante alimentação segura, prática e confortável para o bebê.','{"tipo":"Mamadeira","capacidade_ml":240,"bico":"Silicone","material":"Polipropileno (PP)","idade":"6 meses +","peso_g":140,"dimensoes_cm":"18 × 5 × 5","cor":"Azul","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,36.3,65.42,'UN','/produtos/linha-anplas-escova-de-mamadeira-c-espuma-e-cabo-removivel-azul.jpg',TRUE),
('LINANP-ESCOVADEMAMA4','Escova De Mamadeira C/ Espuma E Cabo RemovíVel Rosa',(SELECT id FROM petita.product_families WHERE slug='linha-anplas'),'Escova de Mamadeira c/ Espuma e Cabo Removível Rosa da linha linha anplas, com capacidade de 240 ml e bico silicone. Indicada para a faixa etária 6 meses +, é fabricada em Polipropileno (PP), livre de BPA e ftalatos. Garante alimentação segura, prática e confortável para o bebê.','{"tipo":"Mamadeira","capacidade_ml":240,"bico":"Silicone","material":"Polipropileno (PP)","idade":"6 meses +","peso_g":140,"dimensoes_cm":"18 × 5 × 5","cor":"Rosa","observacoes":"Livre de BPA · Livre de Ftalatos · Atóxico · Certificação INMETRO"}'::jsonb,17.14,34.45,'UN','/produtos/linha-anplas-escova-de-mamadeira-c-espuma-e-cabo-removivel-rosa.jpg',TRUE)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  family_id = EXCLUDED.family_id,
  description = EXCLUDED.description,
  technical_specs = EXCLUDED.technical_specs,
  cost = EXCLUDED.cost,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  photo_url = EXCLUDED.photo_url,
  active = EXCLUDED.active,
  updated_at = now();

INSERT INTO petita.config (key,value) VALUES ('products_seeded_v2','{"done":true}'::jsonb)
ON CONFLICT (key) DO NOTHING;
-- END_PRODUCTS_SEED

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

-- Corrige photo_url legados sem barra inicial
UPDATE petita.products SET photo_url = '/' || photo_url WHERE photo_url IS NOT NULL AND photo_url NOT LIKE '/%';


-- ============================================================
-- MIGRATIONS_V2: dedup constraints, catalog templates, dummy seeds
-- Idempotente — pode rodar várias vezes sem efeito colateral.
-- ============================================================

-- Limpa duplicatas pré-existentes (mesmo name+family_id mantém menor id)
DELETE FROM petita.products p1
USING petita.products p2
WHERE p1.id > p2.id AND p1.name = p2.name AND p1.family_id = p2.family_id;

DO $$ BEGIN
  ALTER TABLE petita.products ADD CONSTRAINT products_name_family_unique UNIQUE (name, family_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;

-- Catalog templates (modelos salvos de catálogo PDF)
CREATE TABLE IF NOT EXISTS petita.catalog_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  product_ids INT[] NOT NULL DEFAULT '{}',
  options JSONB NOT NULL DEFAULT '{}',
  created_by INT REFERENCES petita.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS catalog_templates_name_idx ON petita.catalog_templates(name);

-- ============================================================
-- DUMMY SEEDS: 50 orçamentos + 50 pedidos (gated por flag em petita.config)
-- ============================================================
DO $$
DECLARE
  v_qid INT; v_oid INT; v_cust INT; v_prod RECORD;
  v_subtotal NUMERIC; v_disc NUMERIC; v_tax NUMERIC; v_total NUMERIC;
  v_cost NUMERIC; v_profit NUMERIC; v_pct NUMERIC; v_bucket TEXT;
  v_qty NUMERIC; v_lp NUMERIC; v_up NUMERIC; v_uc NUMERIC; v_lt NUMERIC; v_lprof NUMERIC;
  v_n INT; v_i INT; v_status TEXT; v_created TIMESTAMPTZ;
  v_quote_statuses TEXT[] := ARRAY['rascunho','enviado','aprovado','rejeitado','convertido','expirado'];
  v_order_statuses TEXT[] := ARRAY['aberto','aprovado','faturado','cancelado'];
  v_uid INT; v_cust_count INT; v_prod_count INT; v_quote_id INT;
BEGIN
  IF EXISTS (SELECT 1 FROM petita.config WHERE key='quotes_orders_seeded_v3') THEN RETURN; END IF;
  SELECT id INTO v_uid FROM petita.users ORDER BY id LIMIT 1;
  SELECT count(*) INTO v_cust_count FROM petita.customers;
  SELECT count(*) INTO v_prod_count FROM petita.products;
  IF v_uid IS NULL OR v_cust_count = 0 OR v_prod_count = 0 THEN RETURN; END IF;
  -- Limpeza prévia: derruba qualquer dummy parcial de runs antigos.
  DELETE FROM petita.orders WHERE number LIKE 'PED-2026-%';
  DELETE FROM petita.quotes WHERE number LIKE 'ORC-2026-%';

  -- 50 quotes
  FOR v_n IN 1..50 LOOP
    IF EXISTS (SELECT 1 FROM petita.quotes WHERE number = 'ORC-2026-' || lpad(v_n::text,5,'0')) THEN CONTINUE; END IF;
    v_status := v_quote_statuses[1 + floor(random()*6)::int];
    v_created := now() - (floor(random()*90)::int || ' days')::interval;
    SELECT id INTO v_cust FROM petita.customers ORDER BY random() LIMIT 1;
    INSERT INTO petita.quotes (number,customer_id,user_id,status,subtotal,discount_amount,tax_amount,total,cost_total,profit_amount,profit_pct,profitability,valid_until,created_at,updated_at)
      VALUES ('ORC-2026-' || lpad(v_n::text,5,'0'), v_cust, v_uid, v_status, 0,0,0,0,0,0,0,'desconhecido', (v_created + interval '15 days')::date, v_created, v_created)
      RETURNING id INTO v_qid;
    v_subtotal := 0; v_cost := 0; v_i := 0;
    FOR v_prod IN (SELECT id, price, cost FROM petita.products ORDER BY random() LIMIT (2 + floor(random()*5)::int)) LOOP
      v_i := v_i + 1;
      v_qty := 1 + floor(random()*10)::int;
      v_lp := v_prod.price; v_up := v_lp * (0.9 + random()*0.1);
      v_uc := v_prod.cost; v_lt := v_qty * v_up; v_lprof := v_lt - (v_qty*v_uc);
      INSERT INTO petita.quote_items (quote_id,product_id,qty,list_price,unit_price,discount_pct,unit_cost,tax_amount,line_total,line_profit,position)
        VALUES (v_qid, v_prod.id, v_qty, v_lp, v_up, 5, v_uc, 0, v_lt, v_lprof, v_i);
      v_subtotal := v_subtotal + v_lt;
      v_cost := v_cost + (v_qty * v_uc);
    END LOOP;
    v_disc := round((v_subtotal*0.05)::numeric, 2);
    v_tax := round((v_subtotal*0.08)::numeric, 2);
    v_total := v_subtotal - v_disc + v_tax;
    v_profit := v_total - v_cost;
    v_pct := CASE WHEN v_total>0 THEN round((v_profit/v_total*100)::numeric,2) ELSE 0 END;
    v_bucket := CASE WHEN v_pct >= 30 THEN 'rentavel' WHEN v_pct >= 15 THEN 'atencao' ELSE 'nao_rentavel' END;
    UPDATE petita.quotes SET subtotal=v_subtotal, discount_amount=v_disc, tax_amount=v_tax, total=v_total,
      cost_total=v_cost, profit_amount=v_profit, profit_pct=v_pct, profitability=v_bucket WHERE id=v_qid;
  END LOOP;

  -- 50 orders (some linked to quotes)
  FOR v_n IN 1..50 LOOP
    IF EXISTS (SELECT 1 FROM petita.orders WHERE number = 'PED-2026-' || lpad(v_n::text,5,'0')) THEN CONTINUE; END IF;
    v_status := v_order_statuses[1 + floor(random()*4)::int];
    v_created := now() - (floor(random()*90)::int || ' days')::interval;
    SELECT id INTO v_cust FROM petita.customers ORDER BY random() LIMIT 1;
    v_quote_id := NULL;
    IF v_n <= 15 THEN
      SELECT id INTO v_quote_id FROM petita.quotes WHERE status='convertido' OR status='aprovado' ORDER BY random() LIMIT 1;
    END IF;
    INSERT INTO petita.orders (number,customer_id,user_id,quote_id,status,subtotal,discount_amount,tax_amount,total,created_at,updated_at)
      VALUES ('PED-2026-' || lpad(v_n::text,5,'0'), v_cust, v_uid, v_quote_id, v_status, 0,0,0,0, v_created, v_created)
      RETURNING id INTO v_oid;
    v_subtotal := 0; v_i := 0;
    FOR v_prod IN (SELECT id, price, cost FROM petita.products ORDER BY random() LIMIT (2 + floor(random()*5)::int)) LOOP
      v_i := v_i + 1;
      v_qty := 1 + floor(random()*10)::int;
      v_lp := v_prod.price; v_up := v_lp * (0.92 + random()*0.08);
      v_uc := v_prod.cost; v_lt := v_qty * v_up; v_lprof := v_lt - (v_qty*v_uc);
      INSERT INTO petita.order_items (order_id,product_id,qty,list_price,unit_price,discount_pct,unit_cost,tax_amount,line_total,line_profit,position)
        VALUES (v_oid, v_prod.id, v_qty, v_lp, v_up, 3, v_uc, 0, v_lt, v_lprof, v_i);
      v_subtotal := v_subtotal + v_lt;
    END LOOP;
    v_disc := round((v_subtotal*0.03)::numeric, 2);
    v_tax := round((v_subtotal*0.08)::numeric, 2);
    v_total := v_subtotal - v_disc + v_tax;
    UPDATE petita.orders SET subtotal=v_subtotal, discount_amount=v_disc, tax_amount=v_tax, total=v_total WHERE id=v_oid;
  END LOOP;

  INSERT INTO petita.config (key,value) VALUES ('quotes_orders_seeded_v3','{"done":true}'::jsonb)
    ON CONFLICT (key) DO NOTHING;
END $$;
