import puppeteer from 'puppeteer';
import { q } from './db';

const NAVY = '#1e4ba8';
const CREAM = '#fdfaf3';

function esc(s: any): string {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

export async function generateQuotePDF(quoteId: number): Promise<Buffer> {
  const { rows: qRows } = await q<any>(
    `SELECT q.*, c.name AS customer_name, c.trade_name AS customer_trade, c.doc AS customer_doc,
            c.email AS customer_email, c.phone AS customer_phone,
            c.address_street, c.address_number, c.address_complement,
            c.address_district, c.address_city, c.address_state, c.address_zip,
            u.name AS seller_name, u.email AS seller_email
       FROM petita.quotes q
       JOIN petita.customers c ON c.id = q.customer_id
       LEFT JOIN petita.users u ON u.id = q.user_id
      WHERE q.id = $1`,
    [quoteId],
  );
  const quote = qRows[0];
  if (!quote) throw new Error('quote_not_found');

  const { rows: items } = await q<any>(
    `SELECT qi.*, p.name AS product_name, p.code AS product_code
       FROM petita.quote_items qi
       JOIN petita.products p ON p.id = qi.product_id
      WHERE qi.quote_id = $1 ORDER BY qi.position`,
    [quoteId],
  );

  const { rows: cfg } = await q<any>(`SELECT value FROM petita.config WHERE key='company'`);
  const company = cfg[0]?.value ?? {};

  const html = renderHTML(company, quote, items);
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
      preferCSSPageSize: true,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

function fmt(n: any): string { return Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function fmtDate(d: any): string {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('pt-BR'); } catch { return '—'; }
}

function renderHTML(company: any, quote: any, items: any[]): string {
  const today = new Date().toLocaleDateString('pt-BR');
  const addr = [
    [quote.address_street, quote.address_number].filter(Boolean).join(', '),
    quote.address_complement,
    quote.address_district,
    [quote.address_city, quote.address_state].filter(Boolean).join('/'),
    quote.address_zip,
  ].filter(Boolean).map(esc).join(' · ');

  const itemRows = items.map((it, i) => `
    <tr class="${i % 2 ? 'zebra' : ''}">
      <td class="mono">${esc(it.product_code)}</td>
      <td>${esc(it.product_name)}</td>
      <td class="num">${Number(it.qty).toLocaleString('pt-BR')}</td>
      <td class="num">${fmt(it.unit_price)}</td>
      <td class="num">${fmt(it.line_total)}</td>
    </tr>`).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #192e63; font-size: 11px; -webkit-print-color-adjust: exact; }
  .page { width: 210mm; min-height: 297mm; position: relative; padding: 18mm 15mm 22mm 15mm; background: #fff; }
  .topbar { position: absolute; top: 0; left: 0; right: 0; height: 8mm; background: ${NAVY}; }
  .footbar { position: absolute; bottom: 0; left: 0; right: 0; height: 6mm; background: ${NAVY}; color: #fff; font-size: 9px; display: flex; align-items: center; justify-content: space-between; padding: 0 15mm; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-top: 4mm; }
  .head .co .name { font-size: 16px; font-weight: 800; color: ${NAVY}; }
  .head .co .meta { color: #5d6b8a; font-size: 10px; margin-top: 3px; line-height: 1.45; }
  .head .doc { text-align: right; }
  .head .doc .lbl { font-size: 9px; color: #5d6b8a; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
  .head .doc .num { font-size: 22px; font-weight: 800; color: ${NAVY}; }
  .head .doc .status { display: inline-block; background: #eef4ff; color: ${NAVY}; padding: 2px 10px; border-radius: 999px; font-size: 9px; font-weight: 700; text-transform: uppercase; margin-top: 4px; }
  .blocks { display: grid; grid-template-columns: 1.4fr 1fr; gap: 12px; margin-top: 14px; }
  .block { border: 1px solid #e5ebf5; border-radius: 8px; padding: 10px 12px; }
  .block h3 { margin: 0 0 6px 0; font-size: 10px; color: #5d6b8a; letter-spacing: 1px; text-transform: uppercase; font-weight: 700; }
  .block .row { font-size: 10.5px; margin-top: 2px; line-height: 1.5; }
  .block .row b { color: ${NAVY}; }
  table.items { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 10.5px; page-break-inside: avoid; }
  table.items thead th { background: ${NAVY}; color: #fff; text-align: left; padding: 8px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }
  table.items tbody td { padding: 7px 10px; border-bottom: 1px solid #eef2f9; }
  table.items tbody tr.zebra td { background: ${CREAM}; }
  table.items .num { text-align: right; font-family: 'Courier New', monospace; }
  table.items .mono { font-family: 'Courier New', monospace; font-size: 10px; color: #5d6b8a; }
  .totals { margin-top: 14px; margin-left: auto; width: 65mm; font-size: 11px; }
  .totals .row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #e5ebf5; }
  .totals .row.total { border-bottom: none; border-top: 2px solid ${NAVY}; font-size: 16px; font-weight: 800; color: ${NAVY}; margin-top: 4px; padding-top: 8px; }
  .totals .row .v { font-family: 'Courier New', monospace; }
  .terms { margin-top: 16px; border: 1px solid #e5ebf5; border-left: 4px solid ${NAVY}; padding: 10px 14px; border-radius: 6px; font-size: 10.5px; }
  .terms h3 { margin: 0 0 6px 0; font-size: 10px; color: ${NAVY}; letter-spacing: 1px; text-transform: uppercase; font-weight: 700; }
  </style></head><body>
  <div class="page">
    <div class="topbar"></div>

    <div class="head">
      <div class="co">
        <div class="name">${esc(company.name || 'Petita')}</div>
        <div class="meta">
          ${company.cnpj ? `CNPJ: ${esc(company.cnpj)}<br/>` : ''}
          ${company.address ? `${esc(company.address)}<br/>` : ''}
          ${[company.phone, company.email].filter(Boolean).map(esc).join(' · ')}
        </div>
      </div>
      <div class="doc">
        <div class="lbl">Orçamento</div>
        <div class="num">${esc(quote.number)}</div>
        <div class="status">${esc(quote.status)}</div>
      </div>
    </div>

    <div class="blocks">
      <div class="block">
        <h3>Cliente</h3>
        <div class="row"><b>${esc(quote.customer_name)}</b>${quote.customer_trade ? ` — ${esc(quote.customer_trade)}` : ''}</div>
        ${quote.customer_doc ? `<div class="row">Doc: ${esc(quote.customer_doc)}</div>` : ''}
        ${addr ? `<div class="row">${addr}</div>` : ''}
        ${quote.customer_email ? `<div class="row">${esc(quote.customer_email)}</div>` : ''}
        ${quote.customer_phone ? `<div class="row">${esc(quote.customer_phone)}</div>` : ''}
      </div>
      <div class="block">
        <h3>Dados</h3>
        <div class="row"><b>Emissão:</b> ${today}</div>
        ${quote.valid_until ? `<div class="row"><b>Validade:</b> ${fmtDate(quote.valid_until)}</div>` : ''}
        ${quote.seller_name ? `<div class="row"><b>Vendedor:</b> ${esc(quote.seller_name)}</div>` : ''}
      </div>
    </div>

    <table class="items">
      <thead><tr><th style="width:14%">Cód</th><th>Descrição</th><th class="num" style="width:10%">Qtd</th><th class="num" style="width:16%">Vl Unit</th><th class="num" style="width:18%">Total</th></tr></thead>
      <tbody>${itemRows || '<tr><td colspan="5" style="text-align:center;padding:18px;color:#5d6b8a">Sem itens</td></tr>'}</tbody>
    </table>

    <div class="totals">
      <div class="row"><span>Subtotal</span><span class="v">${fmt(quote.subtotal)}</span></div>
      <div class="row"><span>Desconto</span><span class="v">- ${fmt(quote.discount_amount)}</span></div>
      <div class="row"><span>Impostos</span><span class="v">${fmt(quote.tax_amount)}</span></div>
      <div class="row total"><span>Total</span><span class="v">${fmt(quote.total)}</span></div>
    </div>

    <div class="terms">
      <h3>Condições</h3>
      ${quote.payment_terms ? `<div><b>Pagamento:</b> ${esc(quote.payment_terms)}</div>` : ''}
      ${quote.delivery_terms ? `<div><b>Entrega:</b> ${esc(quote.delivery_terms)}</div>` : ''}
      ${quote.notes ? `<div style="margin-top:6px;color:#5d6b8a">${esc(quote.notes)}</div>` : ''}
    </div>

    <div class="footbar"><span>Petita · um carinho a mais</span><span>${esc(quote.number)}</span></div>
  </div>
  </body></html>`;
}
