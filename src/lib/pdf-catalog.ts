import puppeteer from 'puppeteer';
import { q } from './db';

export interface CatalogOpts {
  family_ids?: number[];
  product_ids?: number[];
  include_description?: boolean;
  include_specs?: boolean;
  order?: 'family' | 'name' | 'price';
  template_name?: string;
  cover_color?: { from: string; to: string };
}

interface ProductRow {
  id: number;
  code: string;
  name: string;
  description: string | null;
  price: number;
  photo_url: string | null;
  technical_specs: any;
  family_name: string;
  family_id: number;
}

export async function generateCatalogPDF(opts: CatalogOpts = {}): Promise<Buffer> {
  const where: string[] = ['p.active = TRUE'];
  const params: any[] = [];
  if (opts.family_ids?.length) { params.push(opts.family_ids); where.push(`p.family_id = ANY($${params.length}::int[])`); }
  if (opts.product_ids?.length) { params.push(opts.product_ids); where.push(`p.id = ANY($${params.length}::int[])`); }
  const orderBy = opts.order === 'name' ? 'p.name' : opts.order === 'price' ? 'p.price' : 'f.display_order, p.name';
  const { rows } = await q<ProductRow>(
    `SELECT p.id, p.code, p.name, p.description, p.price::float8 AS price, p.photo_url,
            COALESCE(p.technical_specs, '{}'::jsonb) AS technical_specs,
            f.name AS family_name, f.id AS family_id
       FROM petita.products p
       JOIN petita.product_families f ON f.id = p.family_id
      WHERE ${where.join(' AND ')}
      ORDER BY ${orderBy}`,
    params,
  );

  const { rows: cfg } = await q<any>(`SELECT value FROM petita.config WHERE key='company'`);
  const company = cfg[0]?.value ?? { name: 'Petita' };

  const html = renderHTML(company, rows, opts);
  const exec = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: exec,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' },
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:8px;color:#5d6b8a;width:100%;padding:0 12mm;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-weight:700;color:#1e4ba8;">Petita</span>
        <span>Catálogo</span>
        <span>Página <span class="pageNumber"></span>/<span class="totalPages"></span></span>
      </div>`,
      footerTemplate: `<div style="width:100%;height:4px;background:#1e4ba8;"></div>`,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

function defaultSpecs(p: ProductRow) {
  return {
    'Volume': '240 ml',
    'Idade indicada': '0-6 meses',
    'Material': 'Polipropileno BPA-free',
    'Peso': '80 g',
    'Dimensões': '18 × 5 × 5 cm',
  };
}

function specsTable(p: ProductRow): string {
  const specs = (p.technical_specs && Object.keys(p.technical_specs).length) ? p.technical_specs : defaultSpecs(p);
  const labelMap: Record<string, string> = {
    volume_ml: 'Volume', idade: 'Idade indicada', material: 'Material',
    peso_g: 'Peso', dimensoes_cm: 'Dimensões',
  };
  const unitMap: Record<string, string> = { volume_ml: ' ml', peso_g: ' g', dimensoes_cm: ' cm' };
  const entries = Object.entries(specs);
  if (!entries.length) return '';
  return `<table class="specs"><tbody>${entries.map(([k, v]) => `
    <tr><th>${esc(labelMap[k] || k)}</th><td>${esc(v)}${unitMap[k] || ''}</td></tr>
  `).join('')}</tbody></table>`;
}

function renderHTML(company: any, products: ProductRow[], opts: CatalogOpts): string {
  const today = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  const fmt = (n: number) => Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const cover = opts.cover_color ?? { from: '#1e4ba8', to: '#2aa3d9' };
  const showSpecs = opts.include_specs !== false;
  const showDesc = opts.include_description !== false;

  // group by family
  const groups: Record<string, ProductRow[]> = {};
  products.forEach((p) => { (groups[p.family_name] ||= []).push(p); });
  const familyEntries = Object.entries(groups);

  // TOC only if >= 10 products
  const toc = products.length >= 10 ? `
    <section class="toc">
      <h2>Sumário</h2>
      <ul>
        ${familyEntries.map(([fam, ps]) => `<li><span class="fam">${esc(fam)}</span><span class="dots"></span><span class="count">${ps.length} ${ps.length === 1 ? 'produto' : 'produtos'}</span></li>`).join('')}
      </ul>
    </section>` : '';

  // chunk products: 2 per page
  const cardsHtml: string[] = [];
  for (let i = 0; i < products.length; i += 2) {
    const pair = products.slice(i, i + 2);
    cardsHtml.push(`
      <div class="page">
        ${pair.map((p) => renderProductCard(p, fmt, showDesc, showSpecs)).join('')}
      </div>
    `);
  }

  const address = company.address ? `<div>${esc(company.address)}</div>` : '';
  const contact = [company.phone, company.email].filter(Boolean).map(esc).join(' · ');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: A4; margin: 15mm 12mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Nunito','Helvetica Neue',Arial,sans-serif; color: #192e63; margin: 0; padding: 0; font-size: 11px; -webkit-print-color-adjust: exact; }
    h1,h2,h3 { margin: 0; }

    /* COVER */
    .cover {
      position: relative;
      height: 270mm;
      background: linear-gradient(135deg, ${cover.from} 0%, ${cover.to} 100%);
      color: #fff;
      page-break-after: always;
      overflow: hidden;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center;
      padding: 40px;
    }
    .cover::before {
      content: '';
      position: absolute; inset: 0;
      background-image: radial-gradient(rgba(255,255,255,0.15) 1.5px, transparent 1.5px);
      background-size: 26px 26px;
      opacity: 0.55;
    }
    .cover .logo { width: 180px; height: auto; filter: brightness(0) invert(1); margin-bottom: 28px; position: relative; z-index: 1; }
    .cover h1 { font-size: 44px; font-weight: 800; letter-spacing: -0.5px; position: relative; z-index: 1; }
    .cover .sub { font-size: 16px; margin-top: 12px; opacity: 0.92; position: relative; z-index: 1; font-weight: 500; }
    .cover .tpl { font-size: 20px; margin-top: 8px; font-weight: 700; position: relative; z-index: 1; }
    .cover .date { font-size: 13px; margin-top: 6px; opacity: 0.8; position: relative; z-index: 1; }
    .cover .footer { position: absolute; bottom: 30px; left: 0; right: 0; text-align: center; font-size: 11px; opacity: 0.9; z-index: 1; }
    .cover .footer .brand { font-weight: 800; font-size: 13px; margin-bottom: 4px; }

    /* TOC */
    .toc { padding: 30px 10px; page-break-after: always; }
    .toc h2 { color: #1e4ba8; font-size: 28px; font-weight: 800; border-bottom: 3px solid #1e4ba8; padding-bottom: 10px; margin-bottom: 20px; }
    .toc ul { list-style: none; padding: 0; margin: 0; }
    .toc li { display: flex; align-items: baseline; gap: 8px; padding: 10px 0; font-size: 13px; border-bottom: 1px dashed #cfd8e8; }
    .toc .fam { font-weight: 700; color: #1e4ba8; }
    .toc .dots { flex: 1; border-bottom: 1.5px dotted #b6c2d8; transform: translateY(-3px); }
    .toc .count { color: #5d6b8a; font-size: 11px; }

    /* PAGE */
    .page { page-break-after: always; padding: 4px 0; }
    .page:last-child { page-break-after: auto; }

    /* PRODUCT CARD */
    .product {
      display: flex; gap: 14px;
      padding: 14px;
      border: 1px solid #e5ebf5;
      border-radius: 14px;
      margin-bottom: 12px;
      page-break-inside: avoid;
      break-inside: avoid;
      background: #fff;
      min-height: 120mm;
    }
    .product .photo {
      flex: 0 0 40%;
      max-width: 40%;
      border-radius: 10px;
      background: #f6f9ff;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
      box-shadow: 0 6px 20px -8px rgba(30,75,168,0.25);
    }
    .product .photo img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .product .info { flex: 1; display: flex; flex-direction: column; position: relative; }
    .product .badge {
      display: inline-block; align-self: flex-start;
      background: #eef4ff; color: #1e4ba8;
      padding: 3px 10px; border-radius: 999px;
      font-size: 9.5px; font-weight: 700; letter-spacing: 0.3px;
      text-transform: uppercase; margin-bottom: 8px;
    }
    .product h2 { color: #1e4ba8; font-size: 18px; font-weight: 800; line-height: 1.2; }
    .product .sku { font-family: 'Courier New',monospace; font-size: 9.5px; color: #8595b3; margin-top: 4px; }
    .product .desc { font-size: 11px; color: #4a5878; margin: 10px 0; line-height: 1.45; }
    .specs { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10px; }
    .specs th, .specs td { text-align: left; padding: 5px 8px; border-bottom: 1px solid #eef2f9; }
    .specs th { color: #5d6b8a; font-weight: 700; width: 40%; }
    .specs td { color: #192e63; }
    .product .price {
      position: absolute; bottom: 0; right: 0;
      font-family: 'Courier New', monospace;
      font-size: 22px; font-weight: 800;
      color: #1e4ba8;
    }
  </style></head><body>

  <section class="cover">
    <img src="${esc(company.logo_url || '/logo-petita.png')}" class="logo" alt="Petita"/>
    <h1>Catálogo de Produtos</h1>
    ${opts.template_name ? `<div class="tpl">${esc(opts.template_name)}</div>` : ''}
    <div class="sub">${esc(company.name || 'Petita')}</div>
    <div class="date">${today}</div>
    <div class="footer">
      <div class="brand">Petita · Um carinho a mais</div>
      ${address}
      ${contact ? `<div>${contact}</div>` : ''}
    </div>
  </section>

  ${toc}
  ${cardsHtml.join('')}
  </body></html>`;
}

function renderProductCard(p: ProductRow, fmt: (n: number) => string, showDesc: boolean, showSpecs: boolean): string {
  return `
    <article class="product">
      <div class="photo"><img src="${esc(p.photo_url || '')}" alt=""/></div>
      <div class="info">
        <span class="badge">${esc(p.family_name)}</span>
        <h2>${esc(p.name)}</h2>
        <div class="sku">SKU: ${esc(p.code)}</div>
        ${showDesc && p.description ? `<div class="desc">${esc(p.description)}</div>` : ''}
        ${showSpecs ? specsTable(p) : ''}
        <div class="price">${fmt(p.price)}</div>
      </div>
    </article>
  `;
}

function esc(s: any): string {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}
