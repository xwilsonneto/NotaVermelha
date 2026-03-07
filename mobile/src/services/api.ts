// src/services/api.ts
import Constants from 'expo-constants';
import { RegisterData } from '../store/authStore';

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

// ✅ DETECÇÃO AUTOMÁTICA: Pega o IP do Metro e usa a mesma rede
const getApiUrl = (): string => {
  const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];

  // Ignora domínios de túnel (exp.direct) — só usa IP local real
  if (debuggerHost && !debuggerHost.includes('exp.direct')) {
    console.log('🌐 IP detectado do Metro:', debuggerHost);
    return `http://${debuggerHost}:5000/api`;
  }

  const fallbackIp = '192.168.43.XXX'; // ⚠️ TROCAR PELO SEU IP
  console.warn('⚠️ Usando IP fallback:', fallbackIp);
  return `http://${fallbackIp}:5000/api`;
};

const API_URL = getApiUrl();

const TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;

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
      console.log(`🔄 Tentativa ${i + 1}/${retries + 1} para ${url}`);
      const response = await fetchWithTimeout(url, options);
      console.log(`✅ Sucesso na tentativa ${i + 1}`);
      return response;
    } catch (error: any) {
      lastError = error;
      console.warn(`⚠️ Tentativa ${i + 1} falhou:`, error.message);
      if (i < retries) {
        const delay = Math.min(1000 * Math.pow(2, i), 5000);
        console.log(`⏳ Aguardando ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError || new Error('Falha após múltiplas tentativas');
};

// ─── AUTH ──────────────────────────────────────────────────────────────────

export const authService = {
  login: async (email: string, password: string): Promise<ApiResponse<{ user: any; token: string }>> => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) return { success: false, data: null as any, error: data.error || 'Erro ao fazer login' };
      return data;
    } catch (error: any) {
      return { success: false, data: null as any, error: error.message || 'Erro de conexão' };
    }
  },

  register: async (registerData: RegisterData): Promise<ApiResponse<{ user: any; token: string }>> => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });
      const data = await response.json();
      if (!response.ok) return { success: false, data: null as any, error: data.error || 'Erro ao criar conta' };
      return data;
    } catch (error: any) {
      return { success: false, data: null as any, error: error.message || 'Erro de conexão' };
    }
  },
};

// ─── TRACKS ────────────────────────────────────────────────────────────────

export const trackService = {
  getAll: async (): Promise<ApiResponse<Track[]>> => {
    try {
      console.log('🔗 Buscando músicas de:', `${API_URL}/tracks`);
      const response = await fetchWithRetry(`${API_URL}/tracks`);
      if (!response.ok) {
        console.error('❌ Status HTTP:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ApiResponse<Track[]> = await response.json();
      console.log('✅ Músicas recebidas:', data.count);
      if (data.data && data.data.length > 0) {
        console.log('🎵 Primeira música:', data.data[0].title);
        console.log('🔊 URL do áudio:', data.data[0].audioUrl.substring(0, 50) + '...');
      }
      return data;
    } catch (error: any) {
      console.error('❌ Erro ao buscar músicas:', error);
      return { success: false, data: [], error: error.message || 'Erro desconhecido ao buscar músicas' };
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

  // ✅ Registra play — público, sem token
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
      console.error('❌ Erro ao registrar play:', error);
      return { success: false, data: null as any };
    }
  },

  // ✅ Like — requer token
  like: async (trackId: string, token: string): Promise<ApiResponse<{ likeCount: number }>> => {
    try {
      const response = await fetchWithTimeout(
        `${API_URL}/tracks/${trackId}/like`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
        5000
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error: any) {
      console.error('❌ Erro ao dar like:', error);
      return { success: false, data: null as any };
    }
  },

  // ✅ Unlike — requer token
  unlike: async (trackId: string, token: string): Promise<ApiResponse<{ likeCount: number }>> => {
    try {
      const response = await fetchWithTimeout(
        `${API_URL}/tracks/${trackId}/like`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
        5000
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error: any) {
      console.error('❌ Erro ao remover like:', error);
      return { success: false, data: null as any };
    }
  },
};

// ─── UTILS ─────────────────────────────────────────────────────────────────

export const testConnection = async (): Promise<boolean> => {
  try {
    console.log('🏥 Testando endpoint de health:', `${API_URL}/health`);
    console.log('📡 URL da API sendo usada:', API_URL);
    const response = await fetchWithTimeout(`${API_URL}/health`, {}, 10000);
    if (!response.ok) { console.error('❌ Health check falhou com status:', response.status); return false; }
    const data = await response.json();
    console.log('✅ API Health:', data);
    return true;
  } catch (error: any) {
    console.error('❌ API não acessível:', error.message);
    console.error('📍 URL tentada:', API_URL);
    if (error.message.includes('timeout')) {
      console.error('💡 Servidor não respondeu a tempo. Verifique se:');
      console.error('   1. O backend está RODANDO (npm start)');
      console.error('   2. O IP está CORRETO');
    } else if (error.message.includes('Network request failed')) {
      console.error('💡 Falha na rede. Verifique:');
      console.error('   1. Backend rodando na porta 5000');
      console.error('   2. Ambos na MESMA rede Wi-Fi');
      console.error('   3. IP correto:', API_URL);
      console.error('   4. Firewall não bloqueando');
    }
    return false;
  }
};

export const testAudioUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetchWithTimeout(url, { method: 'HEAD' }, 3000);
    return response.ok;
  } catch {
    console.error('❌ URL de áudio inacessível:', url);
    return false;
  }
};

export const getApiConfig = () => ({
  baseUrl: API_URL,
  timeout: TIMEOUT_MS,
  maxRetries: MAX_RETRIES,
});