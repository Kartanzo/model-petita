import Link from 'next/link';
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
    q(`SELECT p.*, f.name AS family_name FROM petita.products p LEFT JOIN petita.product_families f ON f.id=p.family_id WHERE ${where.join(' AND ')} ORDER BY p.name LIMIT 500`, params),
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
        <>
          {/* Mobile: lista compacta */}
          <div className="lg:hidden space-y-2">
            {rows.map((p: any) => (
              <Link key={p.id} href={`/produtos/${p.id}`}>
                <Card className="flex items-center gap-3 p-2.5">
                  <div className="h-12 w-12 shrink-0 rounded-lg bg-bg overflow-hidden flex items-center justify-center">
                    {p.photo_url ? <img src={p.photo_url} alt={p.name} className="w-full h-full object-contain" /> : <span className="text-muted text-[10px]">s/foto</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[10px] text-muted">{p.code}</div>
                    <div className="font-bold text-sm truncate">{p.name}</div>
                    <div className="text-[11px] text-muted truncate">{p.family_name}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-success font-bold text-sm">{fmtBRL(p.price)}</div>
                    <div className="text-[10px] text-muted">custo {fmtBRL(p.cost)}</div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
          {/* Desktop: tabela densa */}
          <div className="hidden lg:block rounded-2xl border border-border bg-panel overflow-hidden shadow-soft">
            <table className="w-full text-sm">
              <thead className="bg-brand-50 text-brand-900">
                <tr className="text-left">
                  <th className="px-3 py-2 font-bold w-14">Foto</th>
                  <th className="px-3 py-2 font-bold">Código</th>
                  <th className="px-3 py-2 font-bold">Nome</th>
                  <th className="px-3 py-2 font-bold">Família</th>
                  <th className="px-3 py-2 font-bold text-right">Custo</th>
                  <th className="px-3 py-2 font-bold text-right">Preço</th>
                  <th className="px-3 py-2 font-bold text-center">Status</th>
                  <th className="px-3 py-2 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p: any) => (
                  <tr key={p.id} className="border-t border-border hover:bg-brand-50/40 transition-colors">
                    <td className="px-3 py-2">
                      <div className="h-10 w-10 rounded-lg bg-bg overflow-hidden flex items-center justify-center">
                        {p.photo_url ? <img src={p.photo_url} alt="" className="w-full h-full object-contain" /> : <span className="text-muted text-[10px]">—</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2 font-mono text-[12px] text-muted">{p.code}</td>
                    <td className="px-3 py-2 font-semibold">{p.name}</td>
                    <td className="px-3 py-2"><Pill tone="brand" className="text-[10px]">{p.family_name}</Pill></td>
                    <td className="px-3 py-2 text-right font-mono">{fmtBRL(p.cost)}</td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-success">{fmtBRL(p.price)}</td>
                    <td className="px-3 py-2 text-center"><Pill tone={p.active ? 'success' : 'neutral'} className="text-[10px]">{p.active ? 'Ativo' : 'Inativo'}</Pill></td>
                    <td className="px-3 py-2 text-right">
                      <Link href={`/produtos/${p.id}`} className="text-brand-700 font-semibold hover:underline text-xs">Editar</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
