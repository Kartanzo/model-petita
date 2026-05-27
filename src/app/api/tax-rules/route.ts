import { NextRequest, NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireAuth, requireRoles, parseBody, ok, handleError } from '@/lib/api-helpers';
import { TaxRuleSchema } from '@/lib/validators';

export async function GET(req: NextRequest) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  try {
    const { rows } = await q(`SELECT tr.*, f.name AS family_name FROM petita.tax_rules tr LEFT JOIN petita.product_families f ON f.id=tr.family_id WHERE tr.active=TRUE ORDER BY tr.display_order, tr.name`);
    return ok(rows);
  } catch (e) { return handleError(e); }
}
export async function POST(req: NextRequest) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  const r = requireRoles(u, ['admin', 'superuser']); if (r) return r;
  const body = await parseBody(req, TaxRuleSchema); if (body instanceof NextResponse) return body;
  try {
    const { rows } = await q(`INSERT INTO petita.tax_rules (name,tax_type,rate,family_id,state,applies_to) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [body.name, body.tax_type, body.rate, body.family_id || null, body.state || null, body.applies_to || 'all']);
    return ok(rows[0], { status: 201 });
  } catch (e) { return handleError(e); }
}
