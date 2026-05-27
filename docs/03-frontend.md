# Frontend — Petita

## 1. Princípios

- **Mobile-first absoluto**: layout começa em 375px. Bottom-nav, sheets, touch ≥44px. Ver `feedback_mobile_first.md`.
- **Identidade Petita**: paleta azul royal `#1e4ba8` + pastéis (azul/peach/mint), tipografia Nunito, **zero emojis**, Lucide icons.
- **Sem cargo cult**: tudo que está na tela tem função. Charts mostram valor sem hover. Filtros não poluem.
- **Acessibilidade**: WCAG AA, focus visible, `prefers-reduced-motion`, labels semânticos.
- **Performance**: imagens otimizadas (srcset / lazy), bundle pequeno, primeira tela <2s em 3G.

## 2. Stack (a decidir com user)

**Opção A — Vanilla (estilo demo BLOO)**
- HTML + Tailwind CDN + JS vanilla + Chart.js + Lucide
- Sem build, sem deploy de bundler. Edita e recarrega.
- Vantagem: zero ferramenta, deploy simples.
- Desvantagem: escala pior conforme complexidade cresce.

**Opção B — Next.js 14 (App Router) + Tailwind**
- Build-time tipado, componentes reutilizáveis, server actions, RSC opcional.
- Vantagem: melhor estrutura conforme o projeto cresce.
- Desvantagem: mais setup, build, deploy.

**Opção C — Vue 3 + Vite + Tailwind**
- Meio termo: SFC simples, build leve.

> Recomendação: **B (Next.js 14)** se o sistema for ter vida longa. **A (Vanilla)** se quiser entregar em 3 dias com 80% das funcionalidades.

## 3. Estrutura de telas (mobile)

```
Login                            (não logado)
└── /login

App (logado)
├── /                            Dashboard / Resumo
├── /pedidos                     Lista de pedidos
│   ├── /pedidos/novo
│   └── /pedidos/:id
├── /orcamentos                  Lista de orçamentos
│   ├── /orcamentos/novo
│   ├── /orcamentos/:id
│   └── /orcamentos/:id/simular
├── /clientes                    Lista de clientes
│   ├── /clientes/novo
│   └── /clientes/:id
├── /catalogo                    Browse produtos + gerar PDF
│   └── /catalogo/gerar
├── /produtos                    (admin) CRUD produtos
│   ├── /produtos/novo
│   └── /produtos/:id
└── /config                      (admin)
    ├── /config/empresa
    ├── /config/familias
    ├── /config/impostos
    ├── /config/regras-familia
    ├── /config/templates
    └── /config/usuarios
```

## 4. Layout

### Mobile (≤768px)
- **Topbar fina** (56px): logo pequeno à esquerda, título da página no centro, avatar à direita
- **Conteúdo full-width** com padding 16px
- **Bottom-nav fixo** (64px, safe-area): 4 itens — Pedidos · Orçamentos · Catálogo · Clientes
- **Mais ações**: botão `+` flutuante (FAB) no canto inferior direito acima do bottom-nav
- **Drawer lateral** (acionado por avatar ou botão menu): config, usuários, sair
- **Filtros**: bottom-sheet (slide-up) full-width
- **Forms**: stepper de 1 input por linha; sticky CTA no rodapé

### Desktop (≥1024px)
- **Sidebar fixa** 240px à esquerda com nav completa
- **Topbar** com breadcrumb + ações da página
- **Conteúdo** max-width ~1200px com gutters
- **Filtros inline** no topo das listas
- **Forms** em 2 colunas onde fizer sentido

## 5. Componentes-chave

| Componente | Mobile | Desktop |
|---|---|---|
| Lista | Card stacked (clicável p/ detalhe) | Tabela com colunas selecionáveis |
| Filtro | Bottom-sheet | Bar inline |
| Form orçamento | Stepper / accordion por seção | 2 colunas |
| Picker de produto | Tela full c/ busca + lista | Modal lateral c/ busca |
| Picker de cliente | Idem | Idem |
| Confirm dialog | Bottom-sheet alto | Modal central |
| Toast / feedback | Topo (banner) | Canto superior direito |
| Date picker | `<input type="date">` nativo | Idem ou Flatpickr |

## 6. Telas — detalhes

### 6.1 Login (já feito — preview em `login-preview.html`)
- Card centralizado, gradientes pastel + bolhinhas animadas
- Logo Petita real
- Email + senha + lembrar-me + esqueci

### 6.2 Dashboard / Home
- 4 KPIs: orçamentos abertos · valor total em orçamento · pedidos do mês · ticket médio
- Linha de tendência: valor de orçamentos/pedidos por dia (últimos 30d)
- Lista "Últimos orçamentos" (5 itens)
- Atalhos: "+ Novo orçamento", "+ Novo pedido"

### 6.3 Lista de orçamentos
- Filtros: status, cliente, vendedor (admin), data
- Card mobile: número · cliente · status pill · valor · data
- Sort: data desc default
- Tap → detalhe

### 6.4 Detalhe / Novo orçamento
- Seções (accordion no mobile):
  1. **Cliente** (picker)
  2. **Itens** (lista + botão "+ Adicionar produto")
     - Cada item: foto · nome · qty · preço unit (editável dentro do teto) · subtotal · margem indicada
     - Toque longo → opções (remover, simular, duplicar)
  3. **Cálculos**: subtotal · desconto · impostos · **total** · margem % · pill rentabilidade
  4. **Condições**: forma pgto, prazo entrega, validade
  5. **Observações** (textarea)
- CTAs sticky no rodapé: `Salvar rascunho` · `Enviar` · `Gerar PDF`
- Indicador "Rentável / Atenção / Não rentável" em pill colorido grande no topo da seção de cálculos

### 6.5 Simulação
- Tela dedicada (modal full-screen no mobile)
- Slider de desconto % por item ou geral
- Atualiza margem em tempo real
- Botão "Aplicar ao orçamento"

### 6.6 Lista de pedidos
- Similar a orçamentos, com status (aberto / aprovado / faturado / cancelado)

### 6.7 Detalhe / Novo pedido
- Similar a orçamento, com fluxo mais curto (sem simulação)
- Pode partir de "Converter orçamento → pedido"

### 6.8 Catálogo (browse)
- Grid de cards de produto (mobile: 2 colunas; desktop: 4)
- Filtro família (chip horizontal scroll no mobile)
- Busca por nome/código
- Cada card: foto · nome · preço de tabela · família tag
- Toque → detalhe
- Botão flutuante: "Gerar catálogo PDF" (abre seleção)

### 6.9 Gerar catálogo PDF
- Multi-select de famílias OU produtos específicos
- Opções: incluir descrição (sim/não), incluir ficha técnica (sim/não), ordem (família/alfabética/preço)
- Preview da capa (mock)
- Botão "Gerar e baixar"

### 6.10 Produtos (admin CRUD)
- Lista com busca + filtro família
- Form de cadastro/edição:
  - Foto (upload) · código · nome · família (select) · descrição · ficha técnica (key-value) · custo · preço · unidade · ativo
- Validação inline

### 6.11 Clientes
- Lista com busca + filtro segmento
- Form: tipo PF/PJ · razão · fantasia · doc · contato · endereço · segmento · limite crédito · obs

### 6.12 Configurações
- Cards de cada seção (empresa, famílias, impostos, regras família, templates, usuários)
- Cada uma com tela própria de CRUD

## 7. Design System

### 7.1 Cores

```
Brand
  brand-50   #eef4ff
  brand-100  #dbe6ff
  brand-200  #bccffd
  brand-300  #8cabfa
  brand-500  #3a5bec
  brand-700  #1e4ba8   ← primária (logo)
  brand-900  #192e63
Acentos
  cream      #fff8ec
  peach      #ffd9c2
  mint       #cfeede
Neutros
  bg         #f6f9ff   (background app)
  panel      #ffffff
  border     #e5ebf5
  text       #192e63   (texto primário; usa brand-900)
  muted      #5d6b8a   (texto secundário)
Semânticos
  success    #16a07c
  warning    #d88514
  danger     #dc2626
  info       #2aa3d9
```

### 7.2 Tipografia (Nunito)

```
display   28px / 700  (títulos grandes)
h1        22px / 700
h2        18px / 700
body      15px / 500
small     13px / 500
tiny      11px / 600 uppercase tracking-wider (labels, KPIs)
mono      JetBrains Mono para números/IDs/códigos
```

### 7.3 Spacing & shape
- Grid 4px (Tailwind default)
- Bordas arredondadas: `rounded-xl` (12px) padrão, `rounded-2xl` cards principais
- Shadows: muito suaves, só em hover ou cards principais
  - `shadow-[0_4px_12px_-4px_rgba(30,75,168,0.10)]`

### 7.4 Componentes-padrão (a implementar)
- `<Button>` 3 variantes: primary (gradient brand), secondary (white border), ghost
- `<Input>`, `<Select>`, `<Textarea>` com label, error, helper
- `<Card>` (header opcional, body, footer opcional)
- `<KpiCard>` (icon tonal + label + valor mono + delta)
- `<Pill>` (success/warning/danger/info)
- `<Sheet>` (bottom-sheet mobile, modal lateral desktop)
- `<DataTable>` (mobile vira lista de cards)
- `<EmptyState>` (ilustração simples + mensagem + CTA)
- `<Toast>` (banner topo mobile, canto superior direito desktop)

## 8. Comportamento mobile (não-negociável)

- Bottom-nav sempre visível em /pedidos, /orcamentos, /catalogo, /clientes
- Form full-screen com header sticky e CTA sticky no rodapé
- Lista virtualizada se >100 itens
- Inputs com `inputmode` correto (`numeric`, `email`, `tel`, `decimal`)
- iOS safe-area: `env(safe-area-inset-bottom/top)`
- Touch targets ≥44px (botões `h-12 px-4` mínimo)
- Skeleton loader nas listas (evita layout shift)
- Pull-to-refresh nas listas principais (opcional, usa lib leve ou nativo PWA)
- Funciona offline básico (PWA) → service worker cacheia shell + assets (pós-MVP)

## 9. PDFs vistos no frontend
- Catálogo abre em nova aba (`<a target="_blank">`)
- Orçamento idem; mobile suporta share intent nativo via Web Share API

## 10. Skills a invocar (antes de codar)

- `ui-ux-pro-max` — rodar com `--design-system` ANTES de qualquer pixel
- `mobile-design` — confirmar padrões mobile específicos
- `kpi-dashboard-design` — para o Dashboard / Home
- `frontend-design` — qualidade visual
- `tailwind-design-system` + `tailwind-patterns` — utilitários
- `react-best-practices` ou `nextjs-best-practices` (se for B)
- `react-ui-patterns` + `radix-ui-design-system` (se for B) — primitives acessíveis
- `form-cro` — UX dos formulários (orçamento é o coração)
- `accessibility-compliance-accessibility-audit` — WCAG
- `screen-reader-testing`
- `web-performance-optimization`
- `data-storytelling` — Dashboard

## 11. Decisões locked (2026-05-27)

| Item | Decisão |
|---|---|
| Stack | **Next.js 14 App Router + TypeScript + Tailwind** |
| PWA | **Sim no MVP** — manifest.json + service-worker.js (instalável) |
| Dashboard | **Completo** — KPIs, tendências (chart), atalhos, top clientes/produtos |
| Imposto no PDF | Linha agregada "Impostos R$ X" + tooltip/quebra abaixo com detalhe (ICMS/PIS/COFINS/IPI) |
| Catálogo | Ordenação por família ou nome (sem drag-and-drop no MVP) |
| Tema escuro | Não no MVP |
| Idioma | pt-BR único |

## 12. Próximo passo

Rodar `db/init.sql` no Postgres → começo backend (Express + pg) + boilerplate Next.js em paralelo.
