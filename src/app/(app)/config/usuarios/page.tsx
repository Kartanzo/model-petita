'use client';
import { CrudList } from '@/components/CrudList';
import { PageHeader } from '@/components/PageHeader';

export default function UsuariosPage() {
  return (
    <div>
      <PageHeader title="Usuários" back="/config" />
      <CrudList
        endpoint="/api/users"
        title="Equipe"
        fields={[
          { name: 'name', label: 'Nome' },
          { name: 'email', label: 'Email' },
          { name: 'password', label: 'Senha (mín 6) — vazio mantém' },
          { name: 'phone', label: 'Telefone' },
          { name: 'role', label: 'Role', type: 'select', options: [{ value: 'user', label: 'user' }, { value: 'admin', label: 'admin' }, { value: 'superuser', label: 'superuser' }] },
        ]}
      />
    </div>
  );
}
