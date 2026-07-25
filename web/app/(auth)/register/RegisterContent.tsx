'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/app/store/authStore';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

type AccountType = 'listener' | 'creator' | null;
type CreatorKind = 'user' | 'band';

type Step1Form = {
  email: string;
  password: string;
  confirmPassword: string;
};

type Step2Form = {
  username: string;
  accountType: AccountType;
  creatorKind: CreatorKind;
  displayName: string;
  acceptedTerms: boolean;
};

export default function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { register, isLoading, error, isAuthenticated, clearError, _hasHydrated } =
    useAuthStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [step1, setStep1] = useState<Step1Form>({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [step2, setStep2] = useState<Step2Form>({
    username: '',
    accountType: null,
    creatorKind: 'user',
    displayName: '',
    acceptedTerms: false,
  });

  const [localError, setLocalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    username?: string;
    displayName?: string;
    accountType?: string;
    terms?: string;
  }>({});

  // Aguarda hidratação do Zustand antes de redirecionar
  // Evita o loop: middleware lê cookie → ok, mas Zustand ainda não hidratou → redireciona de novo
  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      const redirect = searchParams.get('redirect') ?? '/';
      router.replace(redirect);
    }
  }, [_hasHydrated, isAuthenticated, router, searchParams]);

  // Validação em tempo real para step1
  useEffect(() => {
    const errors: typeof fieldErrors = {};

    const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
    if (step1.email && !emailRegex.test(step1.email)) {
      errors.email = 'E-mail inválido';
    }

    if (step1.password) {
      if (step1.password.length < 6) {
        errors.password = 'A senha deve ter no mínimo 6 caracteres';
      } else if (!/(?=.*[a-z])(?=.*[0-9])/i.test(step1.password)) {
        errors.password = 'A senha deve conter letras e números';
      }
    }

    if (step1.confirmPassword && step1.password !== step1.confirmPassword) {
      errors.confirmPassword = 'As senhas não coincidem';
    }

    setFieldErrors((prev) => ({ ...prev, ...errors }));
  }, [step1.email, step1.password, step1.confirmPassword]);

  // Validação username
  useEffect(() => {
    if (!step2.username) return;
    const usernameRegex = /^[a-z0-9_.]{3,24}$/;
    if (!usernameRegex.test(step2.username)) {
      setFieldErrors((prev) => ({
        ...prev,
        username: 'Use apenas letras minúsculas, números, _ ou . (3-24 caracteres)',
      }));
    } else {
      setFieldErrors((prev) => ({ ...prev, username: undefined }));
    }
  }, [step2.username]);

  // Validação nome de exibição
  useEffect(() => {
    if (step2.displayName && step2.displayName.trim().length < 2) {
      setFieldErrors((prev) => ({
        ...prev,
        displayName: 'Nome muito curto (mínimo 2 caracteres)',
      }));
    } else {
      setFieldErrors((prev) => ({ ...prev, displayName: undefined }));
    }
  }, [step2.displayName]);

  const displayError = localError || error;
  const isCreator = step2.accountType === 'creator';

  const profileLabel = useMemo(() => {
    if (!isCreator) return 'Nome de exibição';
    return step2.creatorKind === 'band' ? 'Nome da banda / selo' : 'Nome artístico';
  }, [isCreator, step2.creatorKind]);

  const profilePlaceholder = useMemo(() => {
    if (!isCreator) return 'Como quer aparecer?';
    return step2.creatorKind === 'band' ? 'Ex: Radio Solaris' : 'Ex: Lil Aurora';
  }, [isCreator, step2.creatorKind]);

  const passwordStrength = useMemo(() => {
    const pwd = step1.password;
    if (!pwd) return 0;
    let strength = 0;
    if (pwd.length >= 6) strength++;
    if (pwd.length >= 10) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
    return Math.min(strength, 4);
  }, [step1.password]);

  const getStrengthLabel = () => {
    switch (passwordStrength) {
      case 1: return 'Fraca';
      case 2: return 'Média';
      case 3: return 'Boa';
      case 4: return 'Forte';
      default: return '';
    }
  };

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 1: return 'bg-red-500';
      case 2: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-green-500';
      default: return 'bg-zinc-700';
    }
  };

  const handleStep1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    setLocalError(null);
    setStep1((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleStep2Change = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    clearError();
    setLocalError(null);
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setStep2((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const isStep1Valid = () =>
    step1.email &&
    !fieldErrors.email &&
    step1.password &&
    !fieldErrors.password &&
    step1.confirmPassword &&
    !fieldErrors.confirmPassword;

  const isStep2Valid = () =>
    step2.accountType !== null &&
    step2.username &&
    !fieldErrors.username &&
    step2.displayName &&
    !fieldErrors.displayName &&
    step2.acceptedTerms;

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStep1Valid()) {
      setLocalError('Preencha os campos corretamente.');
      return;
    }
    setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!step2.accountType) {
      setFieldErrors((prev) => ({ ...prev, accountType: 'Selecione um tipo de conta' }));
      return;
    }
    if (!step2.acceptedTerms) {
      setFieldErrors((prev) => ({ ...prev, terms: 'Você precisa aceitar os termos' }));
      return;
    }
    if (!isStep2Valid()) {
      setLocalError('Preencha todos os campos obrigatórios.');
      return;
    }

    const ok = await register({
      email: step1.email,
      password: step1.password,
      name: step2.displayName,
      username: step2.username,
      accountType: step2.accountType,
      creatorKind: step2.creatorKind,
    });

    if (ok) {
      const redirect = searchParams.get('redirect') ?? '/';
      router.replace(redirect);
    }
  };

  // Não renderiza o form enquanto verifica sessão existente
  // (evita flash do register antes do redirect se já estiver logado)
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-[#090909] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090909] text-white flex overflow-x-hidden overflow-y-auto lg:overflow-hidden">
      {/* LEFT SIDE */}
      <div className="hidden lg:flex w-[48%] relative border-r border-red-950 overflow-hidden bg-gradient-to-br from-[#140202] via-[#090909] to-black">
        <div className="absolute w-[420px] h-[420px] bg-red-700/20 blur-[120px] rounded-full top-[-80px] left-[-80px]" />
        <div className="absolute w-[280px] h-[280px] bg-red-500/10 blur-[100px] rounded-full bottom-[-60px] right-[-40px]" />
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[length:24px_24px]" />

        <div className="relative z-10 flex flex-col justify-between h-full px-14 py-14">
          <div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-[0_0_40px_rgba(255,0,0,0.35)]">
                <span className="text-3xl">🐞</span>
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight">NotaVermelha</h1>
                <p className="text-red-300 text-sm tracking-[0.2em] uppercase">
                  Música • Comunidade • Independência
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-xl">
            <h2 className="text-7xl leading-[0.95] font-black tracking-tight">
              O streaming
              <span className="text-red-500"> da partilha</span>
            </h2>
            <p className="mt-8 text-zinc-400 text-lg leading-relaxed">
              Uma plataforma onde a partilha é a válvula propulsora, e o amor camarada é lei.
            </p>

            {/* Indicador de steps */}
            <div className="mt-12 flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                  step >= 1 ? 'bg-red-600 border-red-600 text-white' : 'border-zinc-700 text-zinc-600'
                }`}>1</div>
                <span className={`text-sm font-medium ${step >= 1 ? 'text-zinc-200' : 'text-zinc-600'}`}>Acesso</span>
              </div>
              <div className={`h-px flex-1 max-w-[48px] ${step === 2 ? 'bg-red-600' : 'bg-zinc-800'}`} />
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                  step === 2 ? 'bg-red-600 border-red-600 text-white' : 'border-zinc-700 text-zinc-600'
                }`}>2</div>
                <span className={`text-sm font-medium ${step === 2 ? 'text-zinc-200' : 'text-zinc-600'}`}>Perfil</span>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              {['Feed social', 'Comunidades', 'Bandas e selos', 'Streaming justo'].map((item) => (
                <div key={item} className="px-4 py-2 rounded-full border border-red-800 bg-red-950/40 text-sm text-red-200">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs uppercase tracking-[0.3em] text-zinc-600">
            Feito para artistas independentes
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="flex-1 flex items-center justify-center px-4 md:px-6 py-8 md:py-12 relative">
        <div className="absolute w-[300px] h-[300px] bg-red-700/10 blur-[120px] rounded-full top-0" />

        <div className="relative z-10 w-full max-w-[520px] px-0">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-6 md:mb-10">
            <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
              <span className="text-2xl">🐞</span>
            </div>
            <div>
              <h1 className="text-3xl font-black">NotaVermelha</h1>
              <p className="text-xs uppercase tracking-[0.2em] text-red-300">streaming independente</p>
            </div>
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <>
              <div className="mb-10 min-h-[132px]">
                <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-none">Crie sua conta</h2>
                <p className="mt-3 md:mt-4 text-sm md:text-base text-zinc-400 leading-relaxed max-w-md">
                  Configure seu acesso para entrar na comunidade.
                </p>
              </div>

              <form onSubmit={handleStep1Submit} className="space-y-5">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">E-mail</label>
                  <input
                    type="email"
                    name="email"
                    value={step1.email}
                    onChange={handleStep1Change}
                    placeholder="voce@email.com"
                    required
                    className={`w-full bg-[#111111] border ${
                      fieldErrors.email ? 'border-red-500' : 'border-zinc-800 focus:border-red-600'
                    } focus:ring-4 focus:ring-red-900/40 transition-all rounded-xl px-4 py-3 md:py-4 outline-none`}
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle size={12} /> {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Senha</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={step1.password}
                      onChange={handleStep1Change}
                      placeholder="Mínimo 6 caracteres"
                      required
                      className={`w-full bg-[#111111] border ${
                        fieldErrors.password ? 'border-red-500' : 'border-zinc-800 focus:border-red-600'
                      } focus:ring-4 focus:ring-red-900/40 transition-all rounded-xl px-4 py-4 pr-12 outline-none`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  {step1.password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1 h-1.5">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`flex-1 rounded-full transition-all ${
                              passwordStrength >= level ? getStrengthColor() : 'bg-zinc-700'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-zinc-500">
                        Força: <span className="capitalize">{getStrengthLabel()}</span>
                      </p>
                      {fieldErrors.password && (
                        <p className="text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle size={12} /> {fieldErrors.password}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Confirmar senha</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={step1.confirmPassword}
                      onChange={handleStep1Change}
                      placeholder="••••••••"
                      required
                      className={`w-full bg-[#111111] border ${
                        fieldErrors.confirmPassword ? 'border-red-500' : 'border-zinc-800 focus:border-red-600'
                      } focus:ring-4 focus:ring-red-900/40 transition-all rounded-xl px-4 py-4 pr-12 outline-none`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle size={12} /> {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>

                {displayError && (
                  <div className="bg-red-950/40 border border-red-800 text-red-300 text-sm rounded-xl p-4 flex items-start gap-2">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <span>{displayError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!isStep1Valid()}
                  className={`w-full h-12 md:h-14 rounded-xl font-bold text-base md:text-lg shadow-[0_0_30px_rgba(255,0,0,0.25)] transition-all ${
                    isStep1Valid()
                      ? 'bg-red-600 hover:bg-red-500'
                      : 'bg-red-800/40 cursor-not-allowed opacity-60'
                  }`}
                >
                  Continuar
                </button>
              </form>

              <div className="flex items-center gap-4 my-6 md:my-8">
                <div className="h-px flex-1 bg-zinc-800" />
                <span className="text-zinc-500 text-sm">ou</span>
                <div className="h-px flex-1 bg-zinc-800" />
              </div>

              <div className="text-center text-zinc-400">
                Já possui conta?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="text-red-500 hover:text-red-400 font-semibold transition-colors"
                >
                  Entrar
                </button>
              </div>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <div className="mb-10 min-h-[132px]">
                <button
                  type="button"
                  onClick={() => {
                    clearError();
                    setLocalError(null);
                    setStep(1);
                  }}
                  className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors text-sm mb-4 md:mb-6"
                >
                  ← Voltar
                </button>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-none">Seu perfil</h2>
                <p className="mt-3 md:mt-4 text-sm md:text-base text-zinc-400 leading-relaxed max-w-md">
                  Defina como você será visto dentro da plataforma.
                </p>
              </div>

              <form onSubmit={handleStep2Submit} className="space-y-5">
                {/* TIPO DE CONTA */}
                <div>
                  <label className="block text-sm text-zinc-400 mb-3">Tipo de conta</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setStep2((prev) => ({ ...prev, accountType: 'listener' }));
                        setFieldErrors((prev) => ({ ...prev, accountType: undefined }));
                      }}
                      className={`relative p-4 md:p-5 rounded-xl md:rounded-2xl border text-left transition-all ${
                        step2.accountType === 'listener'
                          ? 'border-red-600 bg-red-950/30'
                          : 'border-zinc-800 bg-[#111111] hover:border-zinc-700'
                      }`}
                    >
                      <span className="text-3xl block mb-3">🎧</span>
                      <span className="font-bold block">Ouvinte</span>
                      <span className="text-sm text-zinc-500 block mt-1 leading-relaxed">
                        Descubra artistas, siga comunidades e apoie música independente.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStep2((prev) => ({ ...prev, accountType: 'creator' }));
                        setFieldErrors((prev) => ({ ...prev, accountType: undefined }));
                      }}
                      className={`relative p-4 md:p-5 rounded-xl md:rounded-2xl border text-left transition-all ${
                        step2.accountType === 'creator'
                          ? 'border-red-600 bg-red-950/30'
                          : 'border-zinc-800 bg-[#111111] hover:border-zinc-700'
                      }`}
                    >
                      <span className="text-3xl block mb-3">🎸</span>
                      <span className="font-bold block">Artista / Produtor / Selo</span>
                      <span className="text-sm text-zinc-500 block mt-1 leading-relaxed">
                        Publique lançamentos, monetize e crie sua comunidade.
                      </span>
                    </button>
                  </div>
                  {fieldErrors.accountType && (
                    <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle size={12} /> {fieldErrors.accountType}
                    </p>
                  )}
                </div>

                {/* TIPO DE CRIADOR */}
                {isCreator && (
                  <div>
                    <label className="block text-sm text-zinc-400 mb-3">Perfil criador</label>
                    <div className="flex bg-[#111111] border border-zinc-800 rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => setStep2((prev) => ({ ...prev, creatorKind: 'user' }))}
                        className={`flex-1 h-11 rounded-lg text-sm font-medium transition-all ${
                          step2.creatorKind === 'user'
                            ? 'bg-red-600 text-white'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Usuário
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep2((prev) => ({ ...prev, creatorKind: 'band' }))}
                        className={`flex-1 h-11 rounded-lg text-sm font-medium transition-all ${
                          step2.creatorKind === 'band'
                            ? 'bg-red-600 text-white'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Banda / Selo
                      </button>
                    </div>
                  </div>
                )}

                {/* USERNAME */}
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Username *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">@</span>
                    <input
                      type="text"
                      name="username"
                      value={step2.username}
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '');
                        setStep2((prev) => ({ ...prev, username: val }));
                      }}
                      placeholder="seuusername"
                      required
                      maxLength={24}
                      className={`w-full bg-[#111111] border ${
                        fieldErrors.username ? 'border-red-500' : 'border-zinc-800 focus:border-red-600'
                      } focus:ring-4 focus:ring-red-900/40 transition-all rounded-xl pl-9 pr-4 py-4 outline-none`}
                    />
                  </div>
                  {fieldErrors.username ? (
                    <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle size={12} /> {fieldErrors.username}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-zinc-600">
                      Esse será seu endereço público na plataforma. Use letras minúsculas, números, _ ou .
                    </p>
                  )}
                </div>

                {/* NOME DE EXIBIÇÃO */}
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">{profileLabel} *</label>
                  <input
                    type="text"
                    name="displayName"
                    value={step2.displayName}
                    onChange={handleStep2Change}
                    placeholder={profilePlaceholder}
                    required
                    className={`w-full bg-[#111111] border ${
                      fieldErrors.displayName ? 'border-red-500' : 'border-zinc-800 focus:border-red-600'
                    } focus:ring-4 focus:ring-red-900/40 transition-all rounded-xl px-4 py-3 md:py-4 outline-none`}
                  />
                  {fieldErrors.displayName && (
                    <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle size={12} /> {fieldErrors.displayName}
                    </p>
                  )}
                </div>

                {/* TERMOS */}
                <div className="flex items-start gap-2 md:gap-3 pt-2">
                  <input
                    type="checkbox"
                    name="acceptedTerms"
                    checked={step2.acceptedTerms}
                    onChange={handleStep2Change}
                    className="mt-1 w-4 h-4 rounded border-zinc-700 bg-[#111111] text-red-600 focus:ring-red-600 focus:ring-offset-0"
                  />
                  <label className="text-sm text-zinc-400 leading-relaxed">
                    Li e concordo com os{' '}
                    <button type="button" className="text-red-400 hover:underline">
                      Termos de Uso
                    </button>{' '}
                    e{' '}
                    <button type="button" className="text-red-400 hover:underline">
                      Política de Privacidade
                    </button>
                  </label>
                </div>
                {fieldErrors.terms && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle size={12} /> {fieldErrors.terms}
                  </p>
                )}

                {displayError && (
                  <div className="bg-red-950/40 border border-red-800 text-red-300 text-sm rounded-xl p-4 flex items-start gap-2">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <span>{displayError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !isStep2Valid()}
                  className={`w-full h-12 md:h-14 rounded-xl font-bold text-base md:text-lg shadow-[0_0_30px_rgba(255,0,0,0.25)] transition-all flex items-center justify-center gap-2 ${
                    !isLoading && isStep2Valid()
                      ? 'bg-red-600 hover:bg-red-500'
                      : 'bg-red-800/40 cursor-not-allowed opacity-60'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    'Criar conta'
                  )}
                </button>
              </form>
            </>
          )}

          <div className="mt-8 md:mt-12 text-center text-xs text-zinc-600 leading-relaxed">
            The Experience Lab © 2026 — trabalhadores do mundo, uni-vos.
          </div>
        </div>
      </div>
    </div>
  );
}