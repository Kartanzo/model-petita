import type { PoolClient } from 'pg';
import { withTx } from './db';
import { compute, type PricingItem } from './pricing';
import { nextNumber } from './numbering';

export interface QuoteInput {
  customer_id: number;
  template_id?: number | null;
  status?: string;
  payment_terms?: string | null;
  delivery_terms?: string | null;
  valid_until?: string | null;
  notes?: string | null;
  items: Array<{ product_id: number; qty: number; list_price: number; unit_price: number; discount_pct?: number }>;
}

async function loadProductsWithFamily(client: PoolClient, productIds: number[]) {
  if (!productIds.length) return new Map<number, any>();
  const { rows } = await client.query(
    `SELECT id, family_id, cost::float8 AS cost FROM petita.products WHERE id = ANY($1::int[])`,
    [productIds],
  );
  return new Map(rows.map((r: any) => [r.id, r]));
}

export async function createQuote(input: QuoteInput, userId: number, state?: string | null) {
  return withTx(async (client) => {
    const productIds = input.items.map((i) => i.product_id);
    const prodMap = await loadProductsWithFamily(client, productIds);
    const pricingItems: PricingItem[] = input.items.map((it) => {
      const p = prodMap.get(it.product_id);
      return { ...it, unit_cost: p?.cost ?? 0, family_id: p?.family_id ?? null };
    });
    const r = await compute(pricingItems, 'quote', state);
    const number = await nextNumber('quote', client);
    const { rows: qr } = await client.query(
      `INSERT INTO petita.quotes (number,customer_id,user_id,template_id,status,subtotal,discount_amount,tax_amount,total,cost_total,profit_amount,profit_pct,profitability,payment_terms,delivery_terms,valid_until,notes)
       VALUES ($1,$2,$3,$4,COALESCE($5,'rascunho'),$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [number, input.customer_id, userId, input.template_id || null, input.status, r.subtotal, r.discount_amount, r.tax_amount, r.total, r.cost_total, r.profit_amount, r.profit_pct, r.profitability, input.payment_terms || null, input.delivery_terms || null, input.valid_until || null, input.notes || null],
    );
    const quote = qr[0];
    let pos = 0;
    for (const li of r.items) {
      pos++;
      await client.query(
        `INSERT INTO petita.quote_items (quote_id,product_id,qty,list_price,unit_price,discount_pct,unit_cost,tax_amount,line_total,line_profit,position)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [quote.id, li.product_id, li.qty, li.list_price, li.unit_price, li.discount_pct, li.unit_cost, li.tax_amount, li.line_total, li.line_profit, pos],
      );
    }
    return quote;
  });
}

export async function updateQuote(id: number, input: QuoteInput, state?: string | null) {
  return withTx(async (client) => {
    const productIds = input.items.map((i) => i.product_id);
    const prodMap = await loadProductsWithFamily(client, productIds);
    const pricingItems: PricingItem[] = input.items.map((it) => {
      const p = prodMap.get(it.product_id);
      return { ...it, unit_cost: p?.cost ?? 0, family_id: p?.family_id ?? null };
    });
    const r = await compute(pricingItems, 'quote', state);
    const { rows: qr } = await client.query(
      `UPDATE petita.quotes SET customer_id=$1, template_id=$2, status=COALESCE($3,status), subtotal=$4, discount_amount=$5, tax_amount=$6, total=$7, cost_total=$8, profit_amount=$9, profit_pct=$10, profitability=$11, payment_terms=$12, delivery_terms=$13, valid_until=$14, notes=$15 WHERE id=$16 RETURNING *`,
      [input.customer_id, input.template_id || null, input.status, r.subtotal, r.discount_amount, r.tax_amount, r.total, r.cost_total, r.profit_amount, r.profit_pct, r.profitability, input.payment_terms || null, input.delivery_terms || null, input.valid_until || null, input.notes || null, id],
    );
    await client.query(`DELETE FROM petita.quote_items WHERE quote_id=$1`, [id]);
    let pos = 0;
    for (const li of r.items) {
      pos++;
      await client.query(
        `INSERT INTO petita.quote_items (quote_id,product_id,qty,list_price,unit_price,discount_pct,unit_cost,tax_amount,line_total,line_profit,position)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [id, li.product_id, li.qty, li.list_price, li.unit_price, li.discount_pct, li.unit_cost, li.tax_amount, li.line_total, li.line_profit, pos],
      );
    }
    return qr[0];
  });
}

export async function convertQuoteToOrder(quoteId: number, userId: number) {
  return withTx(async (client) => {
    const { rows: qr } = await client.query(`SELECT * FROM petita.quotes WHERE id=$1`, [quoteId]);
    const q = qr[0];
    if (!q) throw new Error('quote_not_found');
    const number = await nextNumber('order', client);
    const { rows: or } = await client.query(
      `INSERT INTO petita.orders (number,customer_id,user_id,quote_id,template_id,status,subtotal,discount_amount,tax_amount,total,payment_terms,notes)
       VALUES ($1,$2,$3,$4,$5,'aberto',$6,$7,$8,$9,$10,$11) RETURNING *`,
      [number, q.customer_id, userId, quoteId, q.template_id, q.subtotal, q.discount_amount, q.tax_amount, q.total, q.payment_terms, q.notes],
    );
    const order = or[0];
    const { rows: items } = await client.query(`SELECT * FROM petita.quote_items WHERE quote_id=$1 ORDER BY position`, [quoteId]);
    for (const it of items) {
      await client.query(
        `INSERT INTO petita.order_items (order_id,product_id,qty,list_price,unit_price,discount_pct,unit_cost,tax_amount,line_total,line_profit,position)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [order.id, it.product_id, it.qty, it.list_price, it.unit_price, it.discount_pct, it.unit_cost, it.tax_amount, it.line_total, it.line_profit, it.position],
      );
    }
    await client.query(`UPDATE petita.quotes SET status='convertido' WHERE id=$1`, [quoteId]);
    return order;
  });
}
