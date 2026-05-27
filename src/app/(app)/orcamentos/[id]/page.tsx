import { notFound } from 'next/navigation';
import { q } from '@/lib/db';
import { QuoteForm } from '@/components/QuoteForm';
import { PageHeader } from '@/components/PageHeader';

export const dynamic = 'force-dynamic';

export default async function OrcamentoDetailPage({ params }: { params: { id: string } }) {
  const { rows: hd } = await q(`SELECT * FROM petita.quotes WHERE id=$1`, [params.id]);
  if (!hd[0]) notFound();
  const { rows: items } = await q(`SELECT qi.*, p.name AS product_name, p.code AS product_code FROM petita.quote_items qi JOIN petita.products p ON p.id=qi.product_id WHERE qi.quote_id=$1 ORDER BY qi.position`, [params.id]);
  return (<div><PageHeader title={hd[0].number} subtitle="Orçamento" back="/orcamentos" /><QuoteForm scope="quote" initial={{ ...hd[0], items }} /></div>);
}
