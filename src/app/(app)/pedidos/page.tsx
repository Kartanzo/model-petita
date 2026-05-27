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

export default async function PedidosPage({ searchParams }: { searchParams: { status?: string } }) {
  const params: any[] = []; const where: string[] = [];
  if (searchParams.status) { params.push(searchParams.status); where.push(`o.status=$${params.length}`); }
  const { rows } = await q(`SELECT o.*, c.name AS customer_name FROM petita.orders o JOIN petita.customers c ON c.id=o.customer_id ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY o.created_at DESC LIMIT 100`, params);
  const statuses = ['aberto','aprovado','faturado','cancelado'];
  return (
    <div>
      <PageHeader title="Pedidos" subtitle={`${rows.length} itens`} action={<Link href="/pedidos/novo"><Button><Plus className="h-4 w-4" /> Novo</Button></Link>} />
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <Link href="/pedidos" className={`px-3 h-9 rounded-full border border-border flex items-center text-sm font-semibold ${!searchParams.status ? 'bg-brand-700 text-white' : 'bg-panel'}`}>Todos</Link>
        {statuses.map(s => <Link key={s} href={`/pedidos?status=${s}`} className={`px-3 h-9 rounded-full border border-border flex items-center text-sm font-semibold ${searchParams.status === s ? 'bg-brand-700 text-white' : 'bg-panel'}`}>{s}</Link>)}
      </div>
      {rows.length === 0 ? <EmptyState title="Nenhum pedido" action={<Link href="/pedidos/novo"><Button>Criar primeiro</Button></Link>} /> : (
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map((o: any) => (
            <Link key={o.id} href={`/pedidos/${o.id}`}>
              <Card className="hover:shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-xs text-muted">{o.number}</div>
                    <div className="font-bold text-text truncate">{o.customer_name}</div>
                    <div className="text-xs text-muted">{fmtDate(o.created_at)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-text">{fmtBRL(o.total)}</div>
                    <StatusPill status={o.status} />
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
