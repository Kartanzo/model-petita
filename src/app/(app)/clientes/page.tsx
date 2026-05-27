import Link from 'next/link';
import { Plus } from 'lucide-react';
import { q } from '@/lib/db';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Pill } from '@/components/Pill';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';

export const dynamic = 'force-dynamic';

export default async function ClientesPage({ searchParams }: { searchParams: { q?: string } }) {
  const search = searchParams.q || '';
  const params: any[] = [];
  let where = 'active=TRUE';
  if (search) { params.push(`%${search}%`); where += ` AND (name ILIKE $1 OR doc ILIKE $1 OR email ILIKE $1)`; }
  const { rows } = await q(`SELECT id,name,trade_name,type,doc,email,phone,address_city,address_state,segment FROM petita.customers WHERE ${where} ORDER BY name LIMIT 200`, params);
  return (
    <div>
      <PageHeader title="Clientes" subtitle={`${rows.length} ativos`} action={
        <Link href="/clientes/novo"><Button><Plus className="h-4 w-4" /> Novo</Button></Link>
      } />
      <form className="mb-4">
        <input name="q" defaultValue={search} placeholder="Buscar por nome, CNPJ/CPF, email" className="w-full h-12 rounded-xl border border-border bg-panel px-3 text-[15px]" />
      </form>
      {rows.length === 0 ? (
        <EmptyState title="Nenhum cliente encontrado" action={<Link href="/clientes/novo"><Button>Cadastrar cliente</Button></Link>} />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map((c: any) => (
            <Link key={c.id} href={`/clientes/${c.id}`}>
              <Card className="hover:shadow-soft transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-text truncate">{c.name}</div>
                    <div className="text-sm text-muted truncate">{c.trade_name || c.doc || '—'}</div>
                    <div className="text-xs text-muted mt-1">{c.address_city ? `${c.address_city}/${c.address_state}` : '—'} · {c.segment || '—'}</div>
                  </div>
                  <Pill tone={c.type === 'PJ' ? 'brand' : 'info'}>{c.type}</Pill>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
