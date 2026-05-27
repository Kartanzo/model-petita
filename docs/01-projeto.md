# Projeto Petita — Sistema de Vendas (Pedidos, Orçamentos, Catálogo)

## 1. Resumo

Sistema web (mobile-first) para a equipe comercial da Petita gerenciar **catálogo de produtos**, **clientes**, **pedidos** e **orçamentos** com **simulação de rentabilidade** e geração de PDFs (catálogo e orçamento).

## 2. Objetivo

Substituir planilhas / processos manuais por um sistema único onde representantes e gestores conseguem:

- Cadastrar e manter produtos, com foto, preço, custo, descrição, ficha técnica e família.
- Cadastrar clientes (CRM básico).
- Montar **orçamentos** para clientes, com:
  - Cálculo automático de impostos (regras configuráveis).
  - Validação de **teto de desconto por família** e indicador de **rentabilidade**.
  - Geração de **PDF do orçamento** com identidade visual Petita.
  - Botão de **enviar para o cliente** (mock no MVP — futura integração e-mail/WhatsApp).
- Converter orçamento em **pedido** (com regras próprias por família e modelos pré-salvos).
- Gerar **catálogo em PDF** filtrável (com capa, logo, sem quebras de página cortando produto).
- Salvar **modelos** (templates) reutilizáveis tanto de orçamento quanto de pedido.
- Configurar regras: impostos, descontos máximos por família, margens mínimas.

## 3. Usuários e papéis

| Role | O que faz |
|---|---|
| **superuser** | Tudo, incluindo gerenciar outros usuários e regras |
| **admin** | Gerencia produtos, clientes, regras, vê todos os pedidos/orçamentos |
| **vendedor** | Cria/edita seus próprios pedidos/orçamentos; vê catálogo; vê seus clientes |
| **consulta** *(opcional)* | Só leitura (gestor que acompanha) |

Login inicial já criado: `petita@petita.com.br` / `Senha123!` (superuser) — ver `db/init.sql`.

## 4. Fluxos principais

### 4.1 Catálogo
1. Vendedor abre catálogo → filtra por família (Premium Cherie / Duke / Filhotes / Petit / Plus / Refeição / Acessórios / Anplas).
2. Seleciona produtos para o catálogo PDF (pode escolher todos ou subset).
3. Clica "Gerar PDF" → recebe arquivo com capa (logo + título + data), índice por família, 1 produto por bloco com foto + nome + preço + descrição curta. Quebras de página respeitam o bloco do produto.

### 4.2 Cadastrar pedido / orçamento
1. Escolhe cliente (ou cria novo).
2. Escolhe modelo (template) ou começa do zero.
3. Adiciona itens (busca produto, define quantidade, preço de venda dentro do teto).
4. Sistema mostra em tempo real: subtotal, impostos, total, **margem %**, indicador "Rentável / Atenção / Não rentável".
5. Salva como **orçamento** (status: rascunho → enviado → aprovado → convertido em pedido / perdido).
6. Pedido: gera número sequencial, fixa preços/impostos no momento, salva.

### 4.3 Simulação de rentabilidade
- Em qualquer linha do orçamento o vendedor pode rodar simulação: "se eu cobrar R$ X de desconto, qual fica a margem?"
- Sistema usa: custo do produto, regras da família (margem mínima exigida), impostos aplicáveis.
- Bloqueia se desconto > teto (configurável por família e por role — admin pode passar do teto, vendedor não).

### 4.4 Configurações (admin)
- Famílias: nome, regras (margem mínima, desconto máximo, markup padrão).
- Impostos: cadastrar regras (ICMS por estado, PIS, COFINS, IPI; tipo, alíquota, aplica a família X).
- Modelos: salvar templates de orçamento e pedido (com itens pré-carregados, condições, observação padrão).
- Configurações gerais: validade padrão do orçamento, prefixos de numeração, dados da empresa pra PDFs.

## 5. Escopo MVP vs futuro

**MVP**
- Auth + roles (3 níveis)
- CRUD: produtos, famílias, clientes, impostos, regras de família, templates
- Orçamento + pedido com cálculo automático
- Simulação de rentabilidade
- Geração de PDFs (catálogo e orçamento)
- Botão de "enviar" como mock (não integra e-mail/WhatsApp ainda)
- Dummies: ≥30 clientes pré-cadastrados

**Pós-MVP (não fazer agora)**
- Integração real e-mail (SendGrid/SES)
- Integração WhatsApp Business
- Aprovação multi-step (vendedor → gerente)
- Dashboard analítico
- Importação CSV de produtos
- App nativo (PWA já cobre 90%)

## 6. Restrições não-negociáveis

- **Mobile-first**: cada tela testada em 375px antes de qualquer breakpoint maior. Bottom-nav, drawer/sheet para filtros, touch ≥44px. Ver `feedback_mobile_first.md`.
- **Identidade Petita**: logo azul royal (~`#1e4ba8`), fundos claros com pastéis (azul/peach/mint), tipografia amigável (Nunito), **sem emojis** (Lucide icons).
- **Acessibilidade**: WCAG AA, focus visible, labels semânticos, contraste 4.5:1+, `prefers-reduced-motion`.
- **PDFs sem cortes**: bloco de produto = unidade indivisível; capa fixa; logo presente.
- **Dados sempre visíveis nos gráficos** (sem precisar hover) — regra do `feedback_dashboards_e_ui.md`.

## 7. Stack proposta (a decidir)

| Camada | Sugestão | Motivo |
|---|---|---|
| Backend | Node.js 20 + Express + `pg` | Padrão dos outros projetos do user, fácil deploy EasyPanel |
| DB | Postgres (EasyPanel existente, schema `petita`) | Já temos credenciais, instância pronta |
| Auth | JWT + bcrypt | Stateless, simples |
| PDF | `pdfkit` (orçamento) + `puppeteer` ou `playwright` (catálogo com layout HTML→PDF) | pdfkit é leve; HTML→PDF é mais flexível pra catálogo visual |
| Frontend | **A escolher**: (a) HTML+Tailwind+vanilla JS (estilo demo do BLOO) ou (b) Next.js 14 / Vue 3 com Vite | (a) é simples sem build; (b) escala melhor |
| UI | Tailwind + Nunito + Lucide icons | Já validado no login |
| Deploy | EasyPanel (mesmo do BLOO) | Já configurado |
| Storage de fotos | Local (volume EasyPanel) ou S3-compatible | MVP: local; escala: S3 |

## 8. Estrutura de pastas (proposta)

```
petita-projeto/
├── docs/                    # MDs deste planejamento
├── db/                      # SQL (init.sql, migrations)
├── server/                  # backend Node
│   ├── routes/
│   ├── services/            # cálculo impostos, rentabilidade, pdf
│   ├── pdf/                 # templates pdfkit/puppeteer
│   └── server.js
├── public/                  # frontend
│   ├── index.html
│   ├── assets/
│   └── js/
├── data/                    # seed dummies (clientes, etc)
├── Dockerfile
└── package.json
```

## 9. Cronograma sugerido (estimativa)

1. **Dia 1**: schema completo + auth + seed (clientes/produtos/famílias) — backend mínimo
2. **Dia 2**: CRUD produtos/clientes + catálogo PDF
3. **Dia 3**: orçamento (formulário + cálculos + PDF + mock send)
4. **Dia 4**: pedido + templates + configurações
5. **Dia 5**: polish mobile + ajustes finais

## 10. Decisões locked (2026-05-27)

| Decisão | Escolha |
|---|---|
| Stack frontend | **Next.js 14 (App Router) + Tailwind + TypeScript** |
| Cliente | **PF e PJ** |
| Delete | **Soft delete** (`active = false`) |
| PDF Catálogo | **Puppeteer** (HTML → PDF, melhor controle visual) |
| PWA | **Sim, no MVP** (manifest + service worker) |
| Dashboard | **Completo** (KPIs, tendências, atalhos, top clientes/produtos) |
| Deploy | EasyPanel via GitHub |
| Postgres | EasyPanel `criadordigital`, schema `petita` |

## 11. Próximo passo

- Você executa `db/init.sql` no Postgres do EasyPanel
- Eu começo pelo backend (Node + Express + pg + Puppeteer)
- Em paralelo monto o boilerplate Next.js + design tokens
