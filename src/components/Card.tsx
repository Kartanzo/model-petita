import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl bg-panel border border-border p-4 shadow-soft', className)} {...rest} />;
}

interface KpiProps { label: string; value: string; delta?: string; icon?: React.ReactNode; tone?: 'brand' | 'success' | 'warning' | 'info' }
export function KpiCard({ label, value, delta, icon, tone = 'brand' }: KpiProps) {
  const toneBg: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-700',
    success: 'bg-mint text-success',
    warning: 'bg-peach text-warning',
    info: 'bg-brand-100 text-info',
  };
  return (
    <Card className="flex items-center gap-3">
      {icon && <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center', toneBg[tone])}>{icon}</div>}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold uppercase tracking-wider text-muted">{label}</div>
        <div className="text-2xl font-bold font-mono text-text truncate">{value}</div>
        {delta && <div className="text-xs text-muted">{delta}</div>}
      </div>
    </Card>
  );
}
