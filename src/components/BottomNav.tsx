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
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-panel border-t border-border safe-bottom">
      <div className="grid grid-cols-4">
        {items.map((it) => {
          const active = pathname.startsWith(it.href);
          const Icon = it.icon;
          return (
            <Link key={it.href} href={it.href} className={cn(
              'flex flex-col items-center justify-center gap-1 h-16 text-[11px] sm:text-[10px] font-semibold',
              active ? 'text-brand-700' : 'text-muted',
            )}>
              <Icon className="h-6 w-6 sm:h-5 sm:w-5" /> {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
