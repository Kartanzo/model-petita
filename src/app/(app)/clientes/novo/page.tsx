import { CustomerForm } from '@/components/CustomerForm';
import { PageHeader } from '@/components/PageHeader';

export default function NovoClientePage() {
  return (
    <div>
      <PageHeader title="Novo cliente" back="/clientes" />
      <CustomerForm />
    </div>
  );
}
