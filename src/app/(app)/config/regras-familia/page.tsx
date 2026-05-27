'use client';
import { useEffect, useState } from 'react';
import { CrudList } from '@/components/CrudList';
import { PageHeader } from '@/components/PageHeader';

export default function RegrasFamiliaPage() {
  const [fams, setFams] = useState<any[]>([]);
  useEffect(() => { fetch('/api/families').then(r => r.json()).then(setFams); }, []);
  return (
    <div>
      <PageHeader title="Regras por família" back="/config" />
      <CrudList
        endpoint="/api/family-rules"
        title="Regras"
        listKey="family_name"
        fields={[
          { name: 'family_id', label: 'Família', type: 'select', options: fams.map(f => ({ value: f.id, label: f.name })) },
          { name: 'max_discount_pct', label: 'Desconto máx (%)', type: 'number', step: '0.01' },
          { name: 'min_margin_pct', label: 'Margem mín (%)', type: 'number', step: '0.01' },
          { name: 'default_markup_pct', label: 'Markup padrão (%)', type: 'number', step: '0.01' },
          { name: 'override_role', label: 'Override role', type: 'select', options: [{ value: 'admin', label: 'admin' }, { value: 'superuser', label: 'superuser' }] },
        ]}
      />
    </div>
  );
}
