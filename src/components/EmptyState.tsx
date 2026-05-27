import { Inbox } from 'lucide-react';

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="mx-auto h-16 w-16 rounded-full bg-brand-50 flex items-center justify-center mb-4">
        <Inbox className="h-8 w-8 text-brand-700" />
      </div>
      <div className="text-lg font-bold text-text">{title}</div>
      {description && <div className="text-sm text-muted mt-1">{description}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
