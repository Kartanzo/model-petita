'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Send, FileText } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { Input, Select, Textarea } from './Input';
import { Pill, StatusPill } from './Pill';
import { useToast } from './Toast';
import { fmtBRL, fmtPct } from '@/lib/utils';

function toDateInput(v: any): string {
  if (!v) return '';
  if (typeof v === 'string') return v.slice(0, 10);
  try { const d = new Date(v); if (isNaN(d.getTime())) return ''; return d.toISOString().slice(0, 10); } catch { return ''; }
}

interface Item {
  product_id: number;
  product_name?: string;
  product_code?: string;
  qty: number;
  list_price: number;
  unit_price: number;
  unit_cost?: number;
  line_total?: number;
  discount_pct?: number;
}

interface Props {
  initial?: any;
  scope: 'quote' | 'order';
}

export function QuoteForm({ initial, scope }: Props) {
  const router = useRouter();
  const toast = useToast();
  const isOrder = scope === 'order';
  const [data, setData] = useState<any>(initial || { items: [], payment_terms: '28/35/42 dias', delivery_terms: 'CIF' });
  const [items, setItems] = useState<Item[]>((Array.isArray(initial?.items) ? initial.items : []).map((i: any) => ({ ...i, qty: Number(i.qty), list_price: Number(i.list_price), unit_price: Number(i.unit_price) })));
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [pricing, setPricing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  useEffect(() => {
    fetch('/api/customers?active=true').then(r => r.json()).then(setCustomers);
    fetch('/api/products').then(r => r.json()).then(setProducts);
  }, []);

  // recompute pricing whenever items change
  useEffect(() => {
    if (!items.length) { setPricing(null); return; }
    const ctrl = new AbortController();
    fetch(`/api/quotes/0/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items.map(i => ({ product_id: i.product_id, qty: Number(i.qty), list_price: Number(i.list_price), unit_price: Number(i.unit_price) })) }),
      signal: ctrl.signal,
    }).then(r => r.json()).then(setPricing).catch(() => {});
    return () => ctrl.abort();
  }, [items]);

  function addProduct(p: any) {
    setItems([...items, { product_id: p.id, product_name: p.name, product_code: p.code, qty: 1, list_price: Number(p.price), unit_price: Number(p.price), unit_cost: Number(p.cost) }]);
    setShowPicker(false); setPickerSearch('');
  }
  function updateItem(idx: number, patch: Partial<Item>) {
    const next = [...items]; next[idx] = { ...next[idx], ...patch }; setItems(next);
  }
  function removeItem(idx: number) { setItems(items.filter((_, i) => i !== idx)); }

  const filteredProducts = useMemo(() => {
    const s = pickerSearch.toLowerCase();
    return products.filter((p) => !s || p.name.toLowerCase().includes(s) || p.code.toLowerCase().includes(s)).slice(0, 50);
  }, [products, pickerSearch]);

  async function save(extra: Partial<any> = {}) {
    if (!data.customer_id) { toast.push('Selecione o cliente', 'danger'); return; }
    if (!items.length) { toast.push('Adicione ao menos um item', 'danger'); return; }
    setSaving(true);
    try {
      const url = initial?.id ? `/api/${scope === 'quote' ? 'quotes' : 'orders'}/${initial.id}` : `/api/${scope === 'quote' ? 'quotes' : 'orders'}`;
      const method = initial?.id ? 'PATCH' : 'POST';
      const payload = {
        customer_id: Number(data.customer_id),
        template_id: data.template_id ? Number(data.template_id) : null,
        payment_terms: data.payment_terms || null,
        delivery_terms: data.delivery_terms || null,
        valid_until: data.valid_until || null,
        delivery_date: data.delivery_date || null,
        notes: data.notes || null,
        items: items.map((i) => ({ product_id: i.product_id, qty: Number(i.qty), list_price: Number(i.list_price), unit_price: Number(i.unit_price) })),
        ...extra,
      };
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error((await r.json()).error || 'Erro');
      const saved = await r.json();
      toast.push('Salvo', 'success');
      router.push(`/${scope === 'quote' ? 'orcamentos' : 'pedidos'}/${saved.id || initial.id}`);
      router.refresh();
      return saved;
    } catch (e: any) { toast.push(e.message, 'danger'); } finally { setSaving(false); }
  }

  async function sendQuote() {
    if (!initial?.id) { await save(); return; }
    const r = await fetch(`/api/quotes/${initial.id}/send`, { method: 'POST' });
    if (r.ok) { toast.push('Orçamento marcado como enviado', 'success'); router.refresh(); } else { toast.push('Falha ao enviar', 'danger'); }
  }
  function openPdf() {
    if (!initial?.id) { toast.push('Salve antes de gerar PDF', 'info'); return; }
    window.open(`/api/quotes/${initial.id}/pdf`, '_blank');
  }
  async function convert() {
    if (!initial?.id) return;
    const r = await fetch(`/api/quotes/${initial.id}/convert`, { method: 'POST' });
    if (r.ok) { const o = await r.json(); toast.push('Pedido criado', 'success'); router.push(`/pedidos/${o.id}`); } else toast.push('Falha ao converter', 'danger');
  }

  return (
    <div className="space-y-4 pb-32 lg:pb-4">
      {pricing && (
        <Card className="flex items-center justify-between bg-gradient-to-r from-brand-50 to-cream">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted">Total</div>
            <div className="text-2xl font-mono font-bold text-brand-700">{fmtBRL(pricing.total)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold uppercase tracking-wider text-muted">Margem</div>
            <div className="font-mono font-bold text-text">{fmtPct(pricing.profit_pct)}</div>
            <Pill tone={pricing.profitability === 'rentavel' ? 'success' : pricing.profitability === 'atencao' ? 'warning' : pricing.profitability === 'nao_rentavel' ? 'danger' : 'neutral'}>
              {pricing.profitability.replace('_', ' ')}
            </Pill>
          </div>
        </Card>
      )}

      <Card>
        <div className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Cliente</div>
        <Select value={data.customer_id || ''} onChange={(e) => setData({ ...data, customer_id: e.target.value })}>
          <option value="">Selecione um cliente…</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.trade_name ? ` — ${c.trade_name}` : ''}</option>)}
        </Select>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold text-text">Itens ({items.length})</div>
          <Button type="button" size="sm" onClick={() => setShowPicker(true)}><Plus className="h-4 w-4" /> Adicionar</Button>
        </div>
        {items.length === 0 ? (
          <div className="text-center py-6 text-muted text-sm">Nenhum item adicionado</div>
        ) : (
          <ul className="space-y-3">
            {items.map((it, idx) => (
              <li key={idx} className="border border-border rounded-xl p-3">
                <div className="flex items-start gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[10px] text-muted">{it.product_code}</div>
                    <div className="font-semibold text-sm truncate">{it.product_name}</div>
                  </div>
                  <button type="button" onClick={() => removeItem(idx)} className="text-danger p-1"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input label="Qtd" type="number" inputMode="decimal" step="0.001" value={it.qty} onChange={(e) => updateItem(idx, { qty: Number(e.target.value) })} />
                  <Input label="Preço un." type="number" inputMode="decimal" step="0.01" value={it.unit_price} onChange={(e) => updateItem(idx, { unit_price: Number(e.target.value) })} />
                  <div>
                    <div className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">Subtotal</div>
                    <div className="h-12 flex items-center font-mono font-bold text-text">{fmtBRL(it.qty * it.unit_price)}</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {pricing && (
        <Card className="space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-muted">Subtotal</span><span className="font-mono">{fmtBRL(pricing.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted">Desconto</span><span className="font-mono">{fmtBRL(pricing.discount_amount)}</span></div>
          <div className="flex justify-between"><span className="text-muted">Impostos</span><span className="font-mono">{fmtBRL(pricing.tax_amount)}</span></div>
          <div className="flex justify-between"><span className="text-muted">Custo</span><span className="font-mono">{fmtBRL(pricing.cost_total)}</span></div>
          <div className="flex justify-between font-bold pt-2 border-t border-border"><span>Total</span><span className="font-mono">{fmtBRL(pricing.total)}</span></div>
          <div className="flex justify-between text-success"><span>Lucro</span><span className="font-mono">{fmtBRL(pricing.profit_amount)} ({fmtPct(pricing.profit_pct)})</span></div>
        </Card>
      )}

      <Card className="space-y-3">
        <Input label="Condições de pagamento" value={data.payment_terms || ''} onChange={(e) => setData({ ...data, payment_terms: e.target.value })} />
        <Input label="Condições de entrega" value={data.delivery_terms || ''} onChange={(e) => setData({ ...data, delivery_terms: e.target.value })} />
        {!isOrder && <Input label="Válido até" type="date" value={toDateInput(data.valid_until)} onChange={(e) => setData({ ...data, valid_until: e.target.value })} />}
        {isOrder && <Input label="Data de entrega" type="date" value={toDateInput(data.delivery_date)} onChange={(e) => setData({ ...data, delivery_date: e.target.value })} />}
        <Textarea label="Observações" value={data.notes || ''} onChange={(e) => setData({ ...data, notes: e.target.value })} />
      </Card>

      {initial?.status && <div className="flex items-center gap-2"><span className="text-sm text-muted">Status atual:</span><StatusPill status={initial.status} /></div>}

      <div className="fixed lg:static bottom-16 inset-x-0 p-4 lg:p-0 bg-bg/95 lg:bg-transparent border-t lg:border-0 border-border safe-bottom z-30 flex flex-wrap gap-2">
        <Button type="button" onClick={() => save()} loading={saving} className="flex-1">Salvar</Button>
        {!isOrder && initial?.id && <Button type="button" variant="secondary" onClick={sendQuote}><Send className="h-4 w-4" /> Enviar</Button>}
        {initial?.id && <Button type="button" variant="secondary" onClick={openPdf}><FileText className="h-4 w-4" /> PDF</Button>}
        {!isOrder && initial?.id && initial.status !== 'convertido' && <Button type="button" variant="secondary" onClick={convert}>Converter em pedido</Button>}
      </div>

      {showPicker && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end lg:items-center justify-center p-0 lg:p-4" onClick={() => setShowPicker(false)}>
          <div className="bg-panel w-full lg:max-w-lg max-h-[80vh] rounded-t-2xl lg:rounded-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-border">
              <div className="font-bold text-text mb-2">Adicionar produto</div>
              <input autoFocus placeholder="Buscar nome ou código" value={pickerSearch} onChange={(e) => setPickerSearch(e.target.value)} className="w-full h-12 rounded-xl border border-border bg-bg px-3" />
            </div>
            <ul className="overflow-y-auto flex-1 divide-y divide-border">
              {filteredProducts.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => addProduct(p)} className="w-full text-left p-3 hover:bg-brand-50 flex items-center gap-3">
                    {p.photo_url && <img src={p.photo_url} className="h-12 w-12 rounded-lg object-contain bg-bg" alt="" />}
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-[10px] text-muted">{p.code}</div>
                      <div className="font-semibold text-sm truncate">{p.name}</div>
                    </div>
                    <div className="text-success font-bold">{fmtBRL(p.price)}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
