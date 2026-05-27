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
    <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-brand-700 text-white h-screen sticky top-0">
      <div className="p-4 flex items-center justify-center border-b border-white/10">
        <Image src="/logo-petita.png" alt="Petita" width={48} height={48} className="rounded-lg bg-white/95 p-1" />
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map((it) => {
          const active = it.href === '/' ? pathname === '/' : pathname.startsWith(it.href);
          const Icon = it.icon;
          return (
            <Link key={it.href} href={it.href} className={cn(
              'relative flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-semibold transition-colors',
              active
                ? 'bg-white/15 text-white before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-r-full before:bg-white'
                : 'text-brand-100/85 hover:bg-white/10 hover:text-white',
            )}>
              <Icon className="h-5 w-5" /> {it.label}
            </Link>
          );
        })}
      </nav>
      <form action="/api/auth/logout" method="POST" className="p-3 border-t border-white/10">
        <button className="w-full flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-semibold text-brand-100/80 hover:bg-white/10 hover:text-white">
          <LogOut className="h-5 w-5" /> Sair
        </button>
      </form>
    </aside>
  );
}
