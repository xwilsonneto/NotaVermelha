// app/store/playerStore.ts
import { create } from 'zustand';
import type { Track } from '../services/api';

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  currentIndex: number;
  isPlaying: boolean;

  play: (track: Track, queue?: Track[]) => void;
  setCurrentIndex: (index: number) => void;
  setIsPlaying: (v: boolean) => void;
  addToQueue: (track: Track) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  currentIndex: 0,
  isPlaying: false,

  play: (track, queue) => {
    const q = queue ?? [track];
    const idx = q.findIndex((t) => t._id === track._id);
    set({
      currentTrack: track,
      queue: q,
      currentIndex: idx >= 0 ? idx : 0,
      isPlaying: true,
    });
  },

  setCurrentIndex: (index) => {
    const { queue } = get();
    if (index < 0 || index >= queue.length) return;
    set({ currentIndex: index, currentTrack: queue[index], isPlaying: true });
  },

  setIsPlaying: (v) => set({ isPlaying: v }),

  addToQueue: (track) =>
    set((s) => ({ queue: [...s.queue, track] })),
}));