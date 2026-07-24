'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePlayerStore } from '../store/playerStore';
import { trackService } from '../services/api';
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Music2
} from 'lucide-react';

function formatTime(s: number) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function albumIdOf(track: any): string | null {
  if (!track?.album) return null;
  return typeof track.album === 'object' ? track.album._id : track.album;
}

export default function Player() {
  const { currentTrack, queue, currentIndex, setCurrentIndex, isPlaying, setIsPlaying } =
    usePlayerStore();

  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentTrackIdRef = useRef<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);

  // Um único efeito cuida de troca de faixa E de play/pause.
  // Antes havia dois efeitos separados (um em [isPlaying], outro em
  // [currentTrack]) que rodavam juntos quando currentTrack mudava e
  // isPlaying já era `true`: o efeito de play/pause tentava tocar o
  // <audio> ANTES do src ser setado, o `.play()` falhava e chamava
  // setIsPlaying(false) — só que o efeito de troca de faixa, com uma
  // closure "presa" no isPlaying antigo (true), tocava o áudio mesmo assim
  // logo em seguida. Resultado: o áudio tocava de verdade (barra andando)
  // mas o estado global isPlaying ficava false (botão preso em "play").
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    const isNewTrack = currentTrackIdRef.current !== currentTrack._id;

    if (isNewTrack) {
      currentTrackIdRef.current = currentTrack._id;
      audio.src = currentTrack.audioUrl;
      audio.load();
      trackService.registerPlay(currentTrack._id);

      const onCanPlay = () => {
        if (isPlaying) {
          audio.play().catch(() => setIsPlaying(false));
        }
      };

      audio.addEventListener('canplay', onCanPlay, { once: true });
      return () => {
        audio.removeEventListener('canplay', onCanPlay);
      };
    }

    // Mesma faixa: apenas alternando play/pause.
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [currentTrack, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = muted ? 0 : volume;
  }, [volume, muted]);

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setProgress(audio.currentTime);
    setDuration(audio.duration || 0);
  };

  const handleEnded = () => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsPlaying(false);
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * duration;
  };

  const prev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
    else if (audioRef.current) audioRef.current.currentTime = 0;
  };

  const next = () => {
    if (currentIndex < queue.length - 1) setCurrentIndex(currentIndex + 1);
  };

  if (!currentTrack) return null;

  const progressPct = duration ? (progress / duration) * 100 : 0;
  const artistName = Array.isArray(currentTrack.artists)
    ? currentTrack.artists.map((a: any) => a.name ?? a).join(', ')
    : '—';

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={handleTimeUpdate}
      />

      <div className="fixed bottom-0 lg:bottom-0 max-lg:bottom-14 left-0 right-0 z-[60] bg-[#0c0c0c]/95 backdrop-blur-xl border-t border-zinc-800/60">

        {/* Progress bar */}
        <div className="h-0.5 bg-zinc-800 cursor-pointer group" onClick={seek}>
          <div
            className="h-full bg-red-500 relative transition-all"
            style={{ width: `${progressPct}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <div className="h-14 md:h-16">
          <div className="h-full max-w-screen-2xl mx-auto px-3 md:px-4 flex items-center gap-2 md:gap-4">

            {/* Track info — clique abre a página do álbum da faixa atual */}
            <div
              className="flex items-center gap-2 md:gap-3 flex-1 min-w-0 cursor-pointer group/info"
              onClick={() => {
                const albumId = albumIdOf(currentTrack);
                if (albumId) router.push(`/album/${albumId}`);
              }}
            >
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0">
                {currentTrack.coverUrl ? (
                  <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music2 size={18} className="text-zinc-600" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm font-semibold truncate group-hover/info:text-red-400 transition-colors">{currentTrack.title}</p>
                <p className="text-xs text-zinc-500 truncate">{artistName}</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
              <button
                onClick={prev}
                className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <SkipBack size={18} />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} fill="black" />}
              </button>

              <button
                onClick={next}
                disabled={currentIndex >= queue.length - 1}
                className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30"
              >
                <SkipForward size={18} />
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2 md:gap-3 flex-1 justify-end">
              <span className="hidden sm:block text-xs text-zinc-500 tabular-nums">
                {formatTime(progress)} / {formatTime(duration)}
              </span>
              <div className="hidden md:flex items-center gap-2">
                <button onClick={() => setMuted(!muted)} className="text-zinc-400 hover:text-white">
                  {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input
                  type="range"
                  min={0} max={1} step={0.01}
                  value={muted ? 0 : volume}
                  onChange={(e) => { setVolume(Number(e.target.value)); setMuted(false); }}
                  className="w-20 h-1 accent-red-500"
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}