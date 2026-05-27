import { q } from './db';

export interface PricingItem {
  product_id: number;
  qty: number;
  list_price: number;
  unit_price: number;
  unit_cost: number;
  family_id?: number | null;
}

export interface PricingLineResult extends PricingItem {
  discount_pct: number;
  tax_amount: number;
  line_total: number;
  line_profit: number;
}

export interface PricingResult {
  items: PricingLineResult[];
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  cost_total: number;
  profit_amount: number;
  profit_pct: number;
  profitability: 'rentavel' | 'atencao' | 'nao_rentavel' | 'desconhecido';
}

export interface TaxRule {
  id: number;
  rate: number;
  family_id: number | null;
  state: string | null;
  applies_to: 'all' | 'quote' | 'order';
}

export async function loadTaxRules(scope: 'quote' | 'order', state?: string | null): Promise<TaxRule[]> {
  const { rows } = await q<TaxRule>(
    `SELECT id, rate::float8 AS rate, family_id, state, applies_to
       FROM petita.tax_rules
      WHERE active = TRUE
        AND (applies_to = 'all' OR applies_to = $1)
        AND (state IS NULL OR state = $2)`,
    [scope, state || null],
  );
  return rows;
}

export async function loadMinMargin(familyIds: number[]): Promise<number> {
  if (familyIds.length === 0) return 0;
  const { rows } = await q<{ floor: number }>(
    `SELECT COALESCE(MIN(min_margin_pct), 0)::float8 AS floor
       FROM petita.family_rules
      WHERE active = TRUE AND family_id = ANY($1::int[])`,
    [familyIds],
  );
  return rows[0]?.floor ?? 0;
}

export function computeLines(items: PricingItem[], taxRules: TaxRule[]): PricingLineResult[] {
  return items.map((i) => {
    const line_subtotal = i.qty * i.unit_price;
    const line_cost = i.qty * i.unit_cost;
    const applicable = taxRules.filter((r) => r.family_id == null || r.family_id === i.family_id);
    const totalRate = applicable.reduce((a, r) => a + Number(r.rate), 0);
    const line_tax = round2(line_subtotal * totalRate);
    const line_total = round2(line_subtotal + line_tax);
    const line_profit = round2(line_total - line_cost - line_tax);
    const discount_pct = i.list_price > 0 ? round2(((i.list_price - i.unit_price) / i.list_price) * 100) : 0;
    return { ...i, discount_pct, tax_amount: line_tax, line_total, line_profit };
  });
}

export async function compute(items: PricingItem[], scope: 'quote' | 'order', state?: string | null): Promise<PricingResult> {
  const taxes = await loadTaxRules(scope, state);
  const lines = computeLines(items, taxes);
  const subtotal = round2(lines.reduce((a, l) => a + l.qty * l.unit_price, 0));
  const discount_amount = round2(lines.reduce((a, l) => a + l.qty * (l.list_price - l.unit_price), 0));
  const tax_amount = round2(lines.reduce((a, l) => a + l.tax_amount, 0));
  const total = round2(lines.reduce((a, l) => a + l.line_total, 0));
  const cost_total = round2(lines.reduce((a, l) => a + l.qty * l.unit_cost, 0));
  const profit_amount = round2(total - cost_total - tax_amount);
  const profit_pct = total > 0 ? round2((profit_amount / total) * 100) : 0;
  const familyIds = [...new Set(lines.map((l) => l.family_id).filter((x): x is number => x != null))];
  const floor = await loadMinMargin(familyIds);
  let profitability: PricingResult['profitability'] = 'desconhecido';
  if (familyIds.length > 0) {
    if (profit_pct >= floor) profitability = 'rentavel';
    else if (profit_pct >= floor - 5) profitability = 'atencao';
    else profitability = 'nao_rentavel';
  }
  return { items: lines, subtotal, discount_amount, tax_amount, total, cost_total, profit_amount, profit_pct, profitability };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
