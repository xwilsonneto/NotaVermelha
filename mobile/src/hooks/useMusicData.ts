// src/hooks/useMusicData.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { trackService, testConnection } from '../services/api';
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

export const useMusicData = () => {
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
  const positionUpdateRef = useRef<NodeJS.Timeout | null>(null);

  const playerStore = usePlayerStore();

  // ✅ FIX: Usar ref para o playerStore.setPosition evitar que playerStore
  // entre nas dependências e cause re-renders em cadeia
  const setPositionRef = useRef(playerStore.setPosition);
  setPositionRef.current = playerStore.setPosition;

  // ✅ FIX: stopPositionUpdates sem nenhuma dependência — só usa refs
  const stopPositionUpdates = useCallback(() => {
    if (positionUpdateRef.current) {
      clearInterval(positionUpdateRef.current);
      positionUpdateRef.current = null;
    }
  }, []); // sem dependências — seguro para usar no useEffect

  // ✅ FIX: startPositionUpdates também usa ref para setPosition
  const startPositionUpdates = useCallback(() => {
    if (positionUpdateRef.current) {
      clearInterval(positionUpdateRef.current);
    }

    positionUpdateRef.current = setInterval(async () => {
      try {
        if (soundRef.current && isLoadedRef.current) {
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded && status.positionMillis !== undefined) {
            const positionInSeconds = Math.floor(status.positionMillis / 1000);
            setPositionRef.current(positionInSeconds);
          }
        }
      } catch (err) {
        console.warn('⚠️  Erro ao atualizar posição:', err);
      }
    }, 500);
  }, []); // sem dependências — seguro

  const testAPIConnection = async (): Promise<boolean> => {
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
  };

  const loadAllData = async (): Promise<void> => {
    if (isLoadingRef.current) {
      console.log('⏸️ loadAllData já em andamento, ignorando...');
      return;
    }

    if (hasLoadedRef.current) {
      console.log('✅ Dados já carregados anteriormente, pulando...');
      return;
    }

    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);

      console.log('🔄 loadAllData iniciado...');

      const isConnected = await testAPIConnection();
      if (!isConnected) {
        setLoading(false);
        isLoadingRef.current = false;
        return;
      }

      console.log('📡 Buscando dados da API...');
      const result = await trackService.getAll();
      console.log('📦 Resultado recebido:', result.success ? 'sucesso' : 'erro');

      if (result.success) {
        const tracksData: Track[] = result.data;
        console.log(`✅ ${tracksData.length} músicas recebidas`);
        setTracks(tracksData);

        const uniqueArtists: Artist[] = [];
        const artistIds = new Set<string>();

        tracksData.forEach((track: Track) => {
          track.artists?.forEach((artist: Artist) => {
            if (!artistIds.has(artist._id)) {
              artistIds.add(artist._id);
              uniqueArtists.push(artist);
            }
          });
        });

        setArtists(uniqueArtists);

        const uniqueAlbums: Album[] = [];
        const albumIds = new Set<string>();

        tracksData.forEach((track: Track) => {
          if (track.album && !albumIds.has(track.album._id)) {
            albumIds.add(track.album._id);
            uniqueAlbums.push(track.album);
          }
        });

        setAlbums(uniqueAlbums);

        hasLoadedRef.current = true;

        console.log(`🎉 Dados carregados: ${tracksData.length} músicas, ${uniqueArtists.length} artistas, ${uniqueAlbums.length} álbuns`);
      } else {
        console.error('❌ API retornou erro:', result.error);
        setError(result.error || 'Erro ao carregar dados da API');
      }
    } catch (err: any) {
      console.error('💥 Erro em loadAllData:', err);
      if (err.message?.includes('Network request failed')) {
        setError('Falha na rede. Verifique: 1) Backend rodando 2) Mesma rede Wi-Fi 3) Firewall desativado');
      } else {
        setError(`Erro: ${err.message || 'Não foi possível conectar ao servidor'}`);
      }
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
      console.log('🏁 loadAllData finalizado');
    }
  };

  // ✅ FIX: Array de dependências VAZIO — stopPositionUpdates não entra mais aqui.
  // O cleanup usa a ref diretamente para evitar o loop.
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch(err => console.warn('⚠️  Config Audio falhou:', err));

    loadAllData();

    return () => {
      console.log('🧹 Cleanup useMusicData');
      // ✅ FIX: Limpar interval diretamente via ref, sem depender de nenhuma função
      if (positionUpdateRef.current) {
        clearInterval(positionUpdateRef.current);
        positionUpdateRef.current = null;
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []); // ✅ Array verdadeiramente vazio — executa só na montagem

  const unloadCurrentSound = async () => {
    try {
      stopPositionUpdates();
      if (soundRef.current) {
        console.log('🔇 Descarregando som atual...');
        await soundRef.current.stopAsync().catch(() => {});
        await soundRef.current.unloadAsync().catch(() => {});
      }
    } catch (err) {
      console.warn('⚠️  Erro ao descarregar som:', err);
    } finally {
      soundRef.current = null;
      isLoadedRef.current = false;
    }
  };

  const playTrack = async (track: Track): Promise<void> => {
    try {
      console.log('🎵 Iniciando playTrack para:', track.title);
      console.log('🔗 URL:', track.audioUrl);

      playerStore.setCurrentTrack(track);
      playerStore.setPosition(0);
      playerStore.setIsPlaying(true);

      trackService.registerPlay(track._id).catch(err =>
        console.log('📝 Play não registrado:', err?.message || err)
      );

      await unloadCurrentSound();

      try {
        console.log('⏳ Carregando áudio...');
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: track.audioUrl },
          {
            shouldPlay: true,
            volume: playerStore.volume || 1.0,
            isLooping: false,
          }
        );

        soundRef.current = newSound;
        isLoadedRef.current = true;

        newSound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.isLoaded) {
            if (status.positionMillis !== undefined) {
              const positionInSeconds = Math.floor(status.positionMillis / 1000);
              setPositionRef.current(positionInSeconds);
            }

            if (status.didJustFinish) {
              console.log('⏭️  Música finalizada, próxima...');
              playNext().catch((e) => console.warn('Erro playNext:', e));
            }
          }
        });

        console.log('✅ Áudio carregado!');
        startPositionUpdates();
      } catch (audioError) {
        console.error('❌ Erro ao carregar áudio:', audioError);
        soundRef.current = null;
        isLoadedRef.current = false;
      }

      setListeningHistory(prev => {
        const filtered = prev.filter(t => t._id !== track._id);
        return [track, ...filtered].slice(0, 10);
      });

      setTracks(prev => prev.map(t =>
        t._id === track._id ? { ...t, playCount: (t.playCount || 0) + 1 } : t
      ));

    } catch (error) {
      console.error('💥 Erro geral no playTrack:', error);
      playerStore.setCurrentTrack(track);
      playerStore.setIsPlaying(false);
    }
  };

  const pauseTrack = async (): Promise<void> => {
    try {
      if (soundRef.current && isLoadedRef.current) {
        await soundRef.current.pauseAsync();
      }
      playerStore.setIsPlaying(false);
      stopPositionUpdates();
    } catch (error) {
      console.error('Erro ao pausar:', error);
      playerStore.setIsPlaying(false);
    }
  };

  const resumeTrack = async (): Promise<void> => {
    try {
      if (soundRef.current && isLoadedRef.current) {
        await soundRef.current.playAsync();
      }
      playerStore.setIsPlaying(true);
      startPositionUpdates();
    } catch (error) {
      console.error('Erro ao retomar:', error);
      playerStore.setIsPlaying(true);
    }
  };

  const togglePlayPause = async (): Promise<void> => {
    if (!playerStore.currentTrack) return;

    if (playerStore.isPlaying) {
      await pauseTrack();
    } else {
      await resumeTrack();
    }
  };

  const playNext = async (): Promise<void> => {
    if (!playerStore.currentTrack || tracks.length === 0) return;

    const currentIndex = tracks.findIndex(t => t._id === playerStore.currentTrack!._id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    await playTrack(tracks[nextIndex]);
  };

  const playPrevious = async (): Promise<void> => {
    if (!playerStore.currentTrack || tracks.length === 0) return;

    const currentIndex = tracks.findIndex(t => t._id === playerStore.currentTrack!._id);
    const prevIndex = currentIndex === 0 ? tracks.length - 1 : currentIndex - 1;
    await playTrack(tracks[prevIndex]);
  };

  const getPopularTracks = (limit: number = 6): Track[] => {
    return [...tracks]
      .sort((a: Track, b: Track) => b.playCount - a.playCount)
      .slice(0, limit);
  };

  const getRecentTracks = (limit: number = 6): Track[] => {
    return [...tracks]
      .sort((a: Track, b: Track) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
      .slice(0, limit);
  };

  const getListeningHistory = (): Track[] => {
    return listeningHistory.slice(0, 3);
  };

  const searchTracks = (query: string): Track[] => {
    if (!query.trim()) return [];

    return tracks.filter((track: Track) =>
      track.title.toLowerCase().includes(query.toLowerCase()) ||
      track.artists.some((artist: Artist) =>
        artist.name.toLowerCase().includes(query.toLowerCase())
      ) ||
      track.album?.title.toLowerCase().includes(query.toLowerCase())
    );
  };

  const getTracksByArtist = (artistId: string): Track[] => {
    return tracks.filter((track: Track) =>
      track.artists.some((artist: Artist) => artist._id === artistId)
    );
  };

  const getFeaturedBands = (limit: number = 4): Artist[] => {
    return [...artists]
      .sort((a: Artist, b: Artist) => (b.monthlyListeners || 0) - (a.monthlyListeners || 0))
      .slice(0, limit);
  };

  const forceRefresh = async (): Promise<void> => {
    hasLoadedRef.current = false;
    await loadAllData();
  };

  return {
    tracks,
    artists,
    albums,
    loading,
    error,
    listeningHistory: getListeningHistory(),

    currentTrack: playerStore.currentTrack,
    isPlaying: playerStore.isPlaying,
    position: playerStore.position,

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
  };
};