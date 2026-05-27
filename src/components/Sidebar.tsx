'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, ShoppingCart, Users, BookOpen, Package, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orcamentos', label: 'Orçamentos', icon: FileText },
  { href: '/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/catalogo', label: 'Catálogo', icon: BookOpen },
  { href: '/produtos', label: 'Produtos', icon: Package },
  { href: '/config', label: 'Configurações', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname() || '';
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border bg-panel h-screen sticky top-0">
      <div className="p-4 flex items-center gap-2 border-b border-border">
        <Image src="/logo-petita.png" alt="Petita" width={40} height={40} className="rounded-lg" />
        <div className="font-bold text-brand-700 text-lg">Petita</div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map((it) => {
          const active = it.href === '/' ? pathname === '/' : pathname.startsWith(it.href);
          const Icon = it.icon;
          return (
            <Link key={it.href} href={it.href} className={cn(
              'flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-semibold transition-colors',
              active ? 'bg-brand-700 text-white shadow-soft' : 'text-text hover:bg-brand-50',
            )}>
              <Icon className="h-5 w-5" /> {it.label}
            </Link>
          );
        })}
      </nav>
      <form action="/api/auth/logout" method="POST" className="p-3 border-t border-border">
        <button className="w-full flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-semibold text-muted hover:bg-brand-50">
          <LogOut className="h-5 w-5" /> Sair
        </button>
      </form>
    </aside>
  );
}
