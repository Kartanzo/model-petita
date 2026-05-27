'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Select, Textarea } from './Input';
import { Button } from './Button';
import { Card } from './Card';
import { useToast } from './Toast';

export function ProductForm({ initial }: { initial?: any }) {
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<any>(initial || { unit: 'UN', cost: 0, price: 0, active: true, technical_specs: {} });
  const [families, setFamilies] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetch('/api/families').then(r => r.json()).then(setFamilies); }, []);

  function bind(f: string) { return { value: data[f] ?? '', onChange: (e: any) => setData({ ...data, [f]: e.target.value }) }; }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const url = initial?.id ? `/api/products/${initial.id}` : '/api/products';
      const method = initial?.id ? 'PATCH' : 'POST';
      const payload = {
        ...data,
        family_id: Number(data.family_id),
        cost: Number(data.cost),
        price: Number(data.price),
        technical_specs: typeof data.technical_specs === 'string' ? JSON.parse(data.technical_specs || '{}') : (data.technical_specs || {}),
      };
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error((await r.json()).error || 'Erro');
      toast.push('Produto salvo', 'success');
      router.push('/produtos'); router.refresh();
    } catch (e: any) { toast.push(e.message, 'danger'); } finally { setSaving(false); }
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    if (!initial?.id) { toast.push('Salve o produto antes de subir foto', 'info'); return; }
    const f = e.target.files?.[0]; if (!f) return;
    const fd = new FormData(); fd.append('photo', f);
    const r = await fetch(`/api/products/${initial.id}/photo`, { method: 'POST', body: fd });
    if (r.ok) { const d = await r.json(); setData({ ...data, photo_url: d.url }); toast.push('Foto enviada', 'success'); }
    else toast.push('Falha no upload', 'danger');
  }

  return (
    <form onSubmit={submit} className="space-y-4 pb-24 lg:pb-0">
      <Card className="space-y-4">
        <Input label="Código (SKU)" required {...bind('code')} />
        <Input label="Nome" required {...bind('name')} />
        <Select label="Família" required {...bind('family_id')}>
          <option value="">Selecione…</option>
          {families.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </Select>
        <Textarea label="Descrição" {...bind('description')} />
      </Card>
      <Card className="grid grid-cols-2 gap-3">
        <Input label="Custo (R$)" type="number" inputMode="decimal" step="0.01" {...bind('cost')} />
        <Input label="Preço (R$)" type="number" inputMode="decimal" step="0.01" {...bind('price')} />
        <Input label="Unidade" {...bind('unit')} />
      </Card>
      <Card className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-muted">Foto</div>
        {data.photo_url && <img src={data.photo_url} alt="" className="h-32 rounded-xl object-contain border border-border" />}
        <input type="file" accept="image/*" onChange={uploadPhoto} className="text-sm" />
      </Card>
      <div className="fixed lg:static bottom-16 inset-x-0 p-4 lg:p-0 bg-bg/95 lg:bg-transparent border-t lg:border-0 border-border safe-bottom z-30">
        <Button type="submit" loading={saving} className="w-full lg:w-auto">Salvar produto</Button>
      </div>
    </form>
  );
}
