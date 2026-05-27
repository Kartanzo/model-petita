'use client';
import { CrudList } from '@/components/CrudList';
import { PageHeader } from '@/components/PageHeader';

export default function FamiliasPage() {
  return (
    <div>
      <PageHeader title="Famílias de produto" back="/config" />
      <CrudList
        endpoint="/api/families"
        title="Famílias"
        fields={[
          { name: 'name', label: 'Nome' },
          { name: 'slug', label: 'Slug' },
          { name: 'description', label: 'Descrição' },
          { name: 'display_order', label: 'Ordem', type: 'number' },
        ]}
      />
    </div>
  );
}
