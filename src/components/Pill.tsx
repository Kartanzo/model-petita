import { cn } from '@/lib/utils';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';
const toneCls: Record<Tone, string> = {
  success: 'bg-mint text-success',
  warning: 'bg-peach text-warning',
  danger: 'bg-red-100 text-danger',
  info: 'bg-brand-100 text-info',
  neutral: 'bg-border text-muted',
  brand: 'bg-brand-100 text-brand-700',
};

export function Pill({ tone = 'neutral', children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold', toneCls[tone], className)}>
      {children}
    </span>
  );
}

const statusMap: Record<string, Tone> = {
  rascunho: 'neutral', enviado: 'info', aprovado: 'success', rejeitado: 'danger', convertido: 'brand', expirado: 'warning',
  aberto: 'info', faturado: 'success', cancelado: 'danger',
  rentavel: 'success', atencao: 'warning', nao_rentavel: 'danger', desconhecido: 'neutral',
};
export function StatusPill({ status }: { status: string }) {
  return <Pill tone={statusMap[status] || 'neutral'}>{status.replace('_', ' ')}</Pill>;
}
