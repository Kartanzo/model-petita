import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { q } from '@/lib/db';
import { requireAuth, parseBody, ok, handleError } from '@/lib/api-helpers';

export const runtime = 'nodejs';

const CreateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().optional().nullable(),
  product_ids: z.array(z.number().int().positive()).default([]),
  options: z.record(z.any()).default({}),
});

export async function GET(req: NextRequest) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  try {
    const { rows } = await q(`SELECT id,name,description,product_ids,options,created_by,created_at,updated_at
                              FROM petita.catalog_templates ORDER BY updated_at DESC`);
    return ok(rows);
  } catch (e) { return handleError(e); }
}

export async function POST(req: NextRequest) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  const body = await parseBody(req, CreateSchema); if (body instanceof NextResponse) return body;
  try {
    const { rows } = await q(
      `INSERT INTO petita.catalog_templates (name,description,product_ids,options,created_by)
       VALUES ($1,$2,$3::int[],$4::jsonb,$5) RETURNING *`,
      [body.name, body.description ?? null, body.product_ids, JSON.stringify(body.options), u.id],
    );
    return ok(rows[0], { status: 201 });
  } catch (e) { return handleError(e); }
}
