// app/store/playerStore.ts
import { create } from 'zustand';
import type { Track } from '../services/api';

/** Fisher–Yates: retorna nova array embaralhada (não muta a original) */
function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  currentIndex: number;
  isPlaying: boolean;
  shuffle: boolean;

  play: (track: Track, queue?: Track[]) => void;
  setCurrentIndex: (index: number) => void;
  setIsPlaying: (v: boolean) => void;
  addToQueue: (track: Track) => void;
  setQueue: (queue: Track[]) => void;

  /** Ativa/desativa o modo aleatório.
   *  - Ativando: mantém a faixa atual e embaralha o que vem depois.
   *  - Desativando: usa `restoreQueue` (normalmente as faixas do álbum
   *    atual em ordem) para restaurar a fila. Se não for passado,
   *    apenas desliga a flag. */
  toggleShuffle: (restoreQueue?: Track[]) => void;

  /** Atalho: toca uma fila já embaralhada e ativa o shuffle */
  playShuffled: (tracks: Track[]) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  currentIndex: 0,
  isPlaying: false,
  shuffle: false,

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

  setQueue: (queue) => set({ queue }),

  toggleShuffle: (restoreQueue) => {
    const { shuffle, queue, currentIndex, currentTrack } = get();
    const nextShuffle = !shuffle;

    if (nextShuffle) {
      // ATIVANDO: preserva a faixa atual e o histórico antes dela,
      // embaralha apenas as próximas.
      const before = queue.slice(0, currentIndex + 1);
      const after = queue.slice(currentIndex + 1);
      set({
        shuffle: true,
        queue: [...before, ...shuffleArray(after)],
      });
      return;
    }

    // DESATIVANDO
    if (restoreQueue && restoreQueue.length > 0 && currentTrack) {
      const idx = restoreQueue.findIndex((t) => t._id === currentTrack._id);
      set({
        shuffle: false,
        queue: restoreQueue,
        currentIndex: idx >= 0 ? idx : 0,
      });
    } else {
      set({ shuffle: false });
    }
  },

  playShuffled: (tracks) => {
    if (tracks.length === 0) return;
    const shuffled = shuffleArray(tracks);
    set({
      currentTrack: shuffled[0],
      queue: shuffled,
      currentIndex: 0,
      isPlaying: true,
      shuffle: true,
    });
  },
}));