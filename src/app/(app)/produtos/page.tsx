import Link from 'next/link';
import Image from 'next/image';
import { Plus } from 'lucide-react';
import { q } from '@/lib/db';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Pill } from '@/components/Pill';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { fmtBRL } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ProdutosPage({ searchParams }: { searchParams: { q?: string; family_id?: string } }) {
  const params: any[] = []; const where: string[] = ['p.active=TRUE'];
  if (searchParams.q) { params.push(`%${searchParams.q}%`); where.push(`(p.name ILIKE $${params.length} OR p.code ILIKE $${params.length})`); }
  if (searchParams.family_id) { params.push(parseInt(searchParams.family_id, 10)); where.push(`p.family_id=$${params.length}`); }
  const [{ rows }, fams] = await Promise.all([
    q(`SELECT p.*, f.name AS family_name FROM petita.products p LEFT JOIN petita.product_families f ON f.id=p.family_id WHERE ${where.join(' AND ')} ORDER BY p.name LIMIT 200`, params),
    q(`SELECT id,name FROM petita.product_families WHERE active=TRUE ORDER BY display_order`),
  ]);
  return (
    <div>
      <PageHeader title="Produtos" subtitle={`${rows.length} ativos`} action={
        <Link href="/produtos/novo"><Button><Plus className="h-4 w-4" /> Novo</Button></Link>
      } />
      <form className="mb-4 flex gap-2">
        <input name="q" defaultValue={searchParams.q || ''} placeholder="Buscar nome ou código" className="flex-1 h-12 rounded-xl border border-border bg-panel px-3 text-[15px]" />
        <select name="family_id" defaultValue={searchParams.family_id || ''} className="h-12 rounded-xl border border-border bg-panel px-3 text-[15px]">
          <option value="">Todas as famílias</option>
          {fams.rows.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <Button type="submit" variant="secondary">Filtrar</Button>
      </form>
      {rows.length === 0 ? (
        <EmptyState title="Nenhum produto" />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {rows.map((p: any) => (
            <Link key={p.id} href={`/produtos/${p.id}`}>
              <Card className="hover:shadow-soft transition-shadow p-3">
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
