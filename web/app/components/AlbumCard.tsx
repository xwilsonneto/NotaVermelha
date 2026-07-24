'use client';

import { useState } from 'react';
import { Heart, Disc3, Play, Pause } from 'lucide-react';
import { albumService } from '../services/api';
import { useAuthStore } from '@/app/store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

interface AlbumCardProps {
  album: any;
  initialLiked?: boolean;
}

function albumIdOf(track: any): string | null {
  if (!track?.album) return null;
  return typeof track.album === 'object' ? track.album._id : track.album;
}

export default function AlbumCard({ album, initialLiked = false }: AlbumCardProps) {
  const { token } = useAuthStore();
  const { play, currentTrack, isPlaying, setIsPlaying } = usePlayerStore();
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [loadingPlay, setLoadingPlay] = useState(false);

  // Este álbum é o que está tocando agora?
  const isActive = !!currentTrack && albumIdOf(currentTrack) === album._id;

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;
    const prev = liked;
    setLiked(!prev);
    if (prev) {
      await albumService.unlike(album._id, token).catch(() => setLiked(true));
    } else {
      await albumService.like(album._id, token).catch(() => setLiked(false));
    }
  };

  const handlePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Já é o álbum tocando: só alterna play/pause, sem recarregar nada.
    if (isActive) {
      setIsPlaying(!isPlaying);
      return;
    }

    if (loadingPlay) return;
    setLoadingPlay(true);
    try {
      const res = await fetch(`${API_URL}/albums/${album._id}`);
      const data = await res.json();
      // O album populado pode vir direto ou em data.data
      const populated = data.data ?? data;
      const tracks: any[] = populated.tracks ?? [];
      if (tracks.length === 0) return;
      play(tracks[0], tracks);
    } catch {
      // silencia erro de rede
    } finally {
      setLoadingPlay(false);
    }
  };

  const artistName = album.artist?.name ?? album.artistName ?? '—';
  const year = album.releaseDate ? new Date(album.releaseDate).getFullYear() : null;
  const cover = album.coverUrl ?? album.cover;

  return (
    <div
      className={`group relative flex flex-col rounded-xl md:rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden
        ${isActive
          ? 'border-red-600/40 bg-red-950/20'
          : 'bg-zinc-900/60 border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-800/60'
        }`}
      onClick={() => router.push(`/album/${album._id}`)}
    >
      {/* Cover */}
      <div className="relative aspect-square w-full overflow-hidden rounded-t-xl md:rounded-t-2xl bg-zinc-800">
        {cover ? (
          <img
            src={cover}
            alt={album.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Disc3 size={32} className="text-zinc-600" />
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200" />

        {/* Botão play sobre a capa — some com hover, mas fica sempre visível
            enquanto este é o álbum tocando (ativo ou pausado) */}
        <button
          onClick={handlePlay}
          className={`absolute bottom-1.5 right-1.5 md:bottom-2 md:right-2 w-10 h-10 md:w-9 md:h-9 rounded-full bg-red-600 text-white flex items-center justify-center translate-y-1 group-hover:translate-y-0 transition-all duration-200 shadow-lg hover:bg-red-500 hover:scale-105
            ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 group-hover:opacity-100'}`}
        >
          {loadingPlay
            ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : isActive && isPlaying
              ? <Pause size={15} fill="white" />
              : <Play size={15} fill="white" />
          }
        </button>
      </div>

      {/* Info */}
      <div className="p-2.5 md:p-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{album.title}</p>
          <p className="text-xs text-zinc-500 truncate mt-0.5">{artistName}</p>
          {year && <p className="text-xs text-zinc-600 mt-1">{year}</p>}
        </div>

        {token && (
          <button
            onClick={handleLike}
            className={`shrink-0 mt-0.5 transition-all ${liked ? 'text-red-500 scale-110' : 'text-zinc-600 hover:text-zinc-300'}`}
          >
            <Heart className="w-3.5 h-3.5 md:w-4 md:h-4" fill={liked ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>
    </div>
  );
}