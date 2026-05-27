import Link from 'next/link';
import { FileText } from 'lucide-react';
import { q } from '@/lib/db';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Pill } from '@/components/Pill';
import { PageHeader } from '@/components/PageHeader';
import { fmtBRL } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function CatalogoPage({ searchParams }: { searchParams: { q?: string; family_id?: string } }) {
  const params: any[] = []; const where: string[] = ['p.active=TRUE'];
  if (searchParams.q) { params.push(`%${searchParams.q}%`); where.push(`(p.name ILIKE $${params.length} OR p.code ILIKE $${params.length})`); }
  if (searchParams.family_id) { params.push(parseInt(searchParams.family_id, 10)); where.push(`p.family_id=$${params.length}`); }
  const [prods, fams] = await Promise.all([
    q(`SELECT p.*, f.name AS family_name, f.slug AS family_slug FROM petita.products p LEFT JOIN petita.product_families f ON f.id=p.family_id WHERE ${where.join(' AND ')} ORDER BY f.display_order, p.name LIMIT 300`, params),
    q(`SELECT id,name,slug FROM petita.product_families WHERE active=TRUE ORDER BY display_order`),
  ]);
  return (
    <div>
      <PageHeader
        title="Catálogo"
        subtitle={`${prods.rows.length} produtos · vitrine`}
        action={<Link href="/catalogo/gerar"><Button><FileText className="h-4 w-4" /> Gerar PDF</Button></Link>}
      />
      <form className="mb-4">
        <input name="q" defaultValue={searchParams.q || ''} placeholder="Buscar produto" className="w-full h-12 rounded-xl border border-border bg-panel px-3 text-[15px]" />
      </form>
      <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
        <Link
          href="/catalogo"
          className={`px-4 h-9 rounded-full border flex items-center text-sm font-semibold whitespace-nowrap transition-colors ${
            !searchParams.family_id ? 'bg-brand-700 text-white border-brand-700' : 'bg-panel border-border hover:bg-brand-50'
          }`}
        >
          Todas
        </Link>
        {fams.rows.map((f: any) => (
          <Link
            key={f.id}
            href={`/catalogo?family_id=${f.id}`}
            className={`px-4 h-9 rounded-full border flex items-center text-sm font-semibold whitespace-nowrap transition-colors ${
              searchParams.family_id == String(f.id) ? 'bg-brand-700 text-white border-brand-700' : 'bg-panel border-border hover:bg-brand-50'
            }`}
          >
            {f.name}
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {prods.rows.map((p: any) => (
          <Card key={p.id} className="p-0 overflow-hidden flex flex-col">
            <div className="aspect-[4/3] bg-gradient-to-br from-brand-50 to-cream flex items-center justify-center overflow-hidden">
              {p.photo_url ? (
                <img src={p.photo_url} alt={p.name} className="w-full h-full object-contain p-3" />
              ) : (
                <span className="text-muted text-sm">sem foto</span>
              )}
            </div>
            <div className="p-4 flex-1 flex flex-col gap-2">
              <Pill tone="brand" className="text-[10px] self-start">{p.family_name}</Pill>
              <div className="font-bold text-base leading-tight text-text">{p.name}</div>
              <div className="font-mono text-[10px] text-muted">{p.code}</div>
              <div className="mt-auto pt-2 text-success font-extrabold text-lg">{fmtBRL(p.price)}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
