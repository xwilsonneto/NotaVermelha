// src/contexts/MusicPlayerContext.tsx
import React, { createContext, useContext, useRef, useCallback, useMemo } from 'react';
import { Audio } from 'expo-av';
import { trackService } from '../services/api';
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

interface MusicPlayerContextValue {
  currentTrack: Track | null;
  isPlaying: boolean;
  position: number;
  duration: number;

  playTrack: (track: Track, allTracks?: Track[]) => Promise<void>;
  pauseTrack: () => Promise<void>;
  resumeTrack: () => Promise<void>;
  togglePlayPause: () => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  onTrackPlayed?: (track: Track) => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(null);

export const MusicPlayerProvider: React.FC<{
  children: React.ReactNode;
  onTrackPlayed?: (track: Track) => void;
}> = ({ children, onTrackPlayed }) => {
  const soundRef = useRef<Audio.Sound | null>(null);
  const isLoadedRef = useRef<boolean>(false);
  const isPlaybackFinishedRef = useRef<boolean>(false);

  // Internal queue — updated when playTrack receives allTracks
  const queueRef = useRef<Track[]>([]);

  // ✅ Subscribe to each field individually — triggers re-render when they change
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const isPlaying    = usePlayerStore(s => s.isPlaying);
  const position     = usePlayerStore(s => s.position);
  const volume       = usePlayerStore(s => s.volume ?? 1.0);

  // Actions never change — safe to read once
  const setCurrentTrackFn = usePlayerStore(s => s.setCurrentTrack);
  const setIsPlayingFn    = usePlayerStore(s => s.setIsPlaying);
  const setPositionFn     = usePlayerStore(s => s.setPosition);

  // Stable refs for use inside async callbacks (no stale closure)
  const setPosition     = useRef(setPositionFn);
  setPosition.current   = setPositionFn;
  const setIsPlaying    = useRef(setIsPlayingFn);
  setIsPlaying.current  = setIsPlayingFn;
  const setCurrentTrack = useRef(setCurrentTrackFn);
  setCurrentTrack.current = setCurrentTrackFn;

  const currentTrackRef = useRef(currentTrack);
  currentTrackRef.current = currentTrack;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const positionRef = useRef(position);
  positionRef.current = position;
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  // Forward ref so playNext can be referenced inside playTrack's closure
  const playNextRef = useRef<() => Promise<void>>(async () => {});

  const unloadCurrentSound = useCallback(async () => {
    try {
      if (soundRef.current) {
        soundRef.current.setOnPlaybackStatusUpdate(null);
        await soundRef.current.stopAsync().catch(() => {});
        await soundRef.current.unloadAsync().catch(() => {});
      }
    } catch {
      // silence
    } finally {
      soundRef.current = null;
      isLoadedRef.current = false;
      isPlaybackFinishedRef.current = false;
    }
  }, []);

  const playTrack = useCallback(async (track: Track, allTracks?: Track[]): Promise<void> => {
    // Update queue if provided
    if (allTracks && allTracks.length > 0) queueRef.current = allTracks;

    // Already playing this track — no-op
    if (currentTrackRef.current?._id === track._id && isPlayingRef.current) return;

    setCurrentTrack.current(track);
    setPosition.current(0);
    setIsPlaying.current(true);

    // Fire-and-forget side effects
    trackService.registerPlay(track._id).catch(() => {});
    onTrackPlayed?.(track);

    await unloadCurrentSound();

    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: track.audioUrl },
        { shouldPlay: true, volume: volumeRef.current, isLooping: false }
      );

      soundRef.current = newSound;
      isLoadedRef.current = true;
      isPlaybackFinishedRef.current = false;

      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (!status.isLoaded) return;

        if (status.positionMillis !== undefined) {
          const newPos = Math.floor(status.positionMillis / 1000);
          if (newPos !== positionRef.current) setPosition.current(newPos);
        }

        if (typeof status.isPlaying === 'boolean' && status.isPlaying !== isPlayingRef.current) {
          setIsPlaying.current(status.isPlaying);
        }

        if (status.didJustFinish && !isPlaybackFinishedRef.current) {
          isPlaybackFinishedRef.current = true;
          playNextRef.current().catch(() => {});
        }
      });
    } catch (audioError: any) {
      console.error('❌ Erro ao carregar áudio:', audioError.message);
      soundRef.current = null;
      isLoadedRef.current = false;
      setIsPlaying.current(false);
    }
  }, [unloadCurrentSound, onTrackPlayed]);

  const pauseTrack = useCallback(async (): Promise<void> => {
    setIsPlaying.current(false);
    try {
      if (soundRef.current && isLoadedRef.current) await soundRef.current.pauseAsync();
    } catch (e: any) {
      console.error('❌ Erro ao pausar:', e.message);
    }
  }, []);

  const resumeTrack = useCallback(async (): Promise<void> => {
    setIsPlaying.current(true);
    try {
      if (soundRef.current && isLoadedRef.current) await soundRef.current.playAsync();
    } catch (e: any) {
      console.error('❌ Erro ao retomar:', e.message);
      setIsPlaying.current(false);
    }
  }, []);

  // Stable refs so togglePlayPause has empty deps
  const pauseRef = useRef(pauseTrack);
  pauseRef.current = pauseTrack;
  const resumeRef = useRef(resumeTrack);
  resumeRef.current = resumeTrack;

  const togglePlayPause = useCallback(async (): Promise<void> => {
    if (!currentTrackRef.current) return;
    if (isPlayingRef.current) await pauseRef.current();
    else await resumeRef.current();
  }, []); // truly stable — no deps needed

  const playNext = useCallback(async (): Promise<void> => {
    const current = currentTrackRef.current;
    const queue = queueRef.current;
    if (!current || queue.length === 0) return;
    const idx = queue.findIndex(t => t._id === current._id);
    await playTrack(queue[(idx + 1) % queue.length]);
  }, [playTrack]);

  const playPrevious = useCallback(async (): Promise<void> => {
    const current = currentTrackRef.current;
    const queue = queueRef.current;
    if (!current || queue.length === 0) return;
    const idx = queue.findIndex(t => t._id === current._id);
    const prevIdx = idx === 0 ? queue.length - 1 : idx - 1;
    await playTrack(queue[prevIdx]);
  }, [playTrack]);

  const seekTo = useCallback(async (seconds: number): Promise<void> => {
    if (!soundRef.current || !isLoadedRef.current) return;
    try {
      await soundRef.current.setPositionAsync(seconds * 1000);
      setPosition.current(seconds);
    } catch (e) {
      console.error('❌ Erro ao buscar posição:', e);
    }
  }, []);

  // Keep playNextRef in sync
  playNextRef.current = playNext;

  const value = useMemo<MusicPlayerContextValue>(() => ({
    currentTrack,
    isPlaying,
    position,
    duration: currentTrack?.duration ?? 0,
    playTrack,
    pauseTrack,
    resumeTrack,
    togglePlayPause,
    playNext,
    playPrevious,
    seekTo,
  }), [
    currentTrack,
    isPlaying,
    position,
    playTrack,
    pauseTrack,
    resumeTrack,
    togglePlayPause,
    playNext,
    playPrevious,
    seekTo,
  ]);

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = (): MusicPlayerContextValue => {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) throw new Error('useMusicPlayer deve ser usado dentro de MusicPlayerProvider');
  return ctx;
};
