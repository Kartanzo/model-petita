'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, ShoppingCart, Users, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/orcamentos', label: 'Orçamentos', icon: FileText },
  { href: '/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/catalogo', label: 'Catálogo', icon: BookOpen },
  { href: '/clientes', label: 'Clientes', icon: Users },
];

export function BottomNav() {
  const pathname = usePathname() || '';
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-panel border-t border-border safe-bottom shadow-[0_-4px_16px_-8px_rgba(30,75,168,0.15)]">
      <div className="grid grid-cols-4">
        {items.map((it) => {
          const active = pathname.startsWith(it.href);
          const Icon = it.icon;
          return (
            <Link key={it.href} href={it.href} className={cn(
              'flex flex-col items-center justify-center gap-1.5 h-20 text-[12px] font-semibold transition-colors relative',
              active ? 'text-brand-700' : 'text-muted hover:text-brand-700',
            )}>
              {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] rounded-b-full bg-brand-700" />}
              <Icon className="h-7 w-7" strokeWidth={active ? 2.4 : 2} />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
