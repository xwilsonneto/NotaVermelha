'use client';

import { useState } from 'react';
import { Play, Pause, Music2 } from 'lucide-react';
import { usePlayerStore } from '@/app/store/playerStore';
import type { Track } from '../services/api';

interface TrackCardProps {
  track: Track;
  queue?: Track[];
  type?: 'track' | 'album';
  albumName?: string;
  subtitle?: string;
}

function resolveAlbumName(album: any): string {
  if (!album) return '—';
  if (typeof album === 'string') return '';
  if (typeof album === 'object') return album.title ?? album.name ?? '—';
  return '—';
}

export default function TrackCard({ track, queue, type = 'track', albumName, subtitle }: TrackCardProps) {
  const { play, currentTrack, isPlaying, setIsPlaying } = usePlayerStore();
  const [hovering, setHovering] = useState(false);

  const isActive = currentTrack?._id === track._id;

  const albumCover =
    typeof track.album === 'object' && track.album
      ? track.album.cover || track.album.coverUrl
      : null;

  const coverSrc = albumCover || track.coverUrl;

  const handlePlay = () => {
    if (isActive) setIsPlaying(!isPlaying);
    else play(track, queue);
  };

  const displaySubtitle =
    subtitle ?? (type === 'album' ? 'Álbum' : albumName || resolveAlbumName(track.album) || '—');

  return (
    <div
      className={`group flex items-center h-14 md:h-16 w-full rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden
        ${isActive
          ? 'border-red-600/40 bg-red-950/20'
          : 'border-zinc-800/60 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-800/60'
        }`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={handlePlay}
    >
      {/* Capa — 64×64, altura total do card */}
      <div className="relative h-full aspect-square flex-shrink-0 bg-zinc-800">
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={track.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music2 size={20} className="w-5 h-5 md:w-6 md:h-6 text-zinc-600" />
          </div>
        )}

        {/* Overlay play/pause */}
        <div
          className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-150
            ${hovering || isActive ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white flex items-center justify-center shadow-lg">
            {isActive && isPlaying
              ? <Pause size={12} className="w-3 h-3 md:w-3.5 md:h-3.5" fill="black" />
              : <Play size={12} className="w-3 h-3 md:w-3.5 md:h-3.5" fill="black" />
            }
          </div>
        </div>
      </div>

      {/* Texto */}
      <div className="flex-1 min-w-0 px-2.5 md:px-3 py-1.5 md:py-2">
        <p className={`text-xs md:text-sm font-medium truncate leading-tight
          ${isActive ? 'text-red-400' : 'text-white'}`}>
          {track.title}
        </p>
        <p className="text-xs text-zinc-500 truncate mt-0.5 leading-tight">
          {displaySubtitle}
        </p>
      </div>

      {/* Indicador de reprodução ativa */}
      {isActive && isPlaying && (
        <div className="flex items-end gap-0.5 h-3 pr-2.5 md:pr-3 flex-shrink-0">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-0.5 bg-red-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.12}s`, height: `${4 + i * 3}px` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}