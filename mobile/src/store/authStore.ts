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
  artistId?: string; // ID do documento Artist vinculado (para bands/artists)
  likedTracks?: string[]; // IDs das tracks curtidas
  bandInfo?: {
    genre: string;
    city: string;
    bio: string;
    socialLinks?: {
      instagram?: string;
      spotify?: string;
      youtube?: string;
    };
  };
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  role: 'listener' | 'band';
  name?: string; // Nome de exibição
  avatar?: string; // URL do avatar (após upload)
  bandInfo?: {
    genre: string;
    city: string;
    bio: string;
    socialLinks?: {
      instagram?: string;
      spotify?: string;
      youtube?: string;
    };
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
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
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

      // Atualiza campos do usuário local sem precisar re-autenticar
      updateUser: (data: Partial<User>) => {
        const current = get().user;
        if (!current) return;
        set({ user: { ...current, ...data } });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
