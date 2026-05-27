const fs = require('fs');
const path = require('path');
const produtos = require(path.join(__dirname, '..', 'produtos.json'));

const familyMap = {
  'linha-premium-cherie': { slug: 'premium-cherie', name: 'Premium Cherie', order: 1 },
  'linha-premium-duke': { slug: 'premium-duke', name: 'Premium Duke', order: 2 },
  'linha-premium-filhotes': { slug: 'premium-filhotes', name: 'Premium Filhotes', order: 3 },
  'linha-premium-petit': { slug: 'premium-petit', name: 'Premium Petit', order: 4 },
  'linha-plus': { slug: 'premium-plus', name: 'Premium Plus', order: 5 },
  'linha-refeicao': { slug: 'refeicao', name: 'Refeição', order: 6 },
  'acessorios': { slug: 'acessorios', name: 'Acessórios', order: 7 },
  'linha-anplas': { slug: 'anplas', name: 'Anplas', order: 8 },
};

const esc = (s) => String(s || '').replace(/'/g, "''");
const slugify = (s) =>
  String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// deterministic pseudo-random for stable seeds
let seed = 42;
function rand() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
function rnd(a, b) { return Math.round((a + rand() * (b - a)) * 100) / 100; }

const codes = new Set();
const productInserts = produtos.map((p) => {
  const fam = familyMap[p.linha];
  if (!fam) return null;
  const baseName = p.nome.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  let code = fam.slug.substring(0, 3).toUpperCase() + '-' +
    slugify(p.nome).substring(0, 20).toUpperCase().replace(/-/g, '');
  let c = code; let n = 1;
  while (codes.has(c)) { c = code + '-' + n++; }
  codes.add(c); code = c;
  const cost = rnd(3, 25);
  const price = Math.round(cost * rnd(2.5, 4.0) * 100) / 100;
  const photo = '/produtos/' + (p.image_local ? p.image_local.replace(/^produtos\//, '') : 'placeholder.jpg');
  const desc = p.descricao || (baseName + ' - linha ' + fam.name);
  return `('${esc(code)}','${esc(baseName)}',(SELECT id FROM petita.product_families WHERE slug='${fam.slug}'),'${esc(desc)}','{}'::jsonb,${cost},${price},'UN','${esc(photo)}',TRUE)`;
}).filter(Boolean);

// CNPJ/CPF
function calcDV(arr, weights) {
  let s = 0;
  for (let i = 0; i < arr.length; i++) s += arr[i] * weights[i];
  const r = s % 11; return r < 2 ? 0 : 11 - r;
}
function genCNPJ() {
  const a = Array.from({ length: 12 }, () => Math.floor(rand() * 10));
  a[8] = 0; a[9] = 0; a[10] = 0; a[11] = 1;
  const d1 = calcDV(a, [5,4,3,2,9,8,7,6,5,4,3,2]);
  const d2 = calcDV([...a, d1], [6,5,4,3,2,9,8,7,6,5,4,3,2]);
  return [...a, d1, d2].join('').replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}
function genCPF() {
  const a = Array.from({ length: 9 }, () => Math.floor(rand() * 10));
  const d1 = calcDV(a, [10,9,8,7,6,5,4,3,2]);
  const d2 = calcDV([...a, d1], [11,10,9,8,7,6,5,4,3,2]);
  return [...a, d1, d2].join('').replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

const nomes = ['Pet Shop Amigo Fiel','Farmacia Pet Carinho','Distribuidora BabyBem','Loja Bebe Feliz','Marketplace Maes e Bebes','Atacado Sul Nutricao','Mercado Infantil Boa Vista','Casa do Bebe','Pet Center Aurora','Drogaria Vital Mae','Lojas Pequeninos','Distribuidora Norte Pet','Bebe Show Atacado','Pet Vida Boutique','Farmacia Mamae e Filho','MultiMarcas Infantil','Distribuidora Sul Bebe','Loja Cantinho Materno','Atacadao Pet Brasil','Pet Glamour SP','Bebe Premium Store','Farma Bebe 24h','Distribuidora ABC Bebe','Loja Maezinha Eireli','Pet Lovers Marketplace','Casa Materna Curitiba','BabyMix Distribuidora','Pet Boutique Ipanema','Loja Filhotes e Bebes','Mercadinho Infantil Bom Preco'];
const cidades = [['Sao Paulo','SP'],['Rio de Janeiro','RJ'],['Belo Horizonte','MG'],['Curitiba','PR'],['Campinas','SP'],['Santos','SP'],['Niteroi','RJ'],['Uberlandia','MG'],['Londrina','PR'],['Guarulhos','SP']];
const segs = ['farmacia','loja bebe','distribuidor','atacado','marketplace','pet shop'];
const customers = nomes.map((n, i) => {
  const type = i % 4 === 0 ? 'PF' : 'PJ';
  const doc = type === 'PF' ? genCPF() : genCNPJ();
  const [city, state] = cidades[i % cidades.length];
  const seg = segs[i % segs.length];
  const phone = '(11) 9' + Math.floor(1000 + rand() * 9000) + '-' + Math.floor(1000 + rand() * 9000);
  const email = slugify(n) + '@example.com.br';
  return `('${type}','${esc(n)}','${esc(n)}','${esc(doc)}','${esc(email)}','${phone}','${phone}','Rua das Flores','${100 + i}','','Centro','${esc(city)}','${state}','01000-000','${seg}',${(i + 1) * 1000},'Cliente seed dummy',TRUE)`;
});

const out = `-- =============================================================
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
${Object.values(familyMap).map(f => `('${f.slug}','${esc(f.name)}',${f.order})`).join(',\n')}
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
${productInserts.join(',\n')}
ON CONFLICT (code) DO NOTHING;

INSERT INTO petita.customers (type,name,trade_name,doc,email,phone,whatsapp,address_street,address_number,address_complement,address_district,address_city,address_state,address_zip,segment,credit_limit,notes,active) VALUES
${customers.join(',\n')}
ON CONFLICT DO NOTHING;
`;

fs.writeFileSync(path.join(__dirname, '..', 'db', 'full-schema.sql'), out);
console.log('Wrote', out.length, 'bytes,', productInserts.length, 'products,', customers.length, 'customers');
