import { NextRequest, NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireAuth, parseBody, ok, handleError } from '@/lib/api-helpers';
import { CustomerSchema } from '@/lib/validators';

export async function GET(req: NextRequest) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  try {
    const sp = req.nextUrl.searchParams;
    const where: string[] = []; const params: any[] = [];
    if (sp.get('active') !== 'all') where.push('active=TRUE');
    const s = sp.get('q');
    if (s) { params.push(`%${s}%`); where.push(`(name ILIKE $${params.length} OR doc ILIKE $${params.length} OR email ILIKE $${params.length})`); }
    const seg = sp.get('segment');
    if (seg) { params.push(seg); where.push(`segment=$${params.length}`); }
    const sql = `SELECT * FROM petita.customers ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY name LIMIT 500`;
    const { rows } = await q(sql, params);
    return ok(rows);
  } catch (e) { return handleError(e); }
}

export async function POST(req: NextRequest) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  const body = await parseBody(req, CustomerSchema); if (body instanceof NextResponse) return body;
  try {
    const cols = ['type','name','trade_name','doc','email','phone','whatsapp','address_street','address_number','address_complement','address_district','address_city','address_state','address_zip','segment','credit_limit','notes'];
    const values = cols.map((c) => (body as any)[c] ?? null);
    values.push(u.id);
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(',');
    const { rows } = await q(
      `INSERT INTO petita.customers (${cols.join(',')},created_by) VALUES (${placeholders},$${cols.length + 1}) RETURNING *`,
      values,
    );
    return ok(rows[0], { status: 201 });
  } catch (e) { return handleError(e); }
}
