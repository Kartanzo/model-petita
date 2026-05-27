'use client';
import { CrudList } from '@/components/CrudList';
import { PageHeader } from '@/components/PageHeader';

export default function ImpostosPage() {
  return (
    <div>
      <PageHeader title="Regras de imposto" back="/config" />
      <CrudList
        endpoint="/api/tax-rules"
        title="Impostos"
        fields={[
          { name: 'name', label: 'Nome' },
          { name: 'tax_type', label: 'Tipo', type: 'select', options: ['ICMS','PIS','COFINS','IPI','OUTRO'].map(v => ({ value: v, label: v })) },
          { name: 'rate', label: 'Alíquota (ex 0.18)', type: 'number', step: '0.0001' },
          { name: 'state', label: 'UF (opcional)' },
          { name: 'applies_to', label: 'Aplica a', type: 'select', options: [{ value: 'all', label: 'Tudo' }, { value: 'quote', label: 'Orçamento' }, { value: 'order', label: 'Pedido' }] },
        ]}
      />
    </div>
  );
}
