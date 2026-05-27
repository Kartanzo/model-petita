import { NextRequest, NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireAuth, requireRoles, parseBody, ok, handleError } from '@/lib/api-helpers';
import { FamilySchema } from '@/lib/validators';

export async function GET(_req: NextRequest) {
  try {
    const { rows } = await q(`SELECT * FROM petita.product_families WHERE active=TRUE ORDER BY display_order, name`);
    return ok(rows);
  } catch (e) { return handleError(e); }
}

export async function POST(req: NextRequest) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  const r = requireRoles(u, ['admin', 'superuser']); if (r) return r;
  const body = await parseBody(req, FamilySchema); if (body instanceof NextResponse) return body;
  try {
    const { rows } = await q(
      `INSERT INTO petita.product_families (slug,name,description,display_order) VALUES ($1,$2,$3,$4) RETURNING *`,
      [body.slug, body.name, body.description || null, body.display_order ?? 0],
    );
    return ok(rows[0], { status: 201 });
  } catch (e) { return handleError(e); }
}
