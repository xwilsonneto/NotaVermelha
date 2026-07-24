'use client';

import { useState } from 'react';
import { UserPlus, UserCheck } from 'lucide-react';
import { artistService } from '../services/api';
import { useAuthStore } from '@/app/store/authStore';
import { useRouter } from 'next/navigation';

interface ArtistCardProps {
  artist: any;
  initialFollowing?: boolean;
}

export default function ArtistCard({ artist, initialFollowing = false }: ArtistCardProps) {
  const { token } = useAuthStore();
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(artist.followersCount ?? 0);
  const [loading, setLoading] = useState(false);

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token || loading) return;
    setLoading(true);
    const prev = following;
    setFollowing(!prev);
    setFollowerCount((c: number) => c + (prev ? -1 : 1));
    try {
      if (prev) {
        await artistService.unfollow(artist._id, token);
      } else {
        await artistService.follow(artist._id, token);
      }
    } catch {
      setFollowing(prev);
      setFollowerCount((c: number) => c + (prev ? 1 : -1));
    } finally {
      setLoading(false);
    }
  };

  const avatarUrl = artist.avatar ?? artist.coverUrl;
  const genre = Array.isArray(artist.genre)
    ? artist.genre[0]
    : artist.genre ?? artist.bandInfo?.genre ?? null;

  return (
    <div
      className="group relative flex flex-col items-center rounded-xl md:rounded-2xl bg-zinc-900/60 border border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-800/60 transition-all duration-200 cursor-pointer p-4 md:p-5 text-center"
      onClick={() => router.push(`/artist/${artist._id}`)}
    >
      {/* Avatar */}
      <div className="relative w-[72px] h-[72px] md:w-20 md:h-20 rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-700 group-hover:border-red-600/50 transition-colors mb-2 md:mb-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={artist.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/40 to-zinc-800">
            <span className="text-xl md:text-2xl font-black text-red-400">
              {(artist.name ?? '?')[0].toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <p className="text-sm font-bold truncate w-full">{artist.name}</p>

      {genre && (
        <p className="text-xs text-zinc-500 mt-0.5 truncate">{genre}</p>
      )}

      <p className="text-xs text-zinc-600 mt-1">
        {followerCount.toLocaleString('pt-BR')} seguidores
      </p>

      {token && (
        <button
          onClick={handleFollow}
          className={`mt-2 md:mt-3 flex items-center gap-1 md:gap-1.5 px-3 md:px-4 py-1 md:py-1.5 rounded-full text-xs font-semibold transition-all
            ${following
              ? 'bg-red-600/20 border border-red-600/40 text-red-400 hover:bg-red-600/30'
              : 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-red-600/40 hover:text-red-400'
            }`}
        >
          {following
            ? <><UserCheck className="w-3 h-3 md:w-3 md:h-3" /> Seguindo</>
            : <><UserPlus className="w-3 h-3 md:w-3 md:h-3" /> Seguir</>
          }
        </button>
      )}
    </div>
  );
}