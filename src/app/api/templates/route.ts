import { NextRequest, NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireAuth, parseBody, ok, handleError } from '@/lib/api-helpers';
import { TemplateSchema } from '@/lib/validators';

export async function GET(req: NextRequest) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  try {
    const scope = req.nextUrl.searchParams.get('scope');
    const { rows } = scope
      ? await q(`SELECT * FROM petita.templates WHERE scope=$1 ORDER BY name`, [scope])
      : await q(`SELECT * FROM petita.templates ORDER BY scope, name`);
    return ok(rows);
  } catch (e) { return handleError(e); }
}
export async function POST(req: NextRequest) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  const body = await parseBody(req, TemplateSchema); if (body instanceof NextResponse) return body;
  try {
    const { rows } = await q(`INSERT INTO petita.templates (scope,name,body,is_default,created_by) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [body.scope, body.name, body.body, body.is_default || false, u.id]);
    return ok(rows[0], { status: 201 });
  } catch (e) { return handleError(e); }
}
