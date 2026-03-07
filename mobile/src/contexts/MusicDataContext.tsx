// src/contexts/MusicDataContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { trackService, testConnection, ApiResponse, Track as ApiTrack } from '../services/api';
import { usePlayerStore } from '../store/playerStore';

export interface Artist {
  _id: string;
  name: string;
  avatar: string;
  genre?: string[];
  monthlyListeners?: number;
  verified?: boolean;
}

export interface Album {
  _id: string;
  title: string;
  cover: string;
  releaseDate?: string;
  genre?: string[];
}

export interface Track {
  _id: string;
  title: string;
  artists: Artist[];
  album: Album;
  duration: number;
  audioUrl: string;
  coverUrl: string;
  playCount: number;
  likeCount: number;
  releaseDate: string;
  genre: string[];
  trackNumber: number;
}

interface MusicDataContextValue {
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
  loading: boolean;
  error: string | null;
  listeningHistory: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  playTrack: (track: Track) => Promise<void>;
  pauseTrack: () => Promise<void>;
  resumeTrack: () => Promise<void>;
  togglePlayPause: () => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  getPopularTracks: (limit?: number) => Track[];
  getRecentTracks: (limit?: number) => Track[];
  searchTracks: (query: string) => Track[];
  getTracksByArtist: (artistId: string) => Track[];
  getFeaturedBands: (limit?: number) => Artist[];
  refresh: () => Promise<void>;
  testConnection: () => Promise<boolean>;
  seekTo: (seconds: number) => Promise<void>;
}

const MusicDataContext = createContext<MusicDataContextValue | null>(null);

export const MusicDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [listeningHistory, setListeningHistory] = useState<Track[]>([]);

  const soundRef = useRef<Audio.Sound | null>(null);
  const isLoadedRef = useRef<boolean>(false);
  const isLoadingRef = useRef<boolean>(false);
  const hasLoadedRef = useRef<boolean>(false);
  const isPlaybackFinishedRef = useRef<boolean>(false);

  const playerStore = usePlayerStore();

  // Refs para funções do playerStore
  const setPositionRef = useRef(playerStore.setPosition);
  setPositionRef.current = playerStore.setPosition;
  
  const setIsPlayingRef = useRef(playerStore.setIsPlaying);
  setIsPlayingRef.current = playerStore.setIsPlaying;
  
  const setCurrentTrackRef = useRef(playerStore.setCurrentTrack);
  setCurrentTrackRef.current = playerStore.setCurrentTrack;

  // Refs para valores atuais
  const tracksRef = useRef<Track[]>(tracks);
  tracksRef.current = tracks;

  const currentTrackRef = useRef(playerStore.currentTrack);
  currentTrackRef.current = playerStore.currentTrack;

  const isPlayingRef = useRef(playerStore.isPlaying);
  isPlayingRef.current = playerStore.isPlaying;

  const positionRef = useRef(playerStore.position);
  positionRef.current = playerStore.position;

  const testAPIConnection = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🌐 Testando conexão com API...');
      const isConnected = await testConnection();
      if (!isConnected) {
        setError('API não está acessível. Verifique se o backend está rodando.');
      }
      return isConnected;
    } catch (err) {
      console.error('❌ Falha no teste de conexão:', err);
      setError('Não foi possível conectar à API. Verifique a rede.');
      return false;
    }
  }, []);

  const loadAllData = useCallback(async (): Promise<void> => {
    if (isLoadingRef.current) {
      console.log('⏸️ loadAllData já em andamento, ignorando...');
      return;
    }
    if (hasLoadedRef.current) {
      console.log('✅ Dados já carregados, pulando...');
      return;
    }

    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);

      const isConnected = await testAPIConnection();
      if (!isConnected) {
        return;
      }

      const result = await trackService.getAll();

      if (result.success && result.data) {
        const tracksData: Track[] = result.data;
        setTracks(tracksData);

        // Extrair artistas únicos
        const uniqueArtists: Artist[] = [];
        const artistIds = new Set<string>();
        tracksData.forEach((track) => {
          if (track.artists && Array.isArray(track.artists)) {
            track.artists.forEach((artist) => {
              if (artist && artist._id && !artistIds.has(artist._id)) {
                artistIds.add(artist._id);
                uniqueArtists.push(artist);
              }
            });
          }
        });
        setArtists(uniqueArtists);

        // Extrair álbuns únicos
        const uniqueAlbums: Album[] = [];
        const albumIds = new Set<string>();
        tracksData.forEach((track) => {
          if (track.album && track.album._id && !albumIds.has(track.album._id)) {
            albumIds.add(track.album._id);
            uniqueAlbums.push(track.album);
          }
        });
        setAlbums(uniqueAlbums);

        hasLoadedRef.current = true;
        console.log(`🎉 ${tracksData.length} músicas, ${uniqueArtists.length} artistas, ${uniqueAlbums.length} álbuns`);
      } else {
        setError(result.error || 'Erro ao carregar dados da API');
      }
    } catch (err: any) {
      console.error('💥 Erro em loadAllData:', err);
      setError(`Erro: ${err.message || 'Não foi possível conectar ao servidor'}`);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [testAPIConnection]);

  // Configuração inicial do áudio
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        console.log('✅ Áudio configurado com sucesso');
      } catch (err) {
        console.warn('⚠️ Erro ao configurar áudio:', err);
      }
    };

    setupAudio();
    loadAllData();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const unloadCurrentSound = useCallback(async () => {
    try {
      if (soundRef.current) {
        soundRef.current.setOnPlaybackStatusUpdate(null);
        await soundRef.current.stopAsync().catch(() => {});
        await soundRef.current.unloadAsync().catch(() => {});
      }
    } catch (err) {
      console.warn('⚠️ Erro ao descarregar som:', err);
    } finally {
      soundRef.current = null;
      isLoadedRef.current = false;
      isPlaybackFinishedRef.current = false;
    }
  }, []);

  // Ref para playNext
  const playNextRef = useRef<() => Promise<void>>(async () => {});

  const playTrack = useCallback(async (track: Track): Promise<void> => {
    try {
      console.log('🎵 playTrack:', track.title);

      // Se for a mesma música e já está tocando, não faz nada
      if (currentTrackRef.current?._id === track._id && isPlayingRef.current) {
        console.log('⏸️ Música já está tocando');
        return;
      }

      // ✅ 1. ATUALIZA UI IMEDIATAMENTE
      setCurrentTrackRef.current(track);
      setPositionRef.current(0);
      setIsPlayingRef.current(true);

      // ✅ 2. REGISTRA PLAY NO BACKEND (fire and forget)
      trackService.registerPlay(track._id).catch(err =>
        console.error('❌ Erro ao registrar play:', err)
      );

      // ✅ 3. DESCARREGA ÁUDIO ANTERIOR
      await unloadCurrentSound();

      // ✅ 4. CARREGA NOVO ÁUDIO
      try {
        console.log('🔊 Carregando áudio de:', track.audioUrl);
        
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: track.audioUrl },
          { 
            shouldPlay: true, 
            volume: playerStore.volume || 1.0, 
            isLooping: false 
          }
        );

        soundRef.current = newSound;
        isLoadedRef.current = true;
        isPlaybackFinishedRef.current = false;

        // ✅ 5. CALLBACK DE STATUS EM TEMPO REAL
        newSound.setOnPlaybackStatusUpdate((status: any) => {
          if (!status.isLoaded) return;

          // Atualiza posição (para a barra de progresso)
          if (status.positionMillis !== undefined) {
            const newPosition = Math.floor(status.positionMillis / 1000);
            if (newPosition !== positionRef.current) {
              setPositionRef.current(newPosition);
            }
          }

          // ✅ FIX: Sincroniza estado de play/pause INSTANTANEAMENTE
          if (typeof status.isPlaying === 'boolean' && status.isPlaying !== isPlayingRef.current) {
            console.log(`🔄 Status isPlaying mudou: ${status.isPlaying}`);
            setIsPlayingRef.current(status.isPlaying);
          }

          // Verifica se terminou
          if (status.didJustFinish && !isPlaybackFinishedRef.current) {
            console.log('⏭️ Música terminou, passando para próxima');
            isPlaybackFinishedRef.current = true;
            playNextRef.current().catch(e => console.warn('Erro playNext:', e));
          }
        });

        // ✅ 6. ATUALIZA HISTÓRICO - CORRIGIDO
        setListeningHistory(prev => {
          console.log('📝 Histórico anterior:', prev.map(t => ({ 
            title: t.title, 
            album: t.album?.title 
          })));
          
          // Filtra para manter apenas UMA música por álbum
          const albumMap = new Map();
          
          // Primeiro, adiciona a música atual no mapa
          if (track.album?._id) {
            albumMap.set(track.album._id, track);
          }
          
          // Depois, adiciona as músicas anteriores que são de álbuns diferentes
          prev.forEach(oldTrack => {
            const albumId = oldTrack.album?._id;
            if (albumId && !albumMap.has(albumId)) {
              albumMap.set(albumId, oldTrack);
            }
          });
          
          // Converte o mapa de volta para array e limita a 10 itens
          const newHistory = Array.from(albumMap.values()).slice(0, 10);
          
          console.log('📝 Histórico novo:', newHistory.map(t => ({ 
            title: t.title, 
            album: t.album?.title 
          })));
          
          return newHistory;
        });

        // ✅ 7. ATUALIZA CONTADOR LOCAL
        setTracks(prev => prev.map(t =>
          t._id === track._id ? { ...t, playCount: (t.playCount || 0) + 1 } : t
        ));

        console.log(`✅ Áudio carregado e tocando: ${track.title}`);

      } catch (audioError: any) {
        console.error('❌ Erro ao carregar áudio:', audioError.message);
        soundRef.current = null;
        isLoadedRef.current = false;
        setIsPlayingRef.current(false);
      }

    } catch (error: any) {
      console.error('💥 Erro geral no playTrack:', error.message);
      setIsPlayingRef.current(false);
    }
  }, [unloadCurrentSound, playerStore.volume]);

  // ✅ PAUSE - INSTANTÂNEO
  const pauseTrack = useCallback(async (): Promise<void> => {
    console.log('⏸️ Pausando música');
    setIsPlayingRef.current(false); // INSTANTÂNEO
    
    try {
      if (soundRef.current && isLoadedRef.current) {
        await soundRef.current.pauseAsync();
        console.log('✅ Música pausada');
      }
    } catch (error: any) {
      console.error('❌ Erro ao pausar:', error.message);
    }
  }, []);

  // ✅ RESUME - INSTANTÂNEO
  const resumeTrack = useCallback(async (): Promise<void> => {
    console.log('▶️ Retomando música');
    setIsPlayingRef.current(true); // INSTANTÂNEO
    
    try {
      if (soundRef.current && isLoadedRef.current) {
        await soundRef.current.playAsync();
        console.log('✅ Música retomada');
      }
    } catch (error: any) {
      console.error('❌ Erro ao retomar:', error.message);
      setIsPlayingRef.current(false); // Reverte se falhou
    }
  }, []);

  // ✅ TOGGLE - INSTANTÂNEO
  const togglePlayPause = useCallback(async (): Promise<void> => {
    if (!currentTrackRef.current) {
      console.log('❌ Nenhuma música selecionada');
      return;
    }
    
    if (isPlayingRef.current) {
      await pauseTrack();
    } else {
      await resumeTrack();
    }
  }, [pauseTrack, resumeTrack]);

  // ✅ PRÓXIMA MÚSICA
  const playNext = useCallback(async (): Promise<void> => {
    const current = currentTrackRef.current;
    const currentTracks = tracksRef.current;
    
    if (!current || currentTracks.length === 0) {
      console.log('❌ Não há próxima música');
      return;
    }
    
    const currentIndex = currentTracks.findIndex(t => t._id === current._id);
    const nextIndex = (currentIndex + 1) % currentTracks.length;
    
    console.log(`⏭️ Próxima música: ${currentTracks[nextIndex].title}`);
    await playTrack(currentTracks[nextIndex]);
  }, [playTrack]);

  // ✅ MÚSICA ANTERIOR
  const playPrevious = useCallback(async (): Promise<void> => {
    const current = currentTrackRef.current;
    const currentTracks = tracksRef.current;
    
    if (!current || currentTracks.length === 0) {
      console.log('❌ Não há música anterior');
      return;
    }
    
    const currentIndex = currentTracks.findIndex(t => t._id === current._id);
    const prevIndex = currentIndex === 0 ? currentTracks.length - 1 : currentIndex - 1;
    
    console.log(`⏮️ Música anterior: ${currentTracks[prevIndex].title}`);
    await playTrack(currentTracks[prevIndex]);
  }, [playTrack]);

  // ✅ SEEK TO POSITION
  const seekTo = useCallback(async (seconds: number): Promise<void> => {
    if (!soundRef.current || !isLoadedRef.current) return;
    
    try {
      const millis = seconds * 1000;
      await soundRef.current.setPositionAsync(millis);
      setPositionRef.current(seconds);
      console.log(`⏩ Seek para ${seconds}s`);
    } catch (error) {
      console.error('❌ Erro ao buscar posição:', error);
    }
  }, []);

  // Mantém a ref atualizada
  playNextRef.current = playNext;

  // Funções auxiliares
  const getPopularTracks = useCallback((limit: number = 6): Track[] => {
    return [...tracksRef.current]
      .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
      .slice(0, limit);
  }, []);

  const getRecentTracks = useCallback((limit: number = 6): Track[] => {
    return [...tracksRef.current]
      .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
      .slice(0, limit);
  }, []);

  const searchTracks = useCallback((query: string): Track[] => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return tracksRef.current.filter(track =>
      track.title.toLowerCase().includes(q) ||
      (track.artists && track.artists.some(a => a.name?.toLowerCase().includes(q))) ||
      (track.album?.title?.toLowerCase().includes(q))
    );
  }, []);

  const getTracksByArtist = useCallback((artistId: string): Track[] => {
    return tracksRef.current.filter(track =>
      track.artists && track.artists.some(a => a._id === artistId)
    );
  }, []);

  const getFeaturedBands = useCallback((limit: number = 4): Artist[] => {
    return [...artists]
      .sort((a, b) => (b.monthlyListeners || 0) - (a.monthlyListeners || 0))
      .slice(0, limit);
  }, [artists]);

  const forceRefresh = useCallback(async (): Promise<void> => {
    hasLoadedRef.current = false;
    await loadAllData();
  }, [loadAllData]);

  const value: MusicDataContextValue = {
    tracks,
    artists,
    albums,
    loading,
    error,
    // ✅ CORRIGIDO: Agora passa o listeningHistory completo
    listeningHistory,
    currentTrack: playerStore.currentTrack,
    isPlaying: playerStore.isPlaying,
    position: playerStore.position,
    duration: playerStore.currentTrack?.duration || 0,
    playTrack,
    pauseTrack,
    resumeTrack,
    togglePlayPause,
    playNext,
    playPrevious,
    getPopularTracks,
    getRecentTracks,
    searchTracks,
    getTracksByArtist,
    getFeaturedBands,
    refresh: forceRefresh,
    testConnection: testAPIConnection,
    seekTo,
  };

  return (
    <MusicDataContext.Provider value={value}>
      {children}
    </MusicDataContext.Provider>
  );
};

export const useMusicData = (): MusicDataContextValue => {
  const context = useContext(MusicDataContext);
  if (!context) {
    throw new Error('useMusicData deve ser usado dentro de MusicDataProvider');
  }
  return context;
};