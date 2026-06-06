// app/store/authStore.ts
// Correção principal: token salvo em cookie httpOnly-friendly via js-cookie
// para que o middleware do Next.js consiga ler na borda (edge).

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { authService } from '../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  // Flag de hidratação — essencial para evitar loop de redirect no Next.js
  _hasHydrated: boolean;

  login: (email: string, password: string) => Promise<boolean>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    username: string;
    accountType: string;
    creatorKind?: string;
    [key: string]: any;
  }) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  setHasHydrated: (v: boolean) => void;
}

// Storage customizado que sincroniza o token com cookies
// (localStorage = estado Zustand | cookie = leitura no middleware)
const cookieSyncStorage = {
  getItem: (name: string) => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(name);
  },
  setItem: (name: string, value: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(name, value);

    // Sincroniza o token no cookie para o middleware Next.js conseguir ler
    try {
      const parsed = JSON.parse(value);
      const token = parsed?.state?.token;
      if (token) {
        Cookies.set('auth-token', token, {
          expires: 7,       // 7 dias
          sameSite: 'Lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
        });
      } else {
        Cookies.remove('auth-token');
      }
    } catch {
      // ignora erros de parse
    }
  },
  removeItem: (name: string) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(name);
    Cookies.remove('auth-token');
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      _hasHydrated: false,

      setHasHydrated: (v) => set({ _hasHydrated: v }),

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(email, password);

          if (response.success && response.data?.token) {
            const { user, token } = response.data;
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return true;
          }

          set({
            isLoading: false,
            error: response.error ?? 'Credenciais inválidas',
          });
          return false;
        } catch (err: any) {
          set({
            isLoading: false,
            error: err.message ?? 'Erro de conexão',
          });
          return false;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(data);

          if (response.success && response.data?.token) {
            const { user, token } = response.data;
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return true;
          }

          set({
            isLoading: false,
            error: response.error ?? 'Erro ao criar conta',
          });
          return false;
        } catch (err: any) {
          set({
            isLoading: false,
            error: err.message ?? 'Erro de conexão',
          });
          return false;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
        // cookie removido pelo storage customizado via removeItem
        if (typeof window !== 'undefined') {
          Cookies.remove('auth-token');
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'nota-vermelha-auth',
      storage: createJSONStorage(() => cookieSyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      // Marca hidratação concluída — page.tsx aguarda isso antes de redirecionar
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);