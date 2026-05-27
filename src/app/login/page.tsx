'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('petita@petita.com.br');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!email || !password) { setErr('Preencha e-mail e senha'); return; }
    setLoading(true);
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
    <main
      className="relative min-h-screen font-sans text-brand-900 antialiased"
      style={{
        background:
          'radial-gradient(60% 50% at 20% 0%, #dbe6ff 0%, transparent 60%), radial-gradient(50% 40% at 95% 20%, #ffe4cf 0%, transparent 60%), radial-gradient(70% 60% at 50% 100%, #d3eee0 0%, transparent 60%), #f6f9ff',
      }}
    >
      {/* decor layer */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-60"
          style={{ backgroundImage: 'radial-gradient(rgba(30,75,168,0.08) 1px, transparent 1px)', backgroundSize: '22px 22px' }}
        />
        <span className="bubble" style={{ width: 140, height: 140, background: '#bccffd', top: '10%', left: '8%' }} />
        <span className="bubble b2" style={{ width: 90, height: 90, background: '#ffd9c2', top: '55%', left: '15%' }} />
        <span className="bubble b3" style={{ width: 120, height: 120, background: '#cfeede', top: '18%', right: '10%' }} />
        <span className="bubble b4" style={{ width: 70, height: 70, background: '#dbe6ff', bottom: '18%', right: '14%' }} />
      </div>

      <style jsx>{`
        .bubble {
          position: absolute;
          border-radius: 9999px;
          filter: blur(1px);
          opacity: 0.55;
          animation: float 9s ease-in-out infinite;
          will-change: transform;
        }
        .bubble.b2 { animation-duration: 12s; animation-delay: -3s; }
        .bubble.b3 { animation-duration: 14s; animation-delay: -6s; }
        .bubble.b4 { animation-duration: 11s; animation-delay: -2s; }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-18px) translateX(6px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .bubble { animation: none; }
        }
      `}</style>

      <section
        className="relative z-10 min-h-screen grid place-items-center px-5 py-8"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        <div className="w-full max-w-[400px]">
          <div
            className="rounded-3xl border border-white/60 shadow-[0_30px_80px_-30px_rgba(30,75,168,0.35)] p-6 sm:p-8"
            style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'saturate(140%) blur(10px)', WebkitBackdropFilter: 'saturate(140%) blur(10px)' }}
          >
            <div className="flex justify-center mb-5">
              <img src="/logo-petita.png" alt="Petita" className="h-14 sm:h-16 select-none" draggable={false} />
            </div>

            <div className="text-center mb-6">
              <h1 className="text-[22px] sm:text-[24px] font-extrabold tracking-tight text-brand-900">Bem-vindo de volta</h1>
              <p className="text-sm text-brand-900/65 mt-1">Acesse o painel da Petita</p>
            </div>

            <form onSubmit={submit} className="space-y-3.5" noValidate>
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-900/70">E-mail</span>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-brand-900/45" />
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    placeholder="voce@empresa.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 pl-10 pr-3.5 rounded-xl border border-brand-100 bg-white/90 text-[16px] placeholder:text-brand-900/35 outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-700/15 focus:bg-white transition"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-900/70">Senha</span>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-brand-900/45" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    required
                    minLength={4}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 pl-10 pr-11 rounded-xl border border-brand-100 bg-white/90 text-[16px] placeholder:text-brand-900/35 outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-700/15 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    aria-label={showPwd ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 grid place-items-center rounded-lg hover:bg-brand-50 transition-colors"
                  >
                    {showPwd ? <EyeOff className="w-[18px] h-[18px] text-brand-900/55" /> : <Eye className="w-[18px] h-[18px] text-brand-900/55" />}
                  </button>
                </div>
              </label>

              <div className="flex items-center justify-between pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-brand-900/80 select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-brand-200 text-brand-700 focus:ring-brand-700"
                  />
                  Lembrar-me
                </label>
                <a href="#" className="text-sm font-semibold text-brand-700 hover:underline">Esqueci a senha</a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl text-white font-bold text-[15px] tracking-wide transition active:translate-y-px disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                style={{ background: 'linear-gradient(180deg, #2a5ec0 0%, #1e4ba8 100%)', boxShadow: '0 6px 16px -6px rgba(30,75,168,0.45)' }}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2 justify-center">
                    <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                    Entrando…
                  </span>
                ) : (
                  'Entrar'
                )}
              </button>

              {err && <p className="text-center text-[13px] text-rose-600 font-semibold pt-1">{err}</p>}
            </form>
          </div>

          <div className="mt-5 text-center text-[12px] text-brand-900/55">
            <p>© Petita · Um carinho a mais</p>
            <p className="mt-1">
              <a href="#" className="hover:underline">Termos</a>
              <span className="px-1.5 opacity-50">·</span>
              <a href="#" className="hover:underline">Privacidade</a>
              <span className="px-1.5 opacity-50">·</span>
              <a href="#" className="hover:underline">Suporte</a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
