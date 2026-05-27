import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export function PageHeader({ title, subtitle, back, action }: { title: string; subtitle?: string; back?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      {back && (
        <Link href={back} className="h-10 w-10 rounded-xl bg-panel border border-border flex items-center justify-center text-brand-700 hover:bg-brand-50">
          <ChevronLeft className="h-5 w-5" />
        </Link>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-xl lg:text-2xl font-bold text-text truncate">{title}</h1>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
