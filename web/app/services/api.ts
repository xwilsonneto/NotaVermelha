// src/services/api.ts  — versão Web (Next.js)
// Adaptado do mobile: remove lógica de IP do Expo, usa NEXT_PUBLIC_API_URL

export interface ApiResponse<T = any> {
  success: boolean;
  count?: number;
  data: T;
  error?: string;
}

export interface Track {
  _id: string;
  title: string;
  artists: any[];
  album: any;
  duration: number;
  audioUrl: string;
  coverUrl: string;
  playCount: number;
  likeCount: number;
  releaseDate: string;
  genre: string[];
  trackNumber: number;
}

// ─── CONFIG ────────────────────────────────────────────────────────────────
// No .env.local da web: NEXT_PUBLIC_API_URL=http://localhost:5000/api

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

const TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;

// ─── HELPERS ───────────────────────────────────────────────────────────────

const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout: number = TIMEOUT_MS
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') throw new Error(`Request timeout após ${timeout}ms`);
    throw error;
  }
};

const fetchWithRetry = async (
  url: string,
  options: RequestInit = {},
  retries: number = MAX_RETRIES
): Promise<Response> => {
  let lastError: Error | null = null;
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetchWithTimeout(url, options);
      return response;
    } catch (error: any) {
      lastError = error;
      if (i < retries) {
        const delay = Math.min(1000 * Math.pow(2, i), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError ?? new Error('Falha após múltiplas tentativas');
};

// Lê o token do Zustand sem criar dependência circular
// (authStore importa api.ts, então api.ts NÃO importa authStore)
// Em vez disso, funções que precisam de token recebem o token como parâmetro.
const authHeader = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

// ─── AUTH ──────────────────────────────────────────────────────────────────

export const authService = {
  login: async (
    email: string,
    password: string
  ): Promise<ApiResponse<{ user: any; token: string }>> => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok)
        return { success: false, data: null as any, error: data.error ?? 'Erro ao fazer login' };
      return data;
    } catch (error: any) {
      return { success: false, data: null as any, error: error.message ?? 'Erro de conexão' };
    }
  },

  register: async (registerData: {
    name: string;
    email: string;
    password: string;
    [key: string]: any;
  }): Promise<ApiResponse<{ user: any; token: string }>> => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });
      const data = await response.json();
      if (!response.ok)
        return { success: false, data: null as any, error: data.error ?? 'Erro ao criar conta' };
      return data;
    } catch (error: any) {
      return { success: false, data: null as any, error: error.message ?? 'Erro de conexão' };
    }
  },
};

// ─── TRACKS ────────────────────────────────────────────────────────────────

export const trackService = {
  getAll: async (): Promise<ApiResponse<Track[]>> => {
    try {
      const response = await fetchWithRetry(`${API_URL}/tracks`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error: any) {
      return { success: false, data: [], error: error.message ?? 'Erro ao buscar músicas' };
    }
  },

  getById: async (id: string): Promise<ApiResponse<Track>> => {
    try {
      const response = await fetchWithRetry(`${API_URL}/tracks/${id}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null as any, error: error.message };
    }
  },

  registerPlay: async (trackId: string): Promise<ApiResponse<{ playCount: number }>> => {
    try {
      const response = await fetchWithTimeout(
        `${API_URL}/tracks/${trackId}/play`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } },
        5000
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null as any };
    }
  },

  like: async (trackId: string, token: string): Promise<ApiResponse<{ likeCount: number }>> => {
    try {
      const response = await fetchWithTimeout(
        `${API_URL}/tracks/${trackId}/like`,
        { method: 'POST', headers: authHeader(token) },
        5000
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null as any };
    }
  },

  unlike: async (trackId: string, token: string): Promise<ApiResponse<{ likeCount: number }>> => {
    try {
      const response = await fetchWithTimeout(
        `${API_URL}/tracks/${trackId}/like`,
        { method: 'DELETE', headers: authHeader(token) },
        5000
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null as any };
    }
  },
};

// ─── ARTISTS ───────────────────────────────────────────────────────────────

export const artistService = {
  follow: async (artistId: string, token: string): Promise<void> => {
    const res = await fetch(`${API_URL}/artists/${artistId}/follow`, {
      method: 'POST',
      headers: authHeader(token),
    });
    if (!res.ok) throw new Error('Erro ao seguir artista');
  },

  unfollow: async (artistId: string, token: string): Promise<void> => {
    const res = await fetch(`${API_URL}/artists/${artistId}/follow`, {
      method: 'DELETE',
      headers: authHeader(token),
    });
    if (!res.ok) throw new Error('Erro ao deixar de seguir artista');
  },

  checkFollowing: async (artistId: string, token: string): Promise<boolean> => {
    const res = await fetch(`${API_URL}/artists/${artistId}/following`, {
      method: 'GET',
      headers: authHeader(token),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.isFollowing ?? false;
  },
};

// ─── ALBUMS ────────────────────────────────────────────────────────────────

export const albumService = {
  like: async (albumId: string, token: string): Promise<void> => {
    const res = await fetch(`${API_URL}/albums/${albumId}/like`, {
      method: 'POST',
      headers: authHeader(token),
    });
    if (!res.ok) throw new Error('Erro ao curtir álbum');
  },

  unlike: async (albumId: string, token: string): Promise<void> => {
    const res = await fetch(`${API_URL}/albums/${albumId}/like`, {
      method: 'DELETE',
      headers: authHeader(token),
    });
    if (!res.ok) throw new Error('Erro ao descurtir álbum');
  },

  checkLike: async (albumId: string, token: string): Promise<boolean> => {
    const res = await fetch(`${API_URL}/albums/${albumId}/like`, {
      method: 'GET',
      headers: authHeader(token),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.liked ?? false;
  },
};

// ─── UTILS ─────────────────────────────────────────────────────────────────

export const testConnection = async (): Promise<boolean> => {
  try {
    const response = await fetchWithTimeout(`${API_URL}/health`, {}, 10000);
    return response.ok;
  } catch {
    return false;
  }
};

export const getApiConfig = () => ({
  baseUrl: API_URL,
  timeout: TIMEOUT_MS,
  maxRetries: MAX_RETRIES,
});