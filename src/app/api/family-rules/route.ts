import { NextRequest, NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireAuth, requireRoles, parseBody, ok, handleError } from '@/lib/api-helpers';
import { FamilyRuleSchema } from '@/lib/validators';

export async function GET(req: NextRequest) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  try {
    const { rows } = await q(`SELECT fr.*, f.name AS family_name FROM petita.family_rules fr LEFT JOIN petita.product_families f ON f.id=fr.family_id WHERE fr.active=TRUE ORDER BY f.name`);
    return ok(rows);
  } catch (e) { return handleError(e); }
}
export async function POST(req: NextRequest) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  const r = requireRoles(u, ['admin', 'superuser']); if (r) return r;
  const body = await parseBody(req, FamilyRuleSchema); if (body instanceof NextResponse) return body;
  try {
    const { rows } = await q(`INSERT INTO petita.family_rules (family_id,max_discount_pct,min_margin_pct,default_markup_pct,override_role) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [body.family_id, body.max_discount_pct, body.min_margin_pct, body.default_markup_pct, body.override_role || 'admin']);
    return ok(rows[0], { status: 201 });
  } catch (e) { return handleError(e); }
}
