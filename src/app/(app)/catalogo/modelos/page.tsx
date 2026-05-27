'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/components/Toast';

type CatTpl = {
  id: number; name: string; description?: string | null;
  product_ids: number[]; options: any;
  created_at: string; updated_at: string;
};

export default function CatalogoModelosPage() {
  const toast = useToast();
  const [items, setItems] = useState<CatTpl[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/catalog-templates');
      const data = await r.json();
      setItems(Array.isArray(data) ? data : []);
    } catch { toast.push('Falha ao carregar modelos', 'danger'); }
    finally { setLoading(false); }
  }

  async function gerarPdf(t: CatTpl) {
    setBusy(t.id);
    try {
      const r = await fetch(`/api/catalog-templates/${t.id}/pdf`, { method: 'POST' });
      if (!r.ok) throw new Error('Falha ao gerar PDF');
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${t.name}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) { toast.push(e.message, 'danger'); }
    finally { setBusy(null); }
  }

  async function deletar(t: CatTpl) {
    if (!confirm(`Excluir modelo "${t.name}"?`)) return;
    try {
      const r = await fetch(`/api/catalog-templates/${t.id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('Falha ao excluir');
      setItems((p) => p.filter((x) => x.id !== t.id));
      toast.push('Modelo excluído', 'success');
    } catch (e: any) { toast.push(e.message, 'danger'); }
  }

  async function editar(t: CatTpl) {
    const name = window.prompt('Novo nome:', t.name);
    if (!name) return;
    const description = window.prompt('Descrição:', t.description || '') || '';
    try {
      const r = await fetch(`/api/catalog-templates/${t.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      if (!r.ok) throw new Error('Falha ao editar');
      const updated = await r.json();
      setItems((p) => p.map((x) => x.id === t.id ? updated : x));
      toast.push('Modelo atualizado', 'success');
    } catch (e: any) { toast.push(e.message, 'danger'); }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Modelos de catálogo" back="/catalogo" />
      <Card>
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm font-bold">{items.length} modelo{items.length === 1 ? '' : 's'} salvo{items.length === 1 ? '' : 's'}</div>
          <a href="/catalogo/gerar" className="text-sm font-bold text-brand-700 hover:underline">+ Criar novo modelo</a>
        </div>
        {loading ? (
          <div className="text-muted text-sm">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="text-muted text-sm">Nenhum modelo salvo. Vá em "Gerar catálogo" e clique em "Salvar como modelo".</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((t) => (
              <div key={t.id} className="rounded-2xl border border-border bg-panel p-4 flex flex-col gap-2">
                <div className="font-bold text-brand-900 text-base leading-tight">{t.name}</div>
                {t.description && <div className="text-xs text-muted">{t.description}</div>}
                <div className="text-xs text-muted">{t.product_ids?.length || 0} produto{(t.product_ids?.length || 0) === 1 ? '' : 's'}</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button size="sm" onClick={() => gerarPdf(t)} loading={busy === t.id}>Gerar PDF</Button>
                  <Button size="sm" variant="secondary" onClick={() => editar(t)}>Editar</Button>
                  <Button size="sm" variant="ghost" onClick={() => deletar(t)}>Excluir</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
