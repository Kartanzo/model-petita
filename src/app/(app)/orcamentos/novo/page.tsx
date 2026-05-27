import { QuoteForm } from '@/components/QuoteForm';
import { PageHeader } from '@/components/PageHeader';

export default function NovoOrcamentoPage() {
  return (<div><PageHeader title="Novo orçamento" back="/orcamentos" /><QuoteForm scope="quote" /></div>);
}
