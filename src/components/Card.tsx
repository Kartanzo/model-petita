import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl bg-panel border border-border p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_rgba(30,75,168,0.25)]', className)} {...rest} />;
}

interface KpiProps { label: string; value: string; delta?: string; icon?: React.ReactNode; tone?: 'brand' | 'success' | 'warning' | 'info' | 'peach' | 'mint' | 'cream' }
export function KpiCard({ label, value, delta, icon, tone = 'brand' }: KpiProps) {
  const toneBg: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-700',
    success: 'bg-mint text-success',
    warning: 'bg-peach text-warning',
    info: 'bg-brand-100 text-info',
    peach: 'bg-peach/60 text-warning',
    mint: 'bg-mint text-success',
    cream: 'bg-cream text-brand-700',
  };
  const cardBg: Record<string, string> = {
    brand: 'bg-brand-50/60',
    success: 'bg-mint/40',
    warning: 'bg-peach/30',
    info: 'bg-brand-100/40',
    peach: 'bg-peach/40',
    mint: 'bg-mint/50',
    cream: 'bg-cream',
  };
  return (
    <Card className={cn('flex items-center gap-3', cardBg[tone])}>
      {icon && <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center shrink-0', toneBg[tone])}>{icon}</div>}
      <div className="flex-1 min-w-0">
        <div className="text-[11px] sm:text-[10px] font-bold uppercase tracking-wider text-muted">{label}</div>
        <div className="text-[28px] sm:text-[24px] leading-tight font-bold font-mono tabular-nums text-text truncate">{value}</div>
        {delta && <div className="text-xs text-muted">{delta}</div>}
      </div>
    </Card>
  );
}
