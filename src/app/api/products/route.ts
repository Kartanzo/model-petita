import { NextRequest, NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireAuth, requireRoles, parseBody, ok, handleError } from '@/lib/api-helpers';
import { ProductSchema } from '@/lib/validators';

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const where: string[] = []; const params: any[] = [];
    if (sp.get('active') !== 'all') where.push('p.active=TRUE');
    const family = sp.get('family_id');
    if (family) { params.push(parseInt(family, 10)); where.push(`p.family_id=$${params.length}`); }
    const q1 = sp.get('q');
    if (q1) { params.push(`%${q1}%`); where.push(`(p.name ILIKE $${params.length} OR p.code ILIKE $${params.length})`); }
    const sql = `SELECT DISTINCT ON (p.code) p.*, f.name AS family_name FROM petita.products p
                 LEFT JOIN petita.product_families f ON f.id=p.family_id
                 ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                 ORDER BY p.code, p.family_id, p.name LIMIT 500`;
    const { rows } = await q(sql, params);
    return ok(rows);
  } catch (e) { return handleError(e); }
}

export async function POST(req: NextRequest) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  const r = requireRoles(u, ['admin', 'superuser']); if (r) return r;
  const body = await parseBody(req, ProductSchema); if (body instanceof NextResponse) return body;
  try {
    const { rows } = await q(
      `INSERT INTO petita.products (code,name,family_id,description,technical_specs,cost,price,unit,photo_url,active,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,COALESCE($10,TRUE),$11) RETURNING *`,
      [body.code, body.name, body.family_id, body.description || null, body.technical_specs || {}, body.cost, body.price, body.unit || 'UN', body.photo_url || null, body.active, u.id],
    );
    return ok(rows[0], { status: 201 });
  } catch (e) { return handleError(e); }
}
