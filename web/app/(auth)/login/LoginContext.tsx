'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/app/store/authStore';

export default function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    login,
    isLoading,
    error,
    isAuthenticated,
    clearError,
    _hasHydrated,
  } = useAuthStore();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  // Aguarda hidratação do Zustand antes de redirecionar
  // Evita o loop: middleware lê cookie → ok, mas Zustand ainda não hidratou → redireciona de novo
  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      const redirect = searchParams.get('redirect') ?? '/';
      router.replace(redirect);
    }
  }, [_hasHydrated, isAuthenticated, router, searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(form.email, form.password);
    if (ok) {
      const redirect = searchParams.get('redirect') ?? '/';
      router.replace(redirect);
    }
  };

  const goToRegister = () => {
    clearError();
    router.push('/register');
  };

  // Não renderiza o form enquanto verifica sessão existente
  // (evita flash do login antes do redirect)
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-[#090909] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090909] text-white flex overflow-x-hidden overflow-y-auto lg:overflow-hidden">
      {/* Lado visual */}
      <div className="hidden lg:flex w-[48%] relative border-r border-red-950 overflow-hidden bg-gradient-to-br from-[#140202] via-[#090909] to-black">
        {/* glow */}
        <div className="absolute w-[420px] h-[420px] bg-red-700/20 blur-[120px] rounded-full top-[-80px] left-[-80px]" />
        <div className="absolute w-[280px] h-[280px] bg-red-500/10 blur-[100px] rounded-full bottom-[-60px] right-[-40px]" />

        {/* pattern */}
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[length:24px_24px]" />

        <div className="relative z-10 flex flex-col justify-between h-full p-14">
          <div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-[0_0_40px_rgba(255,0,0,0.35)]">
                <span className="text-3xl">🐞</span>
              </div>

              <div>
                <h1 className="text-4xl font-black tracking-tight">
                  NotaVermelha
                </h1>
                <p className="text-red-300 text-sm tracking-[0.2em] uppercase">
                  Música • Camaradagem • Independência
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-xl">
            <h2 className="text-7xl leading-[0.95] font-black tracking-tight">
              O streaming
              <span className="text-red-500"> da partilha </span>
            </h2>

            <p className="mt-8 text-zinc-400 text-lg leading-relaxed">
              Uma plataforma onde a partilha é a válvula propulsora, e o amor camarada é lei.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              {['Feed social', 'Comunidades', 'Stories', 'Streaming justo'].map((tag) => (
                <div key={tag} className="px-4 py-2 rounded-full border border-red-800 bg-red-950/40 text-sm text-red-200">
                  {tag}
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs uppercase tracking-[0.3em] text-zinc-600">
            Feito para artistas • Não para gravadoras
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 md:px-6 py-8 md:py-12 relative">
        <div className="absolute w-[300px] h-[300px] bg-red-700/10 blur-[120px] rounded-full top-0" />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8 md:mb-12">
            <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
              <span className="text-2xl">🐞</span>
            </div>
            <div>
              <h1 className="text-3xl font-black">NotaVermelha</h1>
              <p className="text-xs uppercase tracking-[0.2em] text-red-300">
                streaming independente
              </p>
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-none">
              Login
            </h2>
            <p className="mt-3 md:mt-4 text-sm md:text-base text-zinc-400 leading-relaxed">
              Conecte-se à comunidade de artistas independentes.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">E-mail</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="voce@email.com"
                required
                className="w-full bg-[#111111] border border-zinc-800 focus:border-red-600 focus:ring-4 focus:ring-red-900/40 transition-all rounded-xl px-4 py-3 md:py-4 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">Senha</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full bg-[#111111] border border-zinc-800 focus:border-red-600 focus:ring-4 focus:ring-red-900/40 transition-all rounded-xl px-4 py-3 md:py-4 outline-none"
              />
            </div>

            {error && (
              <div className="bg-red-950/40 border border-red-800 text-red-300 text-sm rounded-xl p-4">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 md:h-14 rounded-xl bg-red-600 hover:bg-red-500 transition-all font-bold text-base md:text-lg shadow-[0_0_30px_rgba(255,0,0,0.25)] disabled:opacity-60"
            >
              {isLoading ? 'Carregando...' : 'Entrar'}
            </button>
          </form>

          <div className="flex items-center gap-4 my-6 md:my-8">
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="text-zinc-500 text-sm">ou</span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          <div className="text-center text-zinc-400">
            Ainda não possui conta?{' '}
            <button
              type="button"
              onClick={goToRegister}
              className="text-red-500 hover:text-red-400 font-semibold transition-colors"
            >
              Cadastre-se
            </button>
          </div>

          <div className="mt-8 md:mt-12 text-center text-xs text-zinc-600 leading-relaxed">
            The Experience Lab © 2026 — trabalhadores do mundo, uni-vos.
          </div>
        </div>
      </div>
    </div>
  );
}