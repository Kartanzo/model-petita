import { NextRequest, NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireAuth, ok, handleError } from '@/lib/api-helpers';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  try {
    // TODO: integrar e-mail/WhatsApp real — mock no MVP
    const { rows } = await q(`UPDATE petita.quotes SET status='enviado', sent_at=now() WHERE id=$1 RETURNING *`, [params.id]);
    return ok(rows[0]);
  } catch (e) { return handleError(e); }
}
