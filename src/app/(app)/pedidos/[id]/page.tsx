import { notFound } from 'next/navigation';
import { q } from '@/lib/db';
import { QuoteForm } from '@/components/QuoteForm';
import { PageHeader } from '@/components/PageHeader';

export const dynamic = 'force-dynamic';

export default async function PedidoDetailPage({ params }: { params: { id: string } }) {
  const { rows: hd } = await q(`SELECT * FROM petita.orders WHERE id=$1`, [params.id]);
  if (!hd[0]) notFound();
  const { rows: items } = await q(`SELECT oi.*, p.name AS product_name, p.code AS product_code FROM petita.order_items oi JOIN petita.products p ON p.id=oi.product_id WHERE oi.order_id=$1 ORDER BY oi.position`, [params.id]);
  return (<div><PageHeader title={hd[0].number} subtitle="Pedido" back="/pedidos" /><QuoteForm scope="order" initial={{ ...hd[0], items }} /></div>);
}
