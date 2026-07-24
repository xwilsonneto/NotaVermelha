'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Disc3,
  Heart,
  Pause,
  Play,
  CheckCircle,
} from 'lucide-react';

import { albumService } from '@/app/services/api';
import { usePlayerStore } from '@/app/store/playerStore';
import TrackCard from '@/app/components/TrackCard';

import { useDashboard } from '@/app/(dashboard)/DashboardContext';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

function formatTrackTime(seconds?: number) {
  if (!seconds || isNaN(seconds)) return '';

  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);

  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatTotalDuration(totalSeconds: number) {
  if (!totalSeconds) return null;

  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);

  if (h > 0) return `${h} h ${m} min`;

  return `${m} min`;
}

/** Resolve a capa do álbum priorizando album.cover > album.coverUrl */
function resolveAlbumCover(album: any): string | null {
  if (!album) return null;
  return album.cover || album.coverUrl || null;
}

export default function AlbumPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { token } = useDashboard();

  const {
    play,
    currentTrack,
    isPlaying,
    setIsPlaying,
  } = usePlayerStore();

  const [album, setAlbum] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    setLoading(true);
    setNotFound(false);

    fetch(`${API_URL}/albums/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;

        const populated = data.data ?? data;

        if (!populated || !populated._id) {
          setNotFound(true);
          return;
        }

        setAlbum(populated);
        setTracks(populated.tracks ?? []);
        setLiked(!!populated.likedByMe);
      })
      .catch(() => {
        if (!cancelled) {
          setNotFound(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const isAlbumActive =
    !!currentTrack &&
    tracks.some((t) => t._id === currentTrack._id);

  const handlePlayAlbum = () => {
    if (tracks.length === 0) return;

    if (isAlbumActive) {
      setIsPlaying(!isPlaying);
      return;
    }

    play(tracks[0], tracks);
  };

  const handleLike = async () => {
    if (!token || !album) return;

    const prev = liked;

    setLiked(!prev);

    try {
      if (prev) {
        await albumService.unlike(album._id, token);
      } else {
        await albumService.like(album._id, token);
      }
    } catch {
      setLiked(prev);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !album) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-zinc-400">Álbum não encontrado.</p>

        <button
          onClick={() => router.push('/')}
          className="text-red-400 hover:underline text-sm"
        >
          Voltar para o início
        </button>
      </div>
    );
  }

  const artistName =
    album.artist?.name ??
    album.artistName ??
    '—';

  const year = album.releaseDate
    ? new Date(album.releaseDate).getFullYear()
    : null;

  const cover = resolveAlbumCover(album);

  const totalSeconds = tracks.reduce(
    (sum, t) => sum + (t.duration ?? 0),
    0
  );

  const totalLabel = formatTotalDuration(totalSeconds);

  return (
    <div className="max-w-screen-xl mx-auto pb-20 px-4 md:px-6 lg:px-0">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white transition-colors mb-4 md:mb-6"
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      <div className="rounded-2xl md:rounded-3xl border border-zinc-800 bg-zinc-900/40 overflow-hidden lg:h-[calc(100vh-180px)] lg:min-h-[560px]">
        <div className="grid grid-cols-1 lg:grid-cols-[30%_70%] h-full">
          {/* ===================== COLUNA ESQUERDA ===================== */}
          <div className="p-4 md:p-6 flex flex-col lg:border-r lg:border-zinc-800 lg:overflow-y-auto">
            <button
              onClick={handlePlayAlbum}
              disabled={tracks.length === 0}
              className="group relative w-full aspect-square rounded-xl md:rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-700 shadow-2xl mb-6 shrink-0 disabled:cursor-default"
            >
              {cover ? (
                <img
                  src={cover}
                  alt={album.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Disc3 size={48} className="text-zinc-700" />
                </div>
              )}

              {tracks.length > 0 && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-red-600 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all flex items-center justify-center shadow-xl">
                    {isAlbumActive && isPlaying ? (
                      <Pause size={22} fill="white" />
                    ) : (
                      <Play size={22} fill="white" className="ml-1" />
                    )}
                  </div>
                </div>
              )}
            </button>

            <p className="uppercase tracking-[0.25em] text-xs text-zinc-400 mb-2">
              Álbum
            </p>

            <h1 className="text-2xl md:text-3xl font-black leading-tight mb-3 break-words">
              {album.title}
            </h1>

            <div className="flex flex-wrap items-center gap-1.5 text-xs md:text-sm mb-4 md:mb-6">
              <button
                onClick={() =>
                  album.artist?._id &&
                  router.push(`/artist/${album.artist._id}`)
                }
                className="font-bold text-white hover:text-red-400 transition-colors"
              >
                {artistName}
              </button>

              {album.artist?.verified && (
                <CheckCircle size={14} className="text-blue-400" />
              )}

              {year && <span className="text-zinc-500">• {year}</span>}

              <span className="text-zinc-500">• {tracks.length} faixas</span>

              {totalLabel && (
                <span className="text-zinc-500">• {totalLabel}</span>
              )}
            </div>
          </div>

          {/* ===================== COLUNA DIREITA (TRACKLIST) ===================== */}
          <div className="p-4 md:p-6 flex flex-col min-h-0">
            {/* AÇÕES */}
            <div className="flex items-center gap-3 mb-6 shrink-0">
              <button
                onClick={handlePlayAlbum}
                disabled={tracks.length === 0}
                className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-red-600 hover:bg-red-500 hover:scale-105 transition-all flex items-center justify-center shadow-xl disabled:opacity-40"
              >
                {isAlbumActive && isPlaying ? (
                  <Pause size={26} fill="white" />
                ) : (
                  <Play size={26} fill="white" className="ml-1" />
                )}
              </button>

              {token && (
                <button
                  onClick={handleLike}
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-full border flex items-center justify-center transition-all
                  ${
                    liked
                      ? 'border-red-600/40 bg-red-600/10 text-red-500'
                      : 'border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
                </button>
              )}
            </div>

            <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-5 shrink-0">Faixas</h2>

            {tracks.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Este álbum ainda não tem faixas.
              </p>
            ) : (
              <div className="custom-scroll overscroll-y-auto space-y-2 overflow-y-auto pr-1 -mr-1">
                {tracks.map((track, i) => (
                  <div key={track._id} className="flex items-center gap-3">
                    <span className="w-5 md:w-6 text-center text-xs md:text-sm text-zinc-600 tabular-nums shrink-0">
                      {i + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <TrackCard
                        track={{
                          ...track,
                          album:
                            typeof track.album === 'string'
                              ? album
                              : track.album || album,
                        }}
                        queue={tracks}
                        subtitle={formatTrackTime(track.duration)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}