import { NextRequest, NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireAuth, parseBody, ok, handleError } from '@/lib/api-helpers';
import { QuoteSchema } from '@/lib/validators';
import { createQuote } from '@/lib/quote-service';

export async function GET(req: NextRequest) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  try {
    const sp = req.nextUrl.searchParams;
    const where: string[] = []; const params: any[] = [];
    const status = sp.get('status');
    if (status) { params.push(status); where.push(`q.status=$${params.length}`); }
    const cid = sp.get('customer_id');
    if (cid) { params.push(parseInt(cid, 10)); where.push(`q.customer_id=$${params.length}`); }
    const sql = `SELECT q.*, c.name AS customer_name FROM petita.quotes q
                 JOIN petita.customers c ON c.id=q.customer_id
                 ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                 ORDER BY q.created_at DESC LIMIT 200`;
    const { rows } = await q(sql, params);
    return ok(rows);
  } catch (e) { return handleError(e); }
}

export async function POST(req: NextRequest) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  const body = await parseBody(req, QuoteSchema); if (body instanceof NextResponse) return body;
  try {
    const quote = await createQuote(body as any, u.id);
    return ok(quote, { status: 201 });
  } catch (e) { return handleError(e); }
}
