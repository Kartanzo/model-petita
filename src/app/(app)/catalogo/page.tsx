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
      <PageHeader title="Catálogo" subtitle={`${prods.rows.length} produtos`} action={<Link href="/catalogo/gerar"><Button><FileText className="h-4 w-4" /> Gerar PDF</Button></Link>} />
      <form className="mb-4"><input name="q" defaultValue={searchParams.q || ''} placeholder="Buscar produto" className="w-full h-12 rounded-xl border border-border bg-panel px-3 text-[15px]" /></form>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <Link href="/catalogo" className={`px-3 h-9 rounded-full border border-border flex items-center text-sm font-semibold whitespace-nowrap ${!searchParams.family_id ? 'bg-brand-700 text-white' : 'bg-panel'}`}>Todas</Link>
        {fams.rows.map((f: any) => <Link key={f.id} href={`/catalogo?family_id=${f.id}`} className={`px-3 h-9 rounded-full border border-border flex items-center text-sm font-semibold whitespace-nowrap ${searchParams.family_id == String(f.id) ? 'bg-brand-700 text-white' : 'bg-panel'}`}>{f.name}</Link>)}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {prods.rows.map((p: any) => (
          <Card key={p.id} className="p-3">
            <div className="aspect-square bg-bg rounded-xl mb-2 overflow-hidden flex items-center justify-center">
              {p.photo_url ? <img src={p.photo_url} alt={p.name} className="w-full h-full object-contain" /> : <span className="text-muted text-xs">sem foto</span>}
            </div>
            <div className="font-mono text-[10px] text-muted">{p.code}</div>
            <div className="font-bold text-sm truncate">{p.name}</div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-success font-bold text-sm">{fmtBRL(p.price)}</div>
              <Pill tone="brand" className="text-[10px]">{p.family_name}</Pill>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
