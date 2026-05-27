import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleError } from '@/lib/api-helpers';
import { generateQuotePDF } from '@/lib/pdf-quote';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  try {
    const pdf = await generateQuotePDF(parseInt(params.id, 10));
    return new NextResponse(new Uint8Array(pdf), {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="orcamento-${params.id}.pdf"` },
    });
  } catch (e) { return handleError(e); }
}
