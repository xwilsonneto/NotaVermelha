'use client';

import { useState } from 'react';
import { Heart, Disc3 } from 'lucide-react';
import { albumService } from '../services/api';
import { useAuthStore } from '@/app/store/authStore';
import { useRouter } from 'next/navigation';

interface AlbumCardProps {
  album: any;
  initialLiked?: boolean;
}

export default function AlbumCard({ album, initialLiked = false }: AlbumCardProps) {
  const { token } = useAuthStore();
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);

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

  const artistName = album.artist?.name ?? album.artistName ?? '—';
  const year = album.releaseDate ? new Date(album.releaseDate).getFullYear() : null;

  return (
    <div
      className="group relative flex flex-col rounded-2xl bg-zinc-900/60 border border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-800/60 transition-all duration-200 cursor-pointer overflow-hidden"
      onClick={() => router.push(`/album/${album._id}`)}
    >
      {/* Cover */}
      <div className="relative aspect-square w-full overflow-hidden rounded-t-2xl bg-zinc-800">
        {album.coverUrl ? (
          <img
            src={album.coverUrl}
            alt={album.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Disc3 size={32} className="text-zinc-600" />
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200" />
      </div>

      {/* Info */}
      <div className="p-3 flex items-start justify-between gap-2">
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
            <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>
    </div>
  );
}
