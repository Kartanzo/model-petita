'use client';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('petita@petita.com.br');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || 'Erro ao entrar');
      }
      router.push('/');
      router.refresh();
    } catch (e: any) {
      setErr(e.message || 'Erro');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-brand-50 via-cream to-mint">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-peach/40 blur-3xl" />
      </div>
      <form onSubmit={submit} className="relative z-10 w-full max-w-sm bg-panel rounded-2xl shadow-soft p-6 space-y-4 border border-border">
        <div className="text-center">
          <Image src="/logo-petita.png" alt="Petita" width={64} height={64} className="mx-auto rounded-xl" />
          <h1 className="mt-3 text-2xl font-bold text-brand-700">Bem-vindo de volta</h1>
          <p className="text-sm text-muted">Entre para acessar o sistema</p>
        </div>
        <Input label="Email" type="email" inputMode="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Senha" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <div className="text-sm text-danger">{err}</div>}
        <Button type="submit" loading={loading} className="w-full">Entrar</Button>
        <p className="text-xs text-muted text-center">Demo: petita@petita.com.br / Senha123!</p>
      </form>
    </main>
  );
}
