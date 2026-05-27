'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Select, Textarea } from './Input';
import { Button } from './Button';
import { Card } from './Card';
import { useToast } from './Toast';

export function CustomerForm({ initial }: { initial?: any }) {
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<any>(initial || { type: 'PJ', active: true, credit_limit: 0 });
  const [saving, setSaving] = useState(false);

  function bind(field: string) {
    return { value: data[field] ?? '', onChange: (e: any) => setData({ ...data, [field]: e.target.value }) };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const url = initial?.id ? `/api/customers/${initial.id}` : '/api/customers';
      const method = initial?.id ? 'PATCH' : 'POST';
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, credit_limit: Number(data.credit_limit || 0) }),
      });
      if (!r.ok) throw new Error((await r.json()).error || 'Erro');
      toast.push('Cliente salvo', 'success');
      router.push('/clientes'); router.refresh();
    } catch (e: any) { toast.push(e.message, 'danger'); } finally { setSaving(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-4 pb-24 lg:pb-0">
      <Card className="space-y-4">
        <Select label="Tipo" {...bind('type')}>
          <option value="PF">Pessoa Física</option>
          <option value="PJ">Pessoa Jurídica</option>
        </Select>
        <Input label="Nome / Razão social" required {...bind('name')} />
        <Input label="Nome fantasia" {...bind('trade_name')} />
        <Input label={data.type === 'PF' ? 'CPF' : 'CNPJ'} inputMode="numeric" {...bind('doc')} />
        <Input label="Segmento" {...bind('segment')} placeholder="farmácia, loja bebê, distribuidor…" />
      </Card>
      <Card className="space-y-4">
        <Input label="Email" type="email" inputMode="email" {...bind('email')} />
        <Input label="Telefone" inputMode="tel" {...bind('phone')} />
        <Input label="WhatsApp" inputMode="tel" {...bind('whatsapp')} />
      </Card>
      <Card className="space-y-4">
        <Input label="Endereço" {...bind('address_street')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Número" {...bind('address_number')} />
          <Input label="Complemento" {...bind('address_complement')} />
        </div>
        <Input label="Bairro" {...bind('address_district')} />
        <div className="grid grid-cols-3 gap-3">
          <Input label="Cidade" {...bind('address_city')} className="col-span-2" />
          <Input label="UF" maxLength={2} {...bind('address_state')} />
        </div>
        <Input label="CEP" inputMode="numeric" {...bind('address_zip')} />
      </Card>
      <Card className="space-y-4">
        <Input label="Limite de crédito (R$)" type="number" inputMode="decimal" step="0.01" {...bind('credit_limit')} />
        <Textarea label="Observações" {...bind('notes')} />
      </Card>
      <div className="fixed lg:static bottom-16 inset-x-0 p-4 lg:p-0 bg-bg/95 lg:bg-transparent border-t lg:border-0 border-border safe-bottom z-30">
        <Button type="submit" loading={saving} className="w-full lg:w-auto">Salvar cliente</Button>
      </div>
    </form>
  );
}
