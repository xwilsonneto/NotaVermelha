// src/contexts/MusicDataContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { trackService, artistService, albumService, testConnection, ApiResponse, Track as ApiTrack } from '../services/api';
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
  likeCount?: number;
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
  getAlbumsByArtist: (artistId: string) => Album[];
  getTracksByAlbum: (albumId: string) => Track[];
  getFeaturedBands: (limit?: number) => Artist[];
  refresh: () => Promise<void>;
  testConnection: () => Promise<boolean>;
  seekTo: (seconds: number) => Promise<void>;
  // ─── Social ───────────────────────────────────────────────────────────────
  followArtist: (artistId: string) => Promise<void>;
  unfollowArtist: (artistId: string) => Promise<void>;
  checkFollowingArtist: (artistId: string) => Promise<boolean>;
  likeAlbum: (albumId: string) => Promise<void>;
  unlikeAlbum: (albumId: string) => Promise<void>;
  checkAlbumLiked: (albumId: string) => Promise<boolean>;
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

  const setPositionRef = useRef(playerStore.setPosition);
  setPositionRef.current = playerStore.setPosition;
  const setIsPlayingRef = useRef(playerStore.setIsPlaying);
  setIsPlayingRef.current = playerStore.setIsPlaying;
  const setCurrentTrackRef = useRef(playerStore.setCurrentTrack);
  setCurrentTrackRef.current = playerStore.setCurrentTrack;

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
      const isConnected = await testConnection();
      if (!isConnected) setError('API não está acessível. Verifique se o backend está rodando.');
      return isConnected;
    } catch (err) {
      setError('Não foi possível conectar à API. Verifique a rede.');
      return false;
    }
  }, []);

  const loadAllData = useCallback(async (): Promise<void> => {
    if (isLoadingRef.current) return;
    if (hasLoadedRef.current) return;

    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);

      const isConnected = await testAPIConnection();
      if (!isConnected) return;

      const result = await trackService.getAll();

      if (result.success && result.data) {
        const tracksData: Track[] = result.data;
        setTracks(tracksData);

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
      } else {
        setError(result.error || 'Erro ao carregar dados da API');
      }
    } catch (err: any) {
      setError(`Erro: ${err.message || 'Não foi possível conectar ao servidor'}`);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [testAPIConnection]);

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
      } catch (err) {
        console.warn('⚠️ Erro ao configurar áudio:', err);
      }
    };
    setupAudio();
    loadAllData();
    return () => {
      if (soundRef.current) soundRef.current.unloadAsync().catch(() => {});
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

  const playNextRef = useRef<() => Promise<void>>(async () => {});

  const playTrack = useCallback(async (track: Track): Promise<void> => {
    try {
      if (currentTrackRef.current?._id === track._id && isPlayingRef.current) return;

      setCurrentTrackRef.current(track);
      setPositionRef.current(0);
      setIsPlayingRef.current(true);

      trackService.registerPlay(track._id).catch(() => {});
      await unloadCurrentSound();

      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: track.audioUrl },
          { shouldPlay: true, volume: playerStore.volume || 1.0, isLooping: false }
        );

        soundRef.current = newSound;
        isLoadedRef.current = true;
        isPlaybackFinishedRef.current = false;

        newSound.setOnPlaybackStatusUpdate((status: any) => {
          if (!status.isLoaded) return;
          if (status.positionMillis !== undefined) {
            const newPosition = Math.floor(status.positionMillis / 1000);
            if (newPosition !== positionRef.current) setPositionRef.current(newPosition);
          }
          if (typeof status.isPlaying === 'boolean' && status.isPlaying !== isPlayingRef.current) {
            setIsPlayingRef.current(status.isPlaying);
          }
          if (status.didJustFinish && !isPlaybackFinishedRef.current) {
            isPlaybackFinishedRef.current = true;
            playNextRef.current().catch(() => {});
          }
        });

        setListeningHistory(prev => {
          const albumMap = new Map();
          if (track.album?._id) albumMap.set(track.album._id, track);
          prev.forEach(oldTrack => {
            const albumId = oldTrack.album?._id;
            if (albumId && !albumMap.has(albumId)) albumMap.set(albumId, oldTrack);
          });
          return Array.from(albumMap.values()).slice(0, 10);
        });

        setTracks(prev => prev.map(t =>
          t._id === track._id ? { ...t, playCount: (t.playCount || 0) + 1 } : t
        ));
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

  const pauseTrack = useCallback(async (): Promise<void> => {
    setIsPlayingRef.current(false);
    try {
      if (soundRef.current && isLoadedRef.current) await soundRef.current.pauseAsync();
    } catch (error: any) {
      console.error('❌ Erro ao pausar:', error.message);
    }
  }, []);

  const resumeTrack = useCallback(async (): Promise<void> => {
    setIsPlayingRef.current(true);
    try {
      if (soundRef.current && isLoadedRef.current) await soundRef.current.playAsync();
    } catch (error: any) {
      console.error('❌ Erro ao retomar:', error.message);
      setIsPlayingRef.current(false);
    }
  }, []);

  const togglePlayPause = useCallback(async (): Promise<void> => {
    if (!currentTrackRef.current) return;
    if (isPlayingRef.current) await pauseTrack();
    else await resumeTrack();
  }, [pauseTrack, resumeTrack]);

  const playNext = useCallback(async (): Promise<void> => {
    const current = currentTrackRef.current;
    const currentTracks = tracksRef.current;
    if (!current || currentTracks.length === 0) return;
    const currentIndex = currentTracks.findIndex(t => t._id === current._id);
    await playTrack(currentTracks[(currentIndex + 1) % currentTracks.length]);
  }, [playTrack]);

  const playPrevious = useCallback(async (): Promise<void> => {
    const current = currentTrackRef.current;
    const currentTracks = tracksRef.current;
    if (!current || currentTracks.length === 0) return;
    const currentIndex = currentTracks.findIndex(t => t._id === current._id);
    const prevIndex = currentIndex === 0 ? currentTracks.length - 1 : currentIndex - 1;
    await playTrack(currentTracks[prevIndex]);
  }, [playTrack]);

  const seekTo = useCallback(async (seconds: number): Promise<void> => {
    if (!soundRef.current || !isLoadedRef.current) return;
    try {
      await soundRef.current.setPositionAsync(seconds * 1000);
      setPositionRef.current(seconds);
    } catch (error) {
      console.error('❌ Erro ao buscar posição:', error);
    }
  }, []);

  playNextRef.current = playNext;

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const getPopularTracks = useCallback((limit = 6): Track[] =>
    [...tracksRef.current].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, limit),
  []);

  const getRecentTracks = useCallback((limit = 6): Track[] =>
    [...tracksRef.current].sort((a, b) =>
      new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
    ).slice(0, limit),
  []);

  const searchTracks = useCallback((query: string): Track[] => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return tracksRef.current.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.artists?.some(a => a.name?.toLowerCase().includes(q)) ||
      t.album?.title?.toLowerCase().includes(q)
    );
  }, []);

  const getTracksByArtist = useCallback((artistId: string): Track[] =>
    tracksRef.current.filter(t => t.artists?.some(a => a._id === artistId)),
  []);

  const getAlbumsByArtist = useCallback((artistId: string): Album[] => {
    const seen = new Set<string>();
    const result: Album[] = [];
    tracksRef.current.forEach(t => {
      if (t.artists?.some(a => a._id === artistId) && t.album?._id && !seen.has(t.album._id)) {
        seen.add(t.album._id);
        result.push(t.album);
      }
    });
    return result;
  }, []);

  const getTracksByAlbum = useCallback((albumId: string): Track[] =>
    tracksRef.current.filter(t => t.album?._id === albumId),
  []);

  const getFeaturedBands = useCallback((limit = 4): Artist[] =>
    [...artists].sort((a, b) => (b.monthlyListeners || 0) - (a.monthlyListeners || 0)).slice(0, limit),
  [artists]);

  const forceRefresh = useCallback(async (): Promise<void> => {
    hasLoadedRef.current = false;
    await loadAllData();
  }, [loadAllData]);

  // ─── Social: Follow / Unfollow Artist ─────────────────────────────────────
  const followArtist = useCallback(async (artistId: string): Promise<void> => {
    try {
      await artistService.follow(artistId);
      setArtists(prev => prev.map(a =>
        a._id === artistId
          ? { ...a, monthlyListeners: (a.monthlyListeners || 0) + 1 }
          : a
      ));
    } catch (err) {
      console.error('❌ Erro ao seguir artista:', err);
      throw err;
    }
  }, []);

  const unfollowArtist = useCallback(async (artistId: string): Promise<void> => {
    try {
      await artistService.unfollow(artistId);
      setArtists(prev => prev.map(a =>
        a._id === artistId
          ? { ...a, monthlyListeners: Math.max(0, (a.monthlyListeners || 0) - 1) }
          : a
      ));
    } catch (err) {
      console.error('❌ Erro ao deixar de seguir artista:', err);
      throw err;
    }
  }, []);

  const checkFollowingArtist = useCallback(async (artistId: string): Promise<boolean> => {
    try {
      return await artistService.checkFollowing(artistId);
    } catch (err) {
      console.error('❌ Erro ao verificar follow:', err);
      return false;
    }
  }, []);

  // ─── Social: Like / Unlike Album ──────────────────────────────────────────
  const likeAlbum = useCallback(async (albumId: string): Promise<void> => {
    try {
      await albumService.like(albumId);
      setAlbums(prev => prev.map(a =>
        a._id === albumId ? { ...a, likeCount: (a.likeCount || 0) + 1 } : a
      ));
    } catch (err) {
      console.error('❌ Erro ao curtir álbum:', err);
      throw err;
    }
  }, []);

  const unlikeAlbum = useCallback(async (albumId: string): Promise<void> => {
    try {
      await albumService.unlike(albumId);
      setAlbums(prev => prev.map(a =>
        a._id === albumId ? { ...a, likeCount: Math.max(0, (a.likeCount || 0) - 1) } : a
      ));
    } catch (err) {
      console.error('❌ Erro ao descurtir álbum:', err);
      throw err;
    }
  }, []);

  const checkAlbumLiked = useCallback(async (albumId: string): Promise<boolean> => {
    try {
      return await albumService.checkLike(albumId);
    } catch (err) {
      console.error('❌ Erro ao verificar like:', err);
      return false;
    }
  }, []);

  const value: MusicDataContextValue = {
    tracks,
    artists,
    albums,
    loading,
    error,
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
    getAlbumsByArtist,
    getTracksByAlbum,
    getFeaturedBands,
    refresh: forceRefresh,
    testConnection: testAPIConnection,
    seekTo,
    followArtist,
    unfollowArtist,
    checkFollowingArtist,
    likeAlbum,
    unlikeAlbum,
    checkAlbumLiked,
  };

  return (
    <MusicDataContext.Provider value={value}>
      {children}
    </MusicDataContext.Provider>
  );
};

export const useMusicData = (): MusicDataContextValue => {
  const context = useContext(MusicDataContext);
  if (!context) throw new Error('useMusicData deve ser usado dentro de MusicDataProvider');
  return context;
};
