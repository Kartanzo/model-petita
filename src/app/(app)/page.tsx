import Link from 'next/link';
import { FileText, ShoppingCart, TrendingUp, DollarSign, Plus, BookOpen, Users } from 'lucide-react';
import { q } from '@/lib/db';
import { fmtBRL, fmtDate } from '@/lib/utils';
import { Card, KpiCard } from '@/components/Card';
import { Button } from '@/components/Button';
import { StatusPill } from '@/components/Pill';
import { EmptyState } from '@/components/EmptyState';

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  try {
    const [kpis, recent, trend] = await Promise.all([
      q<any>(`
        SELECT
          (SELECT COUNT(*) FROM petita.quotes WHERE status IN ('rascunho','enviado'))::int AS open_quotes,
          (SELECT COALESCE(SUM(total),0)::float8 FROM petita.quotes WHERE status IN ('rascunho','enviado')) AS open_value,
          (SELECT COUNT(*) FROM petita.orders WHERE created_at >= date_trunc('month', now()))::int AS month_orders,
          (SELECT COALESCE(AVG(total),0)::float8 FROM petita.quotes WHERE status NOT IN ('rascunho','rejeitado','expirado')) AS avg_ticket
      `),
      q<any>(`
        SELECT q.id, q.number, q.status, q.total::float8, q.created_at, c.name AS customer_name
          FROM petita.quotes q
          JOIN petita.customers c ON c.id = q.customer_id
         ORDER BY q.created_at DESC LIMIT 5
      `),
      q<any>(`
        SELECT to_char(date_trunc('day', created_at), 'DD/MM') AS day, COALESCE(SUM(total),0)::float8 AS total
          FROM petita.quotes
         WHERE created_at >= now() - interval '30 days'
         GROUP BY 1 ORDER BY MIN(created_at)
      `),
    ]);
    return { kpis: kpis.rows[0], recent: recent.rows, trend: trend.rows };
  } catch (e) {
    return { kpis: { open_quotes: 0, open_value: 0, month_orders: 0, avg_ticket: 0 }, recent: [], trend: [], error: String(e) };
  }
}

export default async function DashboardPage() {
  const { kpis, recent } = await getDashboardData();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">Dashboard</h1>
          <p className="text-sm text-muted">Visão geral das vendas</p>
        </div>
        <div className="hidden lg:flex gap-2">
          <Link href="/orcamentos/novo"><Button><Plus className="h-4 w-4" /> Novo orçamento</Button></Link>
          <Link href="/pedidos/novo"><Button variant="secondary"><Plus className="h-4 w-4" /> Novo pedido</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Orçamentos abertos" value={String(kpis.open_quotes)} icon={<FileText className="h-5 w-5" />} tone="brand" />
        <KpiCard label="Valor em orçamento" value={fmtBRL(kpis.open_value)} icon={<DollarSign className="h-5 w-5" />} tone="success" />
        <KpiCard label="Pedidos do mês" value={String(kpis.month_orders)} icon={<ShoppingCart className="h-5 w-5" />} tone="info" />
        <KpiCard label="Ticket médio" value={fmtBRL(kpis.avg_ticket)} icon={<TrendingUp className="h-5 w-5" />} tone="warning" />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-text">Últimos orçamentos</h2>
          <Link href="/orcamentos" className="text-sm font-semibold text-brand-700">Ver todos</Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState title="Nenhum orçamento ainda" description="Crie o primeiro orçamento para ver aqui" action={<Link href="/orcamentos/novo"><Button>Novo orçamento</Button></Link>} />
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((r: any) => (
              <li key={r.id}>
                <Link href={`/orcamentos/${r.id}`} className="flex items-center gap-3 py-3 hover:bg-brand-50/40 -mx-2 px-2 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs text-muted">{r.number}</div>
                    <div className="font-semibold text-text truncate">{r.customer_name}</div>
                    <div className="text-xs text-muted">{fmtDate(r.created_at)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-text">{fmtBRL(r.total)}</div>
                    <StatusPill status={r.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="lg:hidden grid grid-cols-2 gap-3">
        <Link href="/orcamentos/novo"><Button className="w-full"><Plus className="h-4 w-4" /> Orçamento</Button></Link>
        <Link href="/pedidos/novo"><Button variant="secondary" className="w-full"><Plus className="h-4 w-4" /> Pedido</Button></Link>
      </div>

      <div className="lg:hidden grid grid-cols-2 gap-3">
        <Link href="/catalogo">
          <Card className="flex items-center gap-3 bg-cream">
            <div className="h-11 w-11 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0"><BookOpen className="h-5 w-5" /></div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Atalho</div>
              <div className="font-bold text-text truncate">Catálogo</div>
            </div>
          </Card>
        </Link>
        <Link href="/clientes">
          <Card className="flex items-center gap-3 bg-mint/40">
            <div className="h-11 w-11 rounded-xl bg-mint text-success flex items-center justify-center shrink-0"><Users className="h-5 w-5" /></div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Atalho</div>
              <div className="font-bold text-text truncate">Clientes</div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
