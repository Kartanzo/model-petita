# Petita — Sistema de Vendas

Sistema web (mobile-first, PWA) para gestão comercial Petita: catálogo, clientes, orçamentos com cálculo automático de impostos e rentabilidade, pedidos, geração de PDFs.

## Stack

- **Next.js 14** App Router + TypeScript + Tailwind
- **PostgreSQL** (schema `petita`)
- **Puppeteer** (catálogo PDF) + **pdfkit** (orçamento PDF)
- **JWT** via cookie httpOnly + **bcryptjs**
- **PWA** (manifest + service worker)

## Como rodar local

1. Suba um Postgres (ou aponte para um existente).
2. Configure `.env.local`:
   ```
   DATABASE_URL=postgres://user:pass@host:5432/db?sslmode=disable
   JWT_SECRET=uma-string-longa-aleatoria
   ```
3. Rode o schema:
   ```bash
   psql "$DATABASE_URL" -f db/init.sql
   psql "$DATABASE_URL" -f db/full-schema.sql
   ```
4. Instale e rode:
   ```bash
   npm install
   npm run dev
   ```
5. Abra `http://localhost:3000` — login: `petita@petita.com.br` / `Senha123!`

## Build de produção

```bash
npm run build
npm start
```

Ou via Docker:
```bash
docker build -t petita .
docker run -p 3000:3000 --env-file .env.local petita
```

## Variáveis de ambiente

| Nome | Descrição |
|---|---|
| `DATABASE_URL` | Connection string Postgres (obrigatório) |
| `JWT_SECRET` | Chave para assinar tokens JWT |
| `PORT` | Porta HTTP (default 3000) |
| `UPLOAD_DIR` | Onde salvar fotos de produto (default `./uploads`) |
| `PUPPETEER_EXECUTABLE_PATH` | Caminho do Chrome (no Docker: `/usr/bin/chromium`) |

## Estrutura

```
src/
├── app/
│   ├── (app)/      # rotas autenticadas (dashboard, pedidos, ...)
│   ├── login/      # login
│   └── api/        # endpoints REST
├── lib/            # db, auth, pricing, pdf, validators
├── components/     # UI reutilizável
└── types/          # interfaces TS
db/
├── init.sql        # schema + superuser
└── full-schema.sql # tabelas + seeds (8 famílias, 100 produtos, 30 clientes)
```

## Deploy (EasyPanel)

1. Crie um app a partir deste repositório GitHub.
2. Aponte para o Dockerfile.
3. Configure as env vars acima.
4. Rode os SQLs no Postgres do EasyPanel.

## Credenciais demo

`petita@petita.com.br` / `Senha123!` (superuser)
