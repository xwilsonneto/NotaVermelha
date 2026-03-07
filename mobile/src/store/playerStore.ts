// src/store/playerStore.ts
import { create } from 'zustand';
import { Track } from '../hooks/useMusicData';

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  position: number;
  volume: number;
  
  // Actions
  setCurrentTrack: (track: Track | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setPosition: (position: number) => void;
  setVolume: (volume: number) => void;
  reset: () => void;
}

/**
 * ✅ Store SIMPLIFICADO - apenas estado global
 * A lógica de play/pause fica no useMusicData hook
 */
export const usePlayerStore = create<PlayerState>((set) => ({
  currentTrack: null,
  isPlaying: false,
  position: 0,
  volume: 1.0,
  
  setCurrentTrack: (track) => set({ currentTrack: track }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPosition: (position) => set({ position }),
  setVolume: (volume) => set({ volume }),
  
  reset: () => set({ 
    currentTrack: null, 
    isPlaying: false,
    position: 0 
  }),
}));