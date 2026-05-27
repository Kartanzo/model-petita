import puppeteer from 'puppeteer';
import { q } from './db';

interface CatalogOpts {
  family_ids?: number[];
  product_ids?: number[];
  include_description?: boolean;
  order?: 'family' | 'name' | 'price';
}

export async function generateCatalogPDF(opts: CatalogOpts = {}): Promise<Buffer> {
  const where: string[] = ['p.active = TRUE'];
  const params: any[] = [];
  if (opts.family_ids?.length) { params.push(opts.family_ids); where.push(`p.family_id = ANY($${params.length}::int[])`); }
  if (opts.product_ids?.length) { params.push(opts.product_ids); where.push(`p.id = ANY($${params.length}::int[])`); }
  const orderBy = opts.order === 'name' ? 'p.name' : opts.order === 'price' ? 'p.price' : 'f.display_order, p.name';
  const { rows } = await q<any>(
    `SELECT p.id, p.code, p.name, p.description, p.price::float8, p.photo_url, f.name AS family_name, f.id AS family_id
       FROM petita.products p
       JOIN petita.product_families f ON f.id = p.family_id
      WHERE ${where.join(' AND ')}
      ORDER BY ${orderBy}`,
    params,
  );

  const { rows: cfg } = await q<any>(`SELECT value FROM petita.config WHERE key='company'`);
  const company = cfg[0]?.value ?? { name: 'Petita' };
  const groups: Record<string, any[]> = {};
  rows.forEach((p) => { (groups[p.family_name] ||= []).push(p); });

  const html = renderHTML(company, groups, opts);
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
      margin: { top: '18mm', bottom: '18mm', left: '18mm', right: '18mm' },
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:9px;color:#5d6b8a;width:100%;padding:0 18mm;">Catálogo Petita</div>`,
      footerTemplate: `<div style="font-size:9px;color:#5d6b8a;width:100%;padding:0 18mm;text-align:center;">Página <span class="pageNumber"></span> / <span class="totalPages"></span></div>`,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

function renderHTML(company: any, groups: Record<string, any[]>, opts: CatalogOpts): string {
  const today = new Date().toLocaleDateString('pt-BR');
  const fmt = (n: number) => Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const famSections = Object.entries(groups).map(([fam, products]) => `
    <section class="family">
      <h2>${esc(fam)}</h2>
      <div class="grid">
        ${products.map((p) => `
          <article class="product">
            <div class="img"><img src="${esc(p.photo_url || '')}" alt=""/></div>
            <div class="info">
              <div class="code">${esc(p.code)}</div>
              <div class="name">${esc(p.name)}</div>
              ${opts.include_description !== false && p.description ? `<div class="desc">${esc(p.description)}</div>` : ''}
              <div class="price">${fmt(p.price)}</div>
            </div>
          </article>
        `).join('')}
      </div>
    </section>
  `).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: A4; margin: 18mm; }
    body { font-family: 'Nunito', -apple-system, sans-serif; color: #192e63; margin: 0; padding: 0; font-size: 12px; }
    .cover { text-align: center; padding: 60px 20px; background: linear-gradient(135deg,#eef4ff,#fff8ec); border-radius: 16px; margin-bottom: 24px; page-break-after: always; }
    .cover h1 { font-size: 36px; color: #1e4ba8; margin: 16px 0; }
    .cover p { color: #5d6b8a; }
    .toc { page-break-after: always; }
    .toc h2 { color: #1e4ba8; border-bottom: 2px solid #dbe6ff; padding-bottom: 8px; }
    .toc ul { list-style: none; padding: 0; }
    .toc li { padding: 8px 0; border-bottom: 1px dashed #e5ebf5; }
    .family { page-break-before: always; }
    .family h2 { color: #1e4ba8; padding: 8px 12px; background: #eef4ff; border-radius: 8px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .product { border: 1px solid #e5ebf5; border-radius: 12px; padding: 12px; page-break-inside: avoid; break-inside: avoid; }
    .product .img { height: 140px; display: flex; align-items: center; justify-content: center; background: #f6f9ff; border-radius: 8px; overflow: hidden; margin-bottom: 8px; }
    .product .img img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .product .code { font-family: monospace; font-size: 10px; color: #5d6b8a; }
    .product .name { font-weight: 700; font-size: 14px; margin: 4px 0; }
    .product .desc { font-size: 11px; color: #5d6b8a; margin-bottom: 6px; }
    .product .price { font-weight: 700; color: #16a07c; font-size: 16px; }
  </style></head><body>
    <div class="cover">
      <h1>${esc(company.name || 'Petita')}</h1>
      <p>Catálogo de Produtos</p>
      <p>${today}</p>
    </div>
    <div class="toc">
      <h2>Famílias</h2>
      <ul>${Object.keys(groups).map((f) => `<li>${esc(f)} <small>(${groups[f].length} produtos)</small></li>`).join('')}</ul>
    </div>
    ${famSections}
  </body></html>`;
}

function esc(s: any): string {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}
