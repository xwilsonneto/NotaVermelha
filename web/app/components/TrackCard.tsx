'use client';

import { useState } from 'react';
import { Play, Pause, Heart, Music2 } from 'lucide-react';
import { usePlayerStore } from '@/app/store/playerStore';
import { trackService } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { Track } from '../services/api';

interface TrackCardProps {
  track: Track;
  queue?: Track[];
  initialLiked?: boolean;
}

function formatDuration(s: number) {
  if (!s) return '';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function TrackCard({ track, queue, initialLiked = false }: TrackCardProps) {
  const { play, currentTrack, isPlaying, setIsPlaying } = usePlayerStore();
  const { token } = useAuthStore();

  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(track.likeCount ?? 0);
  const [hovering, setHovering] = useState(false);

  const isActive = currentTrack?._id === track._id;

  const handlePlay = () => {
    if (isActive) {
      setIsPlaying(!isPlaying);
    } else {
      play(track, queue);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;
    const prev = liked;
    setLiked(!prev);
    setLikeCount((c) => c + (prev ? -1 : 1));
    if (prev) {
      await trackService.unlike(track._id, token);
    } else {
      await trackService.like(track._id, token);
    }
  };

  const artistName = Array.isArray(track.artists)
    ? track.artists.map((a: any) => a.name ?? a).join(', ')
    : '—';

  return (
    <div
      className={`group relative flex flex-col rounded-2xl bg-zinc-900/60 border transition-all duration-200 cursor-pointer overflow-hidden
        ${isActive ? 'border-red-600/60 bg-red-950/20' : 'border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-800/60'}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={handlePlay}
    >
      {/* Cover */}
      <div className="relative aspect-square w-full overflow-hidden rounded-t-2xl bg-zinc-800">
        {track.coverUrl ? (
          <img
            src={track.coverUrl}
            alt={track.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music2 size={32} className="text-zinc-600" />
          </div>
        )}

        {/* Play overlay */}
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200
          ${hovering || isActive ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-xl">
            {isActive && isPlaying
              ? <Pause size={20} fill="black" className="text-black" />
              : <Play size={20} fill="black" className="text-black ml-0.5" />
            }
          </div>
        </div>

        {/* Playing indicator */}
        {isActive && isPlaying && (
          <div className="absolute bottom-2 left-2 flex items-end gap-0.5 h-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-1 bg-red-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.1}s`, height: `${8 + i * 4}px` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-sm font-semibold truncate ${isActive ? 'text-red-400' : 'text-white'}`}>
            {track.title}
          </p>
          <p className="text-xs text-zinc-500 truncate mt-0.5">{artistName}</p>
          {track.duration > 0 && (
            <p className="text-xs text-zinc-600 mt-1">{formatDuration(track.duration)}</p>
          )}
        </div>

        {token && (
          <button
            onClick={handleLike}
            className={`shrink-0 mt-0.5 transition-all ${liked ? 'text-red-500 scale-110' : 'text-zinc-600 hover:text-zinc-300'}`}
          >
            <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>
    </div>
  );
}
