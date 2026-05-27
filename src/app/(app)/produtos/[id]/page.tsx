import { notFound } from 'next/navigation';
import { q } from '@/lib/db';
import { ProductForm } from '@/components/ProductForm';
import { PageHeader } from '@/components/PageHeader';

export const dynamic = 'force-dynamic';
export default async function EditProdutoPage({ params }: { params: { id: string } }) {
  const { rows } = await q(`SELECT * FROM petita.products WHERE id=$1`, [params.id]);
  if (!rows[0]) notFound();
  return <div><PageHeader title={rows[0].name} subtitle={`Cód. ${rows[0].code}`} back="/produtos" /><ProductForm initial={rows[0]} /></div>;
}
