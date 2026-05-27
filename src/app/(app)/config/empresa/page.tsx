'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { Input, Textarea } from '@/components/Input';
import { Button } from '@/components/Button';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/components/Toast';

export default function ConfigEmpresaPage() {
  const toast = useToast();
  const [data, setData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { fetch('/api/config/company').then(r => r.json()).then((v) => setData(v || {})); }, []);
  function bind(f: string) { return { value: data[f] || '', onChange: (e: any) => setData({ ...data, [f]: e.target.value }) }; }
  async function save() {
    setSaving(true);
    try {
      const r = await fetch('/api/config/company', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: data }) });
      if (!r.ok) throw new Error('falha');
      toast.push('Salvo', 'success');
    } catch (e: any) { toast.push(e.message, 'danger'); } finally { setSaving(false); }
  }
  return (
    <div>
      <PageHeader title="Empresa" back="/config" />
      <Card className="space-y-4">
        <Input label="Razão social" {...bind('name')} />
        <Input label="CNPJ" {...bind('cnpj')} />
        <Textarea label="Endereço" {...bind('address')} />
        <Input label="Telefone" {...bind('phone')} />
        <Input label="Email" type="email" {...bind('email')} />
        <Button onClick={save} loading={saving}>Salvar</Button>
      </Card>
    </div>
  );
}
