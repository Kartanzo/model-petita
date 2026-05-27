import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, ok, handleError } from '@/lib/api-helpers';
import { convertQuoteToOrder } from '@/lib/quote-service';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  try {
    const order = await convertQuoteToOrder(parseInt(params.id, 10), u.id);
    return ok(order, { status: 201 });
  } catch (e) { return handleError(e); }
}
