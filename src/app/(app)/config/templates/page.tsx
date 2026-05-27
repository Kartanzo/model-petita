'use client';
import { CrudList } from '@/components/CrudList';
import { PageHeader } from '@/components/PageHeader';

export default function TemplatesPage() {
  return (
    <div>
      <PageHeader title="Templates" back="/config" />
      <CrudList
        endpoint="/api/templates"
        title="Modelos"
        fields={[
          { name: 'name', label: 'Nome' },
          { name: 'scope', label: 'Escopo', type: 'select', options: [{ value: 'quote', label: 'Orçamento' }, { value: 'order', label: 'Pedido' }] },
          { name: 'body', label: 'Body (JSON)' },
        ]}
      />
    </div>
  );
}
