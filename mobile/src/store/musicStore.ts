import { create } from 'zustand';
import { Audio } from 'expo-av';
import { Music } from '../types/music';
import { musicLibrary } from '../data/musicData';

interface MusicState {
  currentMusic: Music | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  playlist: Music[];
  featuredBands: { artist: string; songs: Music[] }[];
  audioRef: Audio.Sound | null;
  isInitialized: boolean;
  soundCache: Map<string, Audio.Sound>;
  listeningHistory: Music[]; // ✅ HISTÓRICO ADICIONADO

  // Ações
  initializeMusic: () => void;
  playMusic: (music: Music) => Promise<void>;
  pauseMusic: () => Promise<void>;
  resumeMusic: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  playNext: () => void;
  playPrevious: () => void;
  togglePlayPause: () => Promise<void>;
  preloadMusic: (music: Music) => Promise<void>;
  preloadAllMusic: () => Promise<void>;
  addToHistory: (music: Music) => void; // ✅ AÇÃO ADICIONADA
}

export const useMusicStore = create<MusicState>((set, get) => ({
  currentMusic: null,
  isPlaying: false,
  position: 0,
  duration: 0,
  playlist: [],
  featuredBands: [],
  audioRef: null,
  isInitialized: false,
  soundCache: new Map(),
  listeningHistory: [], // ✅ INICIALIZADO

  initializeMusic: () => {
    const artistsMap: { [key: string]: Music[] } = {};
    musicLibrary.forEach(music => {
      if (!artistsMap[music.artist]) artistsMap[music.artist] = [];
      artistsMap[music.artist].push(music);
    });

    const featuredBands = Object.entries(artistsMap)
      .map(([artist, songs]) => ({ artist, songs }))
      .slice(0, 3);

    set({
      playlist: musicLibrary,
      featuredBands,
      isInitialized: true,
    });

    get().preloadAllMusic();
  },

  preloadMusic: async (music: Music) => {
    try {
      const { soundCache } = get();
      
      if (soundCache.has(music.id)) {
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        music.file,
        { shouldPlay: false }
      );

      soundCache.set(music.id, sound);
      set({ soundCache: new Map(soundCache) });

    } catch (error) {
      console.error(`Erro ao pré-carregar música ${music.title}:`, error);
    }
  },

  preloadAllMusic: async () => {
    const { playlist, preloadMusic } = get();
    const preloadPromises = playlist.map(music => preloadMusic(music));
    await Promise.all(preloadPromises);
    console.log('Todas as músicas pré-carregadas!');
  },

  playMusic: async (music: Music) => {
    try {
      const { currentMusic, isPlaying, audioRef, soundCache, addToHistory } = get();

      if (isPlaying && audioRef) {
        await audioRef.stopAsync();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      let sound: Audio.Sound;

      if (soundCache.has(music.id)) {
        sound = soundCache.get(music.id)!;
        await sound.setPositionAsync(0);
        await sound.playAsync();
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          music.file,
          { shouldPlay: true }
        );
        sound = newSound;
        
        soundCache.set(music.id, sound);
        set({ soundCache: new Map(soundCache) });
      }

      // ✅ ADICIONA AO HISTÓRICO APÓS TOCAR
      addToHistory(music);

      set({ 
        currentMusic: music, 
        isPlaying: true,
        position: 0,
        duration: music.duration,
        audioRef: sound
      });

      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded) {
          set({ 
            position: status.positionMillis / 1000,
            duration: status.durationMillis ? status.durationMillis / 1000 : music.duration
          });
          
          if (status.didJustFinish) {
            get().playNext();
          }
        }
      });

    } catch (error) {
      console.error('Erro ao reproduzir música:', error);
    }
  },

  pauseMusic: async () => {
    const { audioRef } = get();
    if (audioRef) await audioRef.pauseAsync();
    set({ isPlaying: false });
  },

  resumeMusic: async () => {
    const { audioRef } = get();
    if (audioRef) await audioRef.playAsync();
    set({ isPlaying: true });
  },

  seekTo: async (position: number) => {
    const { audioRef } = get();
    if (audioRef) await audioRef.setPositionAsync(position * 1000);
    set({ position });
  },

  playNext: () => {
    const { playlist, currentMusic } = get();
    if (!currentMusic) return;

    const currentIndex = playlist.findIndex(m => m.id === currentMusic.id);
    const nextIndex = (currentIndex + 1) % playlist.length;
    get().playMusic(playlist[nextIndex]);
  },

  playPrevious: () => {
    const { playlist, currentMusic } = get();
    if (!currentMusic) return;

    const currentIndex = playlist.findIndex(m => m.id === currentMusic.id);
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    get().playMusic(playlist[prevIndex]);
  },

  togglePlayPause: async () => {
    const { isPlaying, pauseMusic, resumeMusic } = get();
    if (isPlaying) {
      await pauseMusic();
    } else {
      await resumeMusic();
    }
  },

  // ✅ AÇÃO ADICIONADA: GERENCIAR HISTÓRICO
  addToHistory: (music: Music) => {
    const { listeningHistory } = get();
    
    // Remove se já existir (evitar duplicatas)
    const filteredHistory = listeningHistory.filter(m => m.id !== music.id);
    
    // Adiciona no início (mais recente primeiro) e limita a 10
    const newHistory = [music, ...filteredHistory].slice(0, 10);
    
    set({ listeningHistory: newHistory });
  },
}));