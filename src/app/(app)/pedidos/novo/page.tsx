import { QuoteForm } from '@/components/QuoteForm';
import { PageHeader } from '@/components/PageHeader';
export default function NovoPedidoPage() { return (<div><PageHeader title="Novo pedido" back="/pedidos" /><QuoteForm scope="order" /></div>); }
