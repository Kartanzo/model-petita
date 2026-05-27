import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { q } from '@/lib/db';
import { requireAuth, requireRoles, ok, fail, handleError } from '@/lib/api-helpers';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const u = requireAuth(req); if (u instanceof NextResponse) return u;
  const r = requireRoles(u, ['admin', 'superuser']); if (r) return r;
  try {
    const form = await req.formData();
    const f = form.get('photo') as File | null;
    if (!f) return fail('photo_required', 400);
    const buf = Buffer.from(await f.arrayBuffer());
    const optimized = await sharp(buf).resize(800, 800, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    const dir = process.env.UPLOAD_DIR || './uploads';
    await mkdir(dir, { recursive: true });
    const filename = `product-${params.id}-${Date.now()}.webp`;
    const fp = path.join(dir, filename);
    await writeFile(fp, optimized);
    const url = `/uploads/${filename}`;
    await q(`UPDATE petita.products SET photo_url=$1 WHERE id=$2`, [url, params.id]);
    return ok({ url });
  } catch (e) { return handleError(e); }
}
