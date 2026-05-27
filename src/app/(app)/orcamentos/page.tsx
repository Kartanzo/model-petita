import Link from 'next/link';
import { Plus } from 'lucide-react';
import { q } from '@/lib/db';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { StatusPill } from '@/components/Pill';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { fmtBRL, fmtDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function OrcamentosPage({ searchParams }: { searchParams: { status?: string } }) {
  const params: any[] = []; const where: string[] = [];
  if (searchParams.status) { params.push(searchParams.status); where.push(`q.status=$${params.length}`); }
  const { rows } = await q(
    `SELECT q.*, c.name AS customer_name FROM petita.quotes q JOIN petita.customers c ON c.id=q.customer_id ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY q.created_at DESC LIMIT 100`,
    params,
  );
  const statuses = ['rascunho','enviado','aprovado','rejeitado','convertido','expirado'];
  return (
    <div>
      <PageHeader title="Orçamentos" subtitle={`${rows.length} itens`} action={<Link href="/orcamentos/novo"><Button><Plus className="h-4 w-4" /> Novo</Button></Link>} />
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <Link href="/orcamentos" className={`px-3 h-9 rounded-full border border-border flex items-center text-sm font-semibold whitespace-nowrap ${!searchParams.status ? 'bg-brand-700 text-white' : 'bg-panel'}`}>Todos</Link>
        {statuses.map(s => (
          <Link key={s} href={`/orcamentos?status=${s}`} className={`px-3 h-9 rounded-full border border-border flex items-center text-sm font-semibold whitespace-nowrap ${searchParams.status === s ? 'bg-brand-700 text-white' : 'bg-panel'}`}>{s}</Link>
        ))}
      </div>
      {rows.length === 0 ? <EmptyState title="Nenhum orçamento" action={<Link href="/orcamentos/novo"><Button>Criar primeiro</Button></Link>} /> : (
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map((q: any) => (
            <Link key={q.id} href={`/orcamentos/${q.id}`}>
              <Card className="hover:shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-xs text-muted">{q.number}</div>
                    <div className="font-bold text-text truncate">{q.customer_name}</div>
                    <div className="text-xs text-muted">{fmtDate(q.created_at)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-text">{fmtBRL(q.total)}</div>
                    <StatusPill status={q.status} />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
