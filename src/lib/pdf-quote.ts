import PDFDocument from 'pdfkit';
import { q } from './db';

export async function generateQuotePDF(quoteId: number): Promise<Buffer> {
  const { rows: qRows } = await q<any>(
    `SELECT q.*, c.name AS customer_name, c.doc AS customer_doc, c.email AS customer_email,
            c.phone AS customer_phone, c.address_city, c.address_state
       FROM petita.quotes q
       JOIN petita.customers c ON c.id = q.customer_id
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

  const fmt = (n: any) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fillColor('#1e4ba8').fontSize(20).text(company.name || 'Petita', { continued: false });
    doc.fontSize(9).fillColor('#5d6b8a').text(company.address || '');
    doc.text(`CNPJ: ${company.cnpj || '-'} | ${company.phone || ''}`);
    doc.moveDown();

    doc.fillColor('#192e63').fontSize(16).text(`Orçamento ${quote.number}`, { align: 'right' });
    doc.fontSize(10).fillColor('#5d6b8a').text(`Status: ${quote.status}`, { align: 'right' });
    if (quote.valid_until) doc.text(`Válido até: ${new Date(quote.valid_until).toLocaleDateString('pt-BR')}`, { align: 'right' });
    doc.moveDown();

    doc.fillColor('#192e63').fontSize(12).text('Cliente', { underline: true });
    doc.fontSize(10).text(quote.customer_name);
    if (quote.customer_doc) doc.text(`Doc: ${quote.customer_doc}`);
    if (quote.customer_email) doc.text(`Email: ${quote.customer_email}`);
    if (quote.customer_phone) doc.text(`Tel: ${quote.customer_phone}`);
    if (quote.address_city) doc.text(`${quote.address_city}/${quote.address_state || ''}`);
    doc.moveDown();

    doc.fillColor('#192e63').fontSize(12).text('Itens', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(9);
    items.forEach((it, i) => {
      doc.fillColor('#192e63').text(
        `${i + 1}. [${it.product_code}] ${it.product_name}`,
      );
      doc.fillColor('#5d6b8a').text(
        `   ${Number(it.qty)} x ${fmt(it.unit_price)} = ${fmt(it.line_total)}`,
      );
      doc.moveDown(0.2);
    });
    doc.moveDown();

    doc.fillColor('#192e63').fontSize(11);
    doc.text(`Subtotal: ${fmt(quote.subtotal)}`, { align: 'right' });
    doc.text(`Desconto: ${fmt(quote.discount_amount)}`, { align: 'right' });
    doc.text(`Impostos: ${fmt(quote.tax_amount)}`, { align: 'right' });
    doc.fontSize(14).fillColor('#1e4ba8').text(`Total: ${fmt(quote.total)}`, { align: 'right' });
    doc.moveDown();

    if (quote.payment_terms) {
      doc.fontSize(10).fillColor('#192e63').text(`Condições de pagamento: ${quote.payment_terms}`);
    }
    if (quote.delivery_terms) doc.text(`Entrega: ${quote.delivery_terms}`);
    if (quote.notes) { doc.moveDown(); doc.fillColor('#5d6b8a').text(quote.notes); }

    doc.end();
  });
}
