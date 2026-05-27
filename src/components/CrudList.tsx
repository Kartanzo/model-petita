'use client';
import { useEffect, useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { useToast } from './Toast';

interface Field { name: string; label: string; type?: 'text' | 'number' | 'select'; options?: { value: any; label: string }[]; step?: string }

export function CrudList({ endpoint, fields, title, listKey = 'name' }: { endpoint: string; fields: Field[]; title: string; listKey?: string }) {
  const toast = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);

  const load = () => fetch(endpoint).then(r => r.json()).then(setRows);
  useEffect(() => { load(); }, []);

  function startNew() { const obj: any = {}; fields.forEach((f) => { obj[f.name] = f.type === 'number' ? 0 : ''; }); setEditing(obj); }

  async function save() {
    if (!editing) return;
    const method = editing.id ? 'PATCH' : 'POST';
    const url = editing.id ? `${endpoint}/${editing.id}` : endpoint;
    const payload = { ...editing };
    fields.forEach((f) => { if (f.type === 'number' && payload[f.name] != null) payload[f.name] = Number(payload[f.name]); });
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (r.ok) { toast.push('Salvo', 'success'); setEditing(null); load(); } else { const d = await r.json().catch(() => ({})); toast.push(d.error || 'Falha', 'danger'); }
  }

  async function remove(id: number) {
    if (!confirm('Excluir item?')) return;
    const r = await fetch(`${endpoint}/${id}`, { method: 'DELETE' });
    if (r.ok) { toast.push('Removido', 'success'); load(); } else toast.push('Falha', 'danger');
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h2 className="font-bold">{title}</h2><Button size="sm" onClick={startNew}>Novo</Button></div>
      <Card>
        {rows.length === 0 ? <div className="text-muted text-sm">Nenhum registro</div> : (
          <ul className="divide-y divide-border">
            {rows.map((r: any) => (
              <li key={r.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-text truncate">{r[listKey] || `#${r.id}`}</div>
                  <div className="text-xs text-muted">{fields.slice(1, 4).map((f) => `${f.label}: ${r[f.name] ?? '—'}`).join(' · ')}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(r)}>Editar</Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>Remover</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end lg:items-center justify-center p-0 lg:p-4" onClick={() => setEditing(null)}>
          <Card className="w-full lg:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl lg:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-3">{editing.id ? 'Editar' : 'Novo'}</h3>
            <div className="space-y-3">
              {fields.map((f) => (
                <label key={f.name} className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted">{f.label}</span>
                  {f.type === 'select' ? (
                    <select value={editing[f.name] ?? ''} onChange={(e) => setEditing({ ...editing, [f.name]: e.target.value })} className="w-full h-12 rounded-xl border border-border bg-panel px-3 mt-1">
                      <option value="">—</option>
                      {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input type={f.type || 'text'} step={f.step} value={editing[f.name] ?? ''} onChange={(e) => setEditing({ ...editing, [f.name]: e.target.value })} className="w-full h-12 rounded-xl border border-border bg-panel px-3 mt-1" />
                  )}
                </label>
              ))}
              <div className="flex gap-2 pt-2">
                <Button onClick={save} className="flex-1">Salvar</Button>
                <Button variant="secondary" onClick={() => setEditing(null)}>Cancelar</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
