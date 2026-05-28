'use client';
import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Select } from '@/components/Input';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/components/Toast';
import { fmtBRL } from '@/lib/utils';

type Fam = { id: number; name: string };
type Prod = { id: number; name: string; code: string; price: number; photo_url?: string; family_id: number; family_name?: string };
type CatTpl = { id: number; name: string; description?: string | null; product_ids: number[]; options: any };

export default function GerarCatalogoPage() {
  const toast = useToast();
  const [fams, setFams] = useState<Fam[]>([]);
  const [prods, setProds] = useState<Prod[]>([]);
  const [selectedFams, setSelectedFams] = useState<number[]>([]);
  const [selectedProds, setSelectedProds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [order, setOrder] = useState<'family' | 'name' | 'price'>('family');
  const [includeDesc, setIncludeDesc] = useState(true);
  const [includeSpecs, setIncludeSpecs] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [templates, setTemplates] = useState<CatTpl[]>([]);
  const [tplId, setTplId] = useState<string>('');

  useEffect(() => {
    Promise.all([
      fetch('/api/families').then((r) => r.json()),
      fetch('/api/products?limit=500').then((r) => r.json()),
      fetch('/api/catalog-templates').then((r) => r.json()).catch(() => []),
    ])
      .then(([f, p, t]) => {
        setFams(Array.isArray(f) ? f : f.rows || []);
        const rawProds: Prod[] = Array.isArray(p) ? p : p.rows || [];
        const deduped = Array.from(new Map(rawProds.map((x) => [x.code, x])).values());
        setProds(deduped);
        setTemplates(Array.isArray(t) ? t : []);
      })
      .catch(() => toast.push('Falha ao carregar dados', 'danger'))
      .finally(() => setLoadingData(false));
  }, []);

  function loadTemplate(id: string) {
    setTplId(id);
    if (!id) return;
    const t = templates.find((x) => String(x.id) === id);
    if (!t) return;
    setSelectedProds(new Set(t.product_ids || []));
    const o = t.options || {};
    if (o.order) setOrder(o.order);
    if (typeof o.include_description === 'boolean') setIncludeDesc(o.include_description);
    if (typeof o.include_specs === 'boolean') setIncludeSpecs(o.include_specs);
    toast.push(`Modelo "${t.name}" carregado`, 'info');
  }

  async function saveAsTemplate() {
    if (selectedProds.size === 0) { toast.push('Selecione produtos primeiro', 'info'); return; }
    const name = window.prompt('Nome do modelo:');
    if (!name) return;
    const description = window.prompt('Descrição (opcional):') || '';
    try {
      const r = await fetch('/api/catalog-templates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, description,
          product_ids: Array.from(selectedProds),
          options: { order, include_description: includeDesc, include_specs: includeSpecs },
        }),
      });
      if (!r.ok) throw new Error('Falha ao salvar modelo');
      const t = await r.json();
      setTemplates((prev) => [t, ...prev]);
      setTplId(String(t.id));
      toast.push('Modelo salvo!', 'success');
    } catch (e: any) { toast.push(e.message, 'danger'); }
  }

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return prods.filter((p) => {
      if (selectedFams.length && !selectedFams.includes(p.family_id)) return false;
      if (s && !p.name.toLowerCase().includes(s) && !p.code.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [prods, selectedFams, search]);

  function toggleFam(id: number) {
    setSelectedFams((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }
  function toggleProd(id: number) {
    setSelectedProds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }
  function selectAllVisible() {
    setSelectedProds((prev) => {
      const n = new Set(prev);
      filtered.forEach((p) => n.add(p.id));
      return n;
    });
  }
  function clearSel() { setSelectedProds(new Set()); }

  async function generate() {
    if (selectedProds.size === 0) { toast.push('Selecione ao menos 1 produto', 'info'); return; }
    setLoading(true);
    try {
      const r = await fetch('/api/catalog/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_ids: Array.from(selectedProds),
          order,
          include_description: includeDesc,
          include_specs: includeSpecs,
        }),
      });
      if (!r.ok) throw new Error('Falha ao gerar PDF');
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'catalogo-petita.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.push(e.message, 'danger');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Gerar catálogo" back="/catalogo" />

      {/* Modelos salvos */}
      <Card className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <Select label="Carregar modelo" value={tplId} onChange={(e) => loadTemplate(e.target.value)}>
            <option value="">— Nenhum —</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name} ({t.product_ids?.length || 0})</option>
            ))}
          </Select>
        </div>
        <Button size="sm" variant="secondary" onClick={saveAsTemplate}>Salvar como modelo</Button>
        <a href="/catalogo/modelos" className="text-sm font-bold text-brand-700 hover:underline pb-3">Gerenciar modelos →</a>
      </Card>

      {/* Famílias */}
      <Card>
        <div className="text-sm font-bold mb-3">Filtrar por família</div>
        <div className="flex flex-wrap gap-2">
          {fams.map((f) => (
            <button
              key={f.id}
              onClick={() => toggleFam(f.id)}
              className={`px-3 h-8 rounded-full text-sm font-semibold border transition-colors ${
                selectedFams.includes(f.id)
                  ? 'bg-brand-700 text-white border-brand-700'
                  : 'bg-panel border-border hover:bg-brand-50'
              }`}
            >
              {f.name}
            </button>
          ))}
          {selectedFams.length > 0 && (
            <button onClick={() => setSelectedFams([])} className="px-3 h-8 rounded-full text-xs font-semibold text-muted hover:underline">
              Limpar
            </button>
          )}
        </div>
      </Card>

      {/* Toolbar */}
      <Card className="space-y-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou código..."
          className="w-full h-11 rounded-xl border border-border bg-panel px-3 text-[15px]"
        />
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={selectAllVisible}>Selecionar todos visíveis</Button>
            <Button size="sm" variant="ghost" onClick={clearSel}>Limpar seleção</Button>
          </div>
          <div className="text-sm font-bold text-brand-700">
            {selectedProds.size} selecionado{selectedProds.size === 1 ? '' : 's'} · {filtered.length} visíveis
          </div>
        </div>
      </Card>

      {/* Opções */}
      <Card className="grid sm:grid-cols-3 gap-3">
        <Select label="Ordenação" value={order} onChange={(e) => setOrder(e.target.value as any)}>
          <option value="family">Por família</option>
          <option value="name">Alfabética</option>
          <option value="price">Por preço</option>
        </Select>
        <label className="flex items-center gap-2 text-sm self-end pb-3">
          <input type="checkbox" checked={includeDesc} onChange={(e) => setIncludeDesc(e.target.checked)} /> Incluir descrição
        </label>
        <label className="flex items-center gap-2 text-sm self-end pb-3">
          <input type="checkbox" checked={includeSpecs} onChange={(e) => setIncludeSpecs(e.target.checked)} /> Incluir ficha técnica
        </label>
      </Card>

      {/* Grid produtos */}
      {loadingData ? (
        <Card>Carregando produtos...</Card>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {filtered.map((p) => {
            const sel = selectedProds.has(p.id);
            return (
              <button
                key={p.code}
                onClick={() => toggleProd(p.id)}
                className={`text-left relative rounded-2xl border-2 bg-panel p-3 transition-all hover:-translate-y-0.5 ${
                  sel ? 'border-brand-700 shadow-[0_8px_24px_-12px_rgba(30,75,168,0.45)]' : 'border-border'
                }`}
              >
                <div className={`absolute top-2 right-2 w-6 h-6 rounded-md grid place-items-center border-2 ${sel ? 'bg-brand-700 border-brand-700 text-white' : 'bg-white border-border'}`}>
                  {sel && '✓'}
                </div>
                <div className="aspect-square bg-bg rounded-xl mb-2 overflow-hidden flex items-center justify-center">
                  {p.photo_url ? <img src={p.photo_url} alt={p.name} className="w-full h-full object-contain" /> : <span className="text-muted text-xs">sem foto</span>}
                </div>
                <div className="font-mono text-[10px] text-muted truncate">{p.code}</div>
                <div className="font-bold text-sm leading-tight line-clamp-2">{p.name}</div>
                <div className="text-success font-bold text-sm mt-1">{fmtBRL(p.price)}</div>
              </button>
            );
          })}
        </div>
      )}

      <div className="sticky bottom-4 z-10">
        <Button onClick={generate} loading={loading} className="w-full h-14 text-base">
          Gerar PDF ({selectedProds.size})
        </Button>
      </div>
    </div>
  );
}
