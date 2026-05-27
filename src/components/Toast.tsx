'use client';
import { createContext, useCallback, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

type Toast = { id: number; message: string; tone: 'success' | 'danger' | 'info' };
type Ctx = { push: (msg: string, tone?: Toast['tone']) => void };
const ToastCtx = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, tone: Toast['tone'] = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed top-4 right-4 left-4 lg:left-auto z-50 space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className={cn(
            'rounded-xl px-4 py-3 shadow-soft text-sm font-semibold pointer-events-auto',
            t.tone === 'success' && 'bg-mint text-success',
            t.tone === 'danger' && 'bg-red-100 text-danger',
            t.tone === 'info' && 'bg-brand-100 text-brand-700',
          )}>{t.message}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const c = useContext(ToastCtx);
  if (!c) throw new Error('useToast must be used within ToastProvider');
  return c;
}
