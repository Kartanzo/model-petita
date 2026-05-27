'use client';
import Image from 'next/image';
import Link from 'next/link';
import { User as UserIcon } from 'lucide-react';

export function Topbar({ title }: { title?: string }) {
  return (
    <header className="lg:hidden sticky top-0 z-30 bg-panel/95 backdrop-blur border-b border-border safe-top">
      <div className="h-14 px-4 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-petita.png" alt="Petita" width={32} height={32} className="rounded-lg" />
        </Link>
        <div className="flex-1 text-center font-bold text-text truncate">{title || ''}</div>
        <Link href="/config" className="h-9 w-9 rounded-full bg-brand-50 flex items-center justify-center text-brand-700">
          <UserIcon className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}
