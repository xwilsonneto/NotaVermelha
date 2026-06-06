'use client';

import { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { trackService } from '../services/api';
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, ChevronDown, Music2
} from 'lucide-react';

function formatTime(s: number) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function Player() {
  const { currentTrack, queue, currentIndex, setCurrentIndex, isPlaying, setIsPlaying } =
    usePlayerStore();

  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Sincroniza play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  // Troca de faixa
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    audio.src = currentTrack.audioUrl;
    audio.load();
    if (isPlaying) audio.play().catch(() => setIsPlaying(false));
    // Registra play no backend
    trackService.registerPlay(currentTrack._id);
  }, [currentTrack]);

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

      {/* Player bar — fixed bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0c0c0c]/95 backdrop-blur-xl border-t border-zinc-800/60">
        {/* Progress bar — full width, acima do conteúdo */}
        <div
          className="h-0.5 bg-zinc-800 cursor-pointer group"
          onClick={seek}
        >
          <div
            className="h-full bg-red-500 relative transition-all"
            style={{ width: `${progressPct}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md" />
          </div>
        </div>

        <div className="flex items-center gap-4 px-4 py-3 max-w-screen-2xl mx-auto">
          {/* Track info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-11 h-11 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0">
              {currentTrack.coverUrl ? (
                <img
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music2 size={18} className="text-zinc-600" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{currentTrack.title}</p>
              <p className="text-xs text-zinc-500 truncate">{artistName}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={prev}
              className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-zinc-800"
            >
              <SkipBack size={18} />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-11 h-11 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-transform shadow-lg"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} fill="black" />}
            </button>

            <button
              onClick={next}
              disabled={currentIndex >= queue.length - 1}
              className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-zinc-800 disabled:opacity-30"
            >
              <SkipForward size={18} />
            </button>
          </div>

          {/* Time + Volume */}
          <div className="flex items-center gap-3 flex-1 justify-end min-w-0">
            <span className="text-xs text-zinc-500 tabular-nums hidden sm:block">
              {formatTime(progress)} / {formatTime(duration)}
            </span>

            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => setMuted(!muted)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  setMuted(false);
                }}
                className="w-20 h-1 accent-red-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
