import { notFound } from 'next/navigation';
import { q } from '@/lib/db';
import { CustomerForm } from '@/components/CustomerForm';
import { PageHeader } from '@/components/PageHeader';

export const dynamic = 'force-dynamic';

export default async function EditClientePage({ params }: { params: { id: string } }) {
  const { rows } = await q(`SELECT * FROM petita.customers WHERE id=$1`, [params.id]);
  if (!rows[0]) notFound();
  return (
    <div>
      <PageHeader title={rows[0].name} subtitle="Editar cliente" back="/clientes" />
      <CustomerForm initial={rows[0]} />
    </div>
  );
}
