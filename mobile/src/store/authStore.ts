import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';

interface User {
  id: string;
  _id?: string;
  username: string;
  name?: string;
  email: string;
  role: 'listener' | 'band' | 'artist' | 'label' | 'admin';
  avatar?: string;
  bandInfo?: {
    genre: string;
    city: string;
    bio: string;
  };
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  role: 'listener' | 'band';
  bandInfo?: {
    genre: string;
    city: string;
    bio: string;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(email, password);

          if (!response.success) {
            throw new Error(response.error || 'Erro ao fazer login');
          }

          const { user, token } = response.data;

          set({
            user: { ...user, id: user._id || user.id },
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({ isLoading: false, error: error.message || 'Erro ao fazer login' });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(data);

          if (!response.success) {
            throw new Error(response.error || 'Erro ao criar conta');
          }

          const { user, token } = response.data;

          set({
            user: { ...user, id: user._id || user.id },
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({ isLoading: false, error: error.message || 'Erro ao criar conta' });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Persiste apenas o essencial — isLoading/error são estado de sessão
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);