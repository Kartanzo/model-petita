'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Select } from '@/components/Input';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/components/Toast';

export default function GerarCatalogoPage() {
  const toast = useToast();
  const [fams, setFams] = useState<any[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [order, setOrder] = useState('family');
  const [includeDesc, setIncludeDesc] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetch('/api/families').then(r => r.json()).then(setFams); }, []);

  function toggle(id: number) { setSelected(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]); }

  async function generate() {
    setLoading(true);
    try {
      const r = await fetch('/api/catalog/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ family_ids: selected.length ? selected : undefined, order, include_description: includeDesc }),
      });
      if (!r.ok) throw new Error('Falha ao gerar');
      const blob = await r.blob();
      window.open(URL.createObjectURL(blob), '_blank');
    } catch (e: any) { toast.push(e.message, 'danger'); } finally { setLoading(false); }
  }

  return (
    <div>
      <PageHeader title="Gerar catálogo" back="/catalogo" />
      <div className="space-y-4">
        <Card>
          <div className="text-sm font-bold mb-3">Famílias (vazio = todas)</div>
          <div className="grid grid-cols-2 gap-2">
            {fams.map((f: any) => (
              <label key={f.id} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer ${selected.includes(f.id) ? 'border-brand-700 bg-brand-50' : 'border-border bg-panel'}`}>
                <input type="checkbox" checked={selected.includes(f.id)} onChange={() => toggle(f.id)} />
                <span className="text-sm font-semibold">{f.name}</span>
              </label>
            ))}
          </div>
        </Card>
        <Card className="space-y-3">
          <Select label="Ordenação" value={order} onChange={(e) => setOrder(e.target.value)}>
            <option value="family">Por família</option>
            <option value="name">Alfabética</option>
            <option value="price">Por preço</option>
          </Select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeDesc} onChange={(e) => setIncludeDesc(e.target.checked)} /> Incluir descrição</label>
        </Card>
        <Button onClick={generate} loading={loading} className="w-full">Gerar e abrir PDF</Button>
      </div>
    </div>
  );
}
