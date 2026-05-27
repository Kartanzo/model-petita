# Backend — Petita

## 1. Stack

- **Node.js 20** + **Express 4**
- **Postgres** (schema `petita` no instância EasyPanel `criadordigital`)
- **pg** + **pg-pool** + **pg-copy-streams** (carga)
- **bcryptjs** (hash de senha)
- **jsonwebtoken** (auth via cookie httpOnly)
- **cookie-parser**
- **multer** (upload de foto de produto)
- **sharp** (resize/otimização de fotos)
- **pdfkit** (PDF de orçamento — leve)
- **puppeteer** (PDF de catálogo — render HTML→PDF com layout rico)
- **dayjs** (datas)
- **zod** (validação de payload)

## 2. Estrutura

```
server/
├── server.js                # bootstrap express + middlewares
├── db.js                    # pool pg + helper q()
├── auth.js                  # middlewares auth + roles
├── routes/
│   ├── auth.routes.js
│   ├── users.routes.js
│   ├── families.routes.js
│   ├── products.routes.js
│   ├── customers.routes.js
│   ├── quotes.routes.js
│   ├── orders.routes.js
│   ├── tax-rules.routes.js
│   ├── templates.routes.js
│   ├── config.routes.js
│   └── pdf.routes.js
├── services/
│   ├── pricing.js           # cálculo de impostos, totais
│   ├── profitability.js     # margem, indicador rentável
│   ├── numbering.js         # numeração sequencial pedido/orçamento
│   └── pdf/
│       ├── catalog.js       # puppeteer + template HTML
│       └── quote.js         # pdfkit
└── seed/
    ├── customers.js         # 30+ dummies
    └── products.js          # importa do scrape petita.com.br
```

## 3. Schema Postgres (schema `petita`)

> Todas as tabelas em `petita.*`. Migrations idempotentes (`CREATE TABLE IF NOT EXISTS`). Trigger `updated_at` automático onde aplicável.

### 3.1 Usuários (já existe — `init.sql`)

```sql
petita.users (
  id SERIAL PK,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password TEXT NOT NULL,                -- bcrypt
  role TEXT NOT NULL CHECK (role IN ('user','admin','superuser')),
  active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
```

### 3.2 Famílias de produto

```sql
petita.product_families (
  id SERIAL PK,
  slug TEXT UNIQUE NOT NULL,             -- 'premium-cherie', 'anplas', etc
  name TEXT NOT NULL,                    -- 'Premium Cherie'
  description TEXT,
  display_order INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
```

Seed: as 8 linhas (Premium Cherie, Duke, Filhotes, Petit, Plus, Refeição, Acessórios, Anplas).

### 3.3 Produtos

```sql
petita.products (
  id SERIAL PK,
  code TEXT UNIQUE NOT NULL,             -- SKU
  name TEXT NOT NULL,
  family_id INT REFERENCES petita.product_families(id) ON DELETE RESTRICT,
  description TEXT,
  technical_specs JSONB DEFAULT '{}',    -- ficha técnica (peso, dimensões, capacidade, material)
  cost NUMERIC(12,2) NOT NULL DEFAULT 0, -- custo unitário
  price NUMERIC(12,2) NOT NULL DEFAULT 0,-- preço de tabela
  unit TEXT DEFAULT 'UN',                -- UN, CX, KG
  photo_url TEXT,                         -- URL/caminho da foto principal
  active BOOLEAN DEFAULT TRUE,
  created_by INT REFERENCES petita.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
CREATE INDEX ON petita.products(family_id);
CREATE INDEX ON petita.products(active);
CREATE INDEX ON petita.products(code);
```

### 3.4 Imagens adicionais do produto (opcional MVP)

```sql
petita.product_images (
  id SERIAL PK,
  product_id INT REFERENCES petita.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  display_order INT DEFAULT 0
)
```

### 3.5 Clientes

```sql
petita.customers (
  id SERIAL PK,
  type TEXT NOT NULL CHECK (type IN ('PF','PJ')),
  name TEXT NOT NULL,                     -- razão social ou nome
  trade_name TEXT,                        -- nome fantasia
  doc TEXT,                               -- CPF ou CNPJ
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
  segment TEXT,                           -- 'farmácia', 'loja bebê', 'distribuidor', etc
  credit_limit NUMERIC(14,2) DEFAULT 0,
  notes TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_by INT REFERENCES petita.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
CREATE INDEX ON petita.customers(name);
CREATE INDEX ON petita.customers(doc);
CREATE INDEX ON petita.customers(active);
```

### 3.6 Regras por família (descontos / margem)

```sql
petita.family_rules (
  id SERIAL PK,
  family_id INT REFERENCES petita.product_families(id) ON DELETE CASCADE,
  max_discount_pct NUMERIC(5,2) DEFAULT 0,    -- teto de desconto %
  min_margin_pct NUMERIC(5,2) DEFAULT 15,     -- margem mínima exigida
  default_markup_pct NUMERIC(5,2) DEFAULT 0,  -- markup padrão sobre custo
  override_role TEXT DEFAULT 'admin',         -- quem pode passar do teto
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
```

### 3.7 Regras de imposto

```sql
petita.tax_rules (
  id SERIAL PK,
  name TEXT NOT NULL,                  -- 'ICMS SP', 'PIS', 'COFINS', 'IPI Mamadeiras'
  tax_type TEXT NOT NULL CHECK (tax_type IN ('ICMS','PIS','COFINS','IPI','OUTRO')),
  rate NUMERIC(6,4) NOT NULL,          -- ex: 0.18 = 18%
  family_id INT REFERENCES petita.product_families(id) ON DELETE SET NULL,  -- NULL = aplica a tudo
  state CHAR(2),                       -- NULL = qualquer estado
  applies_to TEXT DEFAULT 'all' CHECK (applies_to IN ('all','quote','order')),
  active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
```

### 3.8 Templates (orçamento e pedido)

```sql
petita.templates (
  id SERIAL PK,
  scope TEXT NOT NULL CHECK (scope IN ('quote','order')),
  name TEXT NOT NULL,
  body JSONB NOT NULL DEFAULT '{}',    -- itens default, condições, observação, desconto padrão
  is_default BOOLEAN DEFAULT FALSE,
  created_by INT REFERENCES petita.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
```

### 3.9 Orçamentos

```sql
petita.quotes (
  id SERIAL PK,
  number TEXT UNIQUE NOT NULL,                                  -- ORC-2026-00001
  customer_id INT REFERENCES petita.customers(id) ON DELETE RESTRICT,
  user_id INT REFERENCES petita.users(id),
  template_id INT REFERENCES petita.templates(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'rascunho'
         CHECK (status IN ('rascunho','enviado','aprovado','rejeitado','convertido','expirado')),
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  cost_total NUMERIC(14,2) NOT NULL DEFAULT 0,                  -- custo total dos itens
  profit_amount NUMERIC(14,2) NOT NULL DEFAULT 0,               -- total - cost - taxes
  profit_pct NUMERIC(6,2) NOT NULL DEFAULT 0,
  profitability TEXT NOT NULL DEFAULT 'desconhecido'
         CHECK (profitability IN ('rentavel','atencao','nao_rentavel','desconhecido')),
  payment_terms TEXT,                                            -- '28/35/42 dias'
  delivery_terms TEXT,
  valid_until DATE,
  notes TEXT,
  sent_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
CREATE INDEX ON petita.quotes(customer_id);
CREATE INDEX ON petita.quotes(user_id);
CREATE INDEX ON petita.quotes(status);
CREATE INDEX ON petita.quotes(created_at);
```

### 3.10 Itens de orçamento

```sql
petita.quote_items (
  id SERIAL PK,
  quote_id INT REFERENCES petita.quotes(id) ON DELETE CASCADE,
  product_id INT REFERENCES petita.products(id) ON DELETE RESTRICT,
  qty NUMERIC(12,3) NOT NULL,
  list_price NUMERIC(12,2) NOT NULL,         -- preço de tabela snapshot
  unit_price NUMERIC(12,2) NOT NULL,         -- preço efetivo (após desconto)
  discount_pct NUMERIC(5,2) DEFAULT 0,
  unit_cost NUMERIC(12,2) NOT NULL,          -- custo snapshot
  tax_amount NUMERIC(12,2) DEFAULT 0,        -- imposto rateado
  line_total NUMERIC(14,2) NOT NULL,
  line_profit NUMERIC(14,2) NOT NULL,
  position INT DEFAULT 0
)
CREATE INDEX ON petita.quote_items(quote_id);
```

### 3.11 Pedidos + itens

```sql
petita.orders (
  id SERIAL PK,
  number TEXT UNIQUE NOT NULL,                                  -- PED-2026-00001
  customer_id INT REFERENCES petita.customers(id) ON DELETE RESTRICT,
  user_id INT REFERENCES petita.users(id),
  quote_id INT REFERENCES petita.quotes(id) ON DELETE SET NULL,
  template_id INT REFERENCES petita.templates(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'aberto'
         CHECK (status IN ('aberto','aprovado','faturado','cancelado')),
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  payment_terms TEXT,
  delivery_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
petita.order_items (mesma estrutura de quote_items, FK para orders)
```

### 3.12 Configuração geral

```sql
petita.config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by INT REFERENCES petita.users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
)
```

Chaves esperadas: `company` (nome/CNPJ/endereço pra PDFs), `quote_defaults` (validade dias, termos), `numbering` (prefixos), `pdf` (cor primária, logo path).

### 3.13 Log de atividade (opcional)

```sql
petita.activity_log (
  id SERIAL PK,
  user_id INT,
  action TEXT,                  -- 'quote.create', 'order.update', 'quote.send'
  entity TEXT,
  entity_id INT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
)
```

## 4. Endpoints

> Todos em `/api/*`. JSON. Auth via cookie httpOnly `petita_token` (JWT).

### Auth
- `POST /api/auth/login` `{ email, password }` → cookie + `{ user }`
- `POST /api/auth/logout`
- `GET  /api/auth/me`

### Users (admin)
- `GET/POST/PATCH/DELETE /api/users`

### Famílias
- `GET /api/families`
- `POST/PATCH/DELETE /api/families` (admin)

### Produtos
- `GET /api/products?q&family_id&active`
- `GET /api/products/:id`
- `POST /api/products` (multipart: campos + photo)
- `PATCH /api/products/:id`
- `DELETE /api/products/:id` (soft delete preferível — `active=false`)
- `POST /api/products/:id/photo` (upload separado)

### Clientes
- `GET /api/customers?q&segment&active`
- `GET /api/customers/:id`
- `POST/PATCH/DELETE /api/customers`

### Orçamentos
- `GET /api/quotes?status&customer_id&user_id&from&to`
- `GET /api/quotes/:id`
- `POST /api/quotes` — cria; aceita `template_id` para pré-popular
- `PATCH /api/quotes/:id` — atualiza header + itens (transação)
- `DELETE /api/quotes/:id`
- `POST /api/quotes/:id/simulate` `{ items, taxes_override? }` → retorna totais sem persistir
- `POST /api/quotes/:id/send` → mock (marca `sent_at`, status `enviado`)
- `POST /api/quotes/:id/convert` → cria pedido a partir do orçamento
- `GET  /api/quotes/:id/pdf` → PDF do orçamento

### Pedidos
- Mesmo CRUD de quotes (`/api/orders`), sem `simulate`/`convert`/`send`
- `GET /api/orders/:id/pdf` (opcional MVP)

### Regras
- `GET/POST/PATCH/DELETE /api/family-rules` (admin)
- `GET/POST/PATCH/DELETE /api/tax-rules` (admin)

### Templates
- `GET /api/templates?scope=quote|order`
- `POST/PATCH/DELETE /api/templates`

### Config
- `GET /api/config` (todas as keys)
- `PUT /api/config/:key` `{ value }`

### Catálogo
- `POST /api/catalog/pdf` `{ family_ids?, product_ids?, options }` → PDF do catálogo

## 5. Regras de negócio

### 5.1 Cálculo de totais (em `services/pricing.js`)

Para cada item:
```
line_subtotal = qty * unit_price
line_tax      = somatório(rate aplicável para family/state * line_subtotal)
line_total    = line_subtotal + line_tax
line_cost     = qty * unit_cost
line_profit   = line_total - line_cost - line_tax
```

Header:
```
subtotal = Σ line_subtotal
discount_amount = Σ (qty * (list_price - unit_price))
tax_amount = Σ line_tax
total = Σ line_total
cost_total = Σ line_cost
profit_amount = total - cost_total - tax_amount
profit_pct = profit_amount / total * 100  (0 se total=0)
```

### 5.2 Indicador de rentabilidade

Para cada família envolvida no orçamento, pega `min_margin_pct`. Pega o **mínimo** entre as famílias = `floor`.
- `profit_pct >= floor`             → `rentavel`
- `profit_pct >= floor - 5`         → `atencao`
- `profit_pct < floor - 5`          → `nao_rentavel`

### 5.3 Validação de desconto (orçamento)

Para cada item, se `discount_pct > family_rules.max_discount_pct`:
- Se user.role permite (`override_role` da regra) → permite mas marca flag `override_used`
- Senão → `400 { error: 'discount_exceeds_max', max: X, family: Y }`

### 5.4 Numeração sequencial

`numbering.next(scope)` → consulta `petita.config['numbering']` para pegar prefixo e ano corrente; consulta MAX(number) das tabelas; retorna próximo. Em transação para evitar duplicatas (advisory lock).

### 5.5 PDFs

**Catálogo** (Puppeteer + template HTML):
- Capa: logo + "Catálogo de Produtos · {data}" + cor de fundo soft
- Sumário por família
- 1 produto = 1 bloco contínuo (uso de `page-break-inside: avoid; break-inside: avoid`)
- Cabeçalho fixo com logo pequeno + rodapé com nº de página
- Tamanho A4 portrait
- Margens 18mm

**Orçamento** (pdfkit):
- Cabeçalho com logo + dados da empresa (de `config.company`)
- Bloco cliente
- Tabela de itens (qtd, descrição, preço unit, total)
- Bloco totais
- Condições + observação
- Rodapé com número e data de validade

## 6. Seeds

- `seed/families.js` — 8 linhas Petita
- `seed/products.js` — importa o `produtos.json` da pasta `petita-projeto` (~70 produtos com fotos)
- `seed/customers.js` — gera 30+ clientes brasileiros plausíveis (nome, CNPJ válido por algoritmo, telefone, endereço SP/RJ/MG/PR, segmento)
- `seed/tax-rules.js` — 4-5 regras default (ICMS 18% SP, PIS 1.65%, COFINS 7.6%, IPI 5% para mamadeiras)
- `seed/family-rules.js` — 1 regra por família (desconto máx 15%, margem mín 25%)
- `seed/templates.js` — 2 templates: "Orçamento padrão Premium", "Pedido padrão Anplas atacado"
- `seed/config.js` — chaves iniciais

## 7. Variáveis de ambiente

| Nome | Default | Função |
|---|---|---|
| `DATABASE_URL` | — | Postgres EasyPanel (obrigatório) |
| `JWT_SECRET` | dev fallback | assinar tokens |
| `PORT` | 3000 | servidor |
| `UPLOAD_DIR` | `./uploads` | onde salva fotos de produto |
| `LOGO_PATH` | `./assets/logo-petita.png` | logo pra PDFs |
| `PDF_CHROMIUM_PATH` | auto | path do Chrome pra Puppeteer (se necessário) |

## 8. Skills a invocar (antes de codar cada parte)

- `backend-architect` — desenho geral, pra confirmar este plano
- `database-design` + `postgresql` + `sql-optimization-patterns` — schema, indexes
- `nodejs-backend-patterns` — estrutura Express
- `api-design-principles` — endpoints REST consistentes
- `pdf` ou `pdf-official` — geração de PDF (decidir pdfkit vs puppeteer)
- `security-auditor` — checar auth/JWT/upload safety
- `secrets-management` — env vars
- `error-handling-patterns` — middleware de erro consistente
- `api-testing-observability-api-mock` (futuro)

## 9. Decisões locked (2026-05-27)

| Item | Decisão |
|---|---|
| Delete | **Soft** (`active = false`) em produtos, clientes, usuários |
| Cliente | **PF e PJ** (campo `type` já previsto) |
| Imposto | Fixo no MVP; lookup por estado opcional via `state` na regra (já no schema) |
| Multitenancy | Não — só Petita |
| Storage de foto | Local em `UPLOAD_DIR` no MVP; S3 pós-MVP |
| PDF Catálogo | **Puppeteer** confirmado |
| PWA | Backend serve `manifest.json` + `service-worker.js` em rotas estáticas |
