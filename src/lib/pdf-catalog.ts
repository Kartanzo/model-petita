import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { q } from './db';

const NAVY = '#1e4ba8';
const CYAN = '#2aa3d9';

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

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

function loadImageBase64(photoUrl: string | null | undefined): string | null {
  if (!photoUrl) return null;
  try {
    const rel = photoUrl.startsWith('/') ? photoUrl.slice(1) : photoUrl;
    const full = path.join(PUBLIC_DIR, rel);
    if (!fs.existsSync(full)) return null;
    const buf = fs.readFileSync(full);
    const ext = path.extname(full).toLowerCase().replace('.', '') || 'jpeg';
    const mime = ext === 'jpg' ? 'jpeg' : ext;
    return `data:image/${mime};base64,${buf.toString('base64')}`;
  } catch { return null; }
}

function logoBase64(): string | null { return loadImageBase64('/logo-petita.png'); }

function esc(s: any): string {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

function fmt(n: any): string { return Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

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
       LEFT JOIN petita.product_families f ON f.id = p.family_id
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
    await page.evaluateHandle('document.fonts.ready');
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
      displayHeaderFooter: false,
      preferCSSPageSize: true,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

function defaultSpecsFor(p: ProductRow): Record<string, string> {
  const name = (p.name || '').toLowerCase();
  const fam = (p.family_name || '').toLowerCase();
  const base: Record<string, string> = {
    'Linha': p.family_name || '—',
    'Categoria': fam.includes('anplas') ? 'Atacado' : 'Premium',
  };
  if (name.includes('mamadeira')) {
    Object.assign(base, { 'Tipo': 'Mamadeira', 'Capacidade': '240 ml', 'Material': 'Polipropileno', 'Idade': '0-6 meses', 'Peso': '80 g', 'Dimensões': '18 × 5 × 5 cm' });
  } else if (name.includes('chupeta')) {
    Object.assign(base, { 'Tipo': 'Chupeta', 'Bico': 'Silicone', 'Idade': '0-6m / 6m+', 'Peso': '15 g', 'Material': 'PP + silicone' });
  } else if (name.includes('copo')) {
    Object.assign(base, { 'Tipo': 'Copo de treinamento', 'Capacidade': '270 ml', 'Material': 'Polipropileno', 'Idade': '6m+' });
  } else if (name.includes('kit')) {
    Object.assign(base, { 'Tipo': 'Kit', 'Material': 'Multimaterial' });
  } else {
    Object.assign(base, { 'Tipo': 'Acessório', 'Material': 'Polipropileno' });
  }
  base['Observações'] = 'Livre de BPA · Livre de Ftalatos · Atóxico';
  return base;
}

function specsRows(p: ProductRow): string {
  const raw: any = p.technical_specs && typeof p.technical_specs === 'object' && Object.keys(p.technical_specs).length
    ? p.technical_specs
    : defaultSpecsFor(p);
  const rows: [string, string][] = [];
  const push = (k: string, v: any, suffix = '') => {
    if (v === null || v === undefined || v === '') return;
    rows.push([k, `${v}${suffix}`]);
  };
  push('Família', p.family_name || raw.linha);
  push('Material', raw.material);
  push('Idade indicada', raw.idade);
  push('Capacidade', raw.capacidade_ml ?? raw.volume_ml, ' ml');
  push('Altura', raw.altura_cm, ' cm');
  push('Comprimento', raw.comprimento_cm, ' cm');
  push('Largura', raw.largura_cm, ' cm');
  push('Peso', raw.peso_g, ' g');
  push('Cor', raw.cor || raw.cores);
  push('Bico', raw.bico);
  rows.push(['Certificações', 'INMETRO · BPA-free · Atóxico']);
  return rows.map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td class="v">${esc(v)}</td></tr>`).join('');
}

function renderProductPage(p: ProductRow, idx: number, total: number, opts: CatalogOpts, logo: string | null): string {
  const img = loadImageBase64(p.photo_url);
  const photoHTML = img
    ? `<img src="${img}" alt=""/>`
    : `<div class="noimg">Sem imagem</div>`;
  const showDesc = opts.include_description !== false;
  const showSpecs = opts.include_specs !== false;
  return `
  <section class="page product">
    ${logo ? `<img src="${logo}" class="page-logo" alt="Petita"/>` : ''}
    <div class="left product-photo">
      ${photoHTML}
    </div>
    <div class="right">
      <span class="badge">${esc(p.family_name || '—')}</span>
      <h2 class="title">${esc(p.name)}</h2>
      <div class="sku">SKU ${esc(p.code)}</div>
      ${showDesc && p.description ? `<p class="desc">${esc(p.description)}</p>` : ''}
      ${showSpecs ? `
        <div class="ft-label">Ficha técnica</div>
        <div class="ft-bar"></div>
        <table class="specs"><tbody>${specsRows(p)}</tbody></table>` : ''}
      <div class="price">${fmt(p.price)}</div>
    </div>
    <div class="pagefoot">
      <span>Petita — Catálogo ${new Date().getFullYear()}</span>
      <span>Página ${idx + 1} de ${total}</span>
    </div>
  </section>`;
}

function renderHTML(company: any, products: ProductRow[], opts: CatalogOpts): string {
  const today = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  const cover = opts.cover_color ?? { from: NAVY, to: CYAN };
  const logo = logoBase64();
  const totalPages = products.length + 1;
  const pages = products.map((p, i) => renderProductPage(p, i + 1, totalPages, opts, logo)).join('');
  const address = company.address ? `<div>${esc(company.address)}</div>` : '';

  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: 'Nunito', 'Helvetica Neue', Arial, sans-serif; color: #192e63; font-size: 11px; -webkit-print-color-adjust: exact; }
  .page { width: 210mm; height: 297mm; page-break-after: always; position: relative; overflow: hidden; background: #fff; }
  .page:last-child { page-break-after: auto; }

  /* COVER */
  .cover { background: linear-gradient(135deg, ${cover.from} 0%, ${cover.to} 100%); color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 40px; }
  .cover::before { content:''; position:absolute; inset:0; background-image: radial-gradient(rgba(255,255,255,0.18) 1.5px, transparent 1.5px); background-size: 26px 26px; opacity: 0.55; }
  .cover .logo-panel { background: #ffffff; padding: 28px 56px; border-radius: 24px; box-shadow: 0 12px 40px rgba(0,0,0,0.18); display: inline-flex; margin-bottom: 32px; position: relative; z-index: 1; }
  .cover .logo-panel img { height: 110px; width: auto; display: block; }
  .cover h1 { font-size: 48px; font-weight: 800; letter-spacing: -0.5px; position: relative; z-index: 1; margin: 0; }
  .cover .sub { font-size: 16px; margin-top: 14px; opacity: 0.95; position: relative; z-index: 1; font-weight: 500; }
  .cover .tpl { font-size: 20px; margin-top: 8px; font-weight: 700; position: relative; z-index: 1; }
  .cover .date { font-size: 13px; margin-top: 6px; opacity: 0.85; position: relative; z-index: 1; }
  .cover .footer { position: absolute; bottom: 22mm; left: 0; right: 0; text-align: center; font-size: 11px; opacity: 0.92; z-index: 1; }
  .cover .footer .brand { font-weight: 800; font-size: 13px; margin-bottom: 4px; letter-spacing: 0.5px; }

  /* PRODUCT PAGE */
  .product { display: grid; grid-template-columns: 1fr 1fr; }
  .product .product-photo { width: 100%; height: 100%; background: #f8f9fb; display: flex; align-items: center; justify-content: center; padding: 16mm; box-sizing: border-box; overflow: hidden; }
  .product .product-photo img { max-width: 100%; max-height: 100%; object-fit: contain; display: block; }
  .product .product-photo .noimg { width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#8595b3; font-size:14px; }
  .product .right { padding: 18mm; display: flex; flex-direction: column; position: relative; }
  .product .badge { display: inline-block; align-self: flex-start; background: ${NAVY}; color: #fff; padding: 4px 12px; border-radius: 4px; font-size: 9px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px; }
  .product .title { color: ${NAVY}; font-size: 24px; font-weight: 700; line-height: 1.15; margin: 0 0 4px 0; }
  .product .sku { font-family: 'Courier New', monospace; font-size: 9.5px; color: #8595b3; letter-spacing: 1px; }
  .product .desc { font-size: 11px; color: #4a5878; line-height: 1.55; margin: 12px 0; }
  .product .ft-label { color: ${NAVY}; font-size: 12px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-top: 14px; }
  .product .ft-bar { width: 60px; height: 3px; background: ${NAVY}; margin-top: 4px; margin-bottom: 10px; }
  .product .specs { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10pt; }
  .product .specs td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
  .product .specs td.k { color: #475569; font-weight: 500; width: 40%; text-transform: none; }
  .product .specs td.v { color: #0f172a; font-weight: 600; }
  .product .page-logo { position: absolute; top: 10mm; right: 14mm; height: 50px; width: auto; z-index: 2; }
  .product .price { position: absolute; right: 18mm; bottom: 22mm; color: ${NAVY}; font-family: 'Courier New', monospace; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
  .product .pagefoot { position: absolute; bottom: 8mm; left: 18mm; right: 18mm; padding-top: 4px; border-top: 1px solid ${NAVY}; display: flex; justify-content: space-between; font-size: 9px; color: #8595b3; letter-spacing: 0.5px; }
  </style></head><body>

  <section class="page cover">
    ${logo ? `<div class="logo-panel"><img src="${logo}" alt="Petita"/></div>` : ''}
    <h1>Catálogo de Produtos</h1>
    ${opts.template_name ? `<div class="tpl">${esc(opts.template_name)}</div>` : ''}
    <div class="sub">${esc(company.name || 'Petita')}</div>
    <div class="date">${today}</div>
    <div class="footer">
      <div class="brand">PETITA · UM CARINHO A MAIS</div>
      ${address}
    </div>
  </section>

  ${pages}
  </body></html>`;
}
