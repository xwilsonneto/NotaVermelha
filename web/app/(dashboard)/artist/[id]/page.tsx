'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle,
  Disc3,
  Music2,
  Pause,
  Play,
  Shuffle,
  UserPlus,
  UserCheck,
  Globe,
  Headphones,
  Album,
  AudioLines,
  ExternalLink,
} from 'lucide-react';

import { artistService } from '@/app/services/api';
import { usePlayerStore } from '@/app/store/playerStore';
import TrackCard from '@/app/components/TrackCard';

import { useDashboard } from '@/app/(dashboard)/DashboardContext';
import { FaInstagram, FaTwitter } from 'react-icons/fa';
import { FaYoutube } from 'react-icons/fa6';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

function formatCompactNumber(value?: number) {
  if (!value) return '0';
  return new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
}

function formatTrackTime(seconds?: number) {
  if (!seconds || isNaN(seconds)) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Resolve a capa da track priorizando album.cover > album.coverUrl > track.cover > track.coverUrl */
function resolveTrackCover(track: any): string | null {
  if (!track) return null;
  if (track.album && typeof track.album === 'object') {
    return track.album.cover || track.album.coverUrl || null;
  }
  return track.cover || track.coverUrl || null;
}

/** Resolve a capa do álbum priorizando album.cover > album.coverUrl */
function resolveAlbumCover(album: any): string | null {
  if (!album) return null;
  return album.cover || album.coverUrl || null;
}

export default function ArtistPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useDashboard();
  const { play, playShuffled, currentTrack, isPlaying, setIsPlaying } =
    usePlayerStore();

  const [artist, setArtist] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [allTracks, setAllTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [following, setFollowing] = useState(false);
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);

  // -------- 1) Carrega o artista --------
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    fetch(`${API_URL}/artists/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const populated = data.data ?? data;
        if (!populated || !populated._id) {
          setNotFound(true);
          return;
        }
        setArtist(populated);
        setTracks(populated.tracks ?? []);
        setAlbums(populated.albums ?? []);
        setFollowing(!!populated.followedByMe);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id]);

  // -------- 2) Busca TODAS as faixas do artista --------
  // O endpoint /artists/:id costuma limitar `tracks` às mais tocadas.
  // Aqui buscamos o catálogo completo em /artists/:id/tracks.
  // Se esse endpoint não existir, tentamos mesclar album.tracks como fallback.
  useEffect(() => {
    if (!artist?._id) return;
    let cancelled = false;

    const buildFallback = () => {
      const map = new Map<string, any>();
      (tracks ?? []).forEach((t: any) => { if (t?._id) map.set(t._id, t); });
      (albums ?? []).forEach((al: any) => {
        (al.tracks ?? []).forEach((t: any) => {
          if (t?._id && !map.has(t._id)) map.set(t._id, t);
        });
      });
      return [...map.values()];
    };

    fetch(`${API_URL}/artists/${artist._id}/tracks`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (cancelled) return;
        const list = data?.data ?? data;
        if (Array.isArray(list) && list.length > 0) {
          setAllTracks(list);
        } else {
          setAllTracks(buildFallback());
        }
      })
      .catch(() => {
        if (!cancelled) setAllTracks(buildFallback());
      });

    return () => { cancelled = true; };
  }, [artist?._id, tracks, albums]);

  const topTracks = useMemo(() => {
    return [...tracks]
      .sort((a, b) => (b.plays ?? b.playCount ?? 0) - (a.plays ?? a.playCount ?? 0))
      .slice(0, 5);
  }, [tracks]);

  const totalTracksFromAlbums = useMemo(() => {
    return albums.reduce((sum, album) => sum + (album.totalTracks || 0), 0);
  }, [albums]);

  const isAnyTrackActive = useMemo(() => {
    if (!currentTrack || !id) return false;

    const trackArtists = currentTrack.artists;
    if (!Array.isArray(trackArtists) || trackArtists.length === 0) return false;

    return trackArtists.some((a: any) => {
      const artistId = typeof a === 'string' ? a : a?._id;
      return artistId?.toString() === id;
    });
  }, [currentTrack, id]);

  const handlePlayTopTracks = () => {
    if (topTracks.length === 0) return;

    if (isAnyTrackActive) {
      setIsPlaying(!isPlaying);
      return;
    }

    play(topTracks[0], topTracks);
  };

  /**
   * Toca TODAS as faixas do artista em ordem aleatória.
   * Prefere `allTracks` (catálogo completo). Cai pra `tracks` só se o fetch falhar.
   * Usa `playShuffled` do store para já ativar a flag global de shuffle.
   */
  const handleShufflePlay = () => {
    const pool = allTracks.length > 0 ? allTracks : tracks;
    if (pool.length === 0) return;
    playShuffled(pool);
  };

  const handleFollow = async () => {
    if (!token || !artist) return;
    const prev = following;
    setFollowing(!prev);
    try {
      if (prev) {
        await artistService.unfollow(artist._id, token);
      } else {
        await artistService.follow(artist._id, token);
      }
    } catch {
      setFollowing(prev);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-[3px] border-red-500/30 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !artist) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-32 text-center">
        <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-2">
          <Music2 size={32} className="text-zinc-600" />
        </div>
        <p className="text-zinc-400 text-lg">Artista não encontrado.</p>
        <button
          onClick={() => router.push('/')}
          className="text-red-400 hover:text-red-300 transition-colors text-sm font-medium flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          Voltar para o início
        </button>
      </div>
    );
  }

  const cover = artist.coverImage;
  const avatar = artist.avatar;
  const socials = artist.socialLinks ?? {};
  const hasSocials =
    socials.website || socials.instagram || socials.twitter || socials.youtube;
  const canShuffle = allTracks.length > 0 || tracks.length > 0;

  return (
    <div className="max-w-screen-xl mx-auto pb-24 px-4 md:px-6 lg:px-0">
      {/* ===================== VOLTAR ===================== */}
      <button
        onClick={() => router.back()}
        className="group flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-all duration-300 mb-4 md:mb-5 w-fit"
      >
        <span className="w-7 h-7 rounded-full border border-zinc-800 group-hover:border-zinc-600 group-hover:bg-zinc-800/50 flex items-center justify-center transition-all duration-300">
          <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform duration-300" />
        </span>
        <span className="font-medium">Voltar</span>
      </button>

      {/* ===================== HERO COMPACTO ===================== */}
      <div className="relative rounded-xl md:rounded-2xl overflow-hidden mb-6 md:mb-8">
        <div className="absolute inset-0">
          {cover ? (
            <>
              <img src={cover} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-zinc-950/30" />
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-zinc-950/20 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-zinc-950/20" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />
          )}
        </div>

        <div className="relative p-5 md:p-7 flex flex-col lg:flex-row lg:items-end gap-5 lg:gap-8">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 flex-1 min-w-0">
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shadow-xl shadow-black/40 ring-1 ring-white/10">
                {avatar ? (
                  <img src={avatar} alt={artist.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                    <Music2 size={32} className="text-zinc-600" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-[10px] font-bold uppercase tracking-[0.15em] text-white/80">
                  Artista
                </span>
                {artist.verified && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/20 text-[10px] font-semibold text-blue-400">
                    <CheckCircle size={10} />
                    Verificado
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight mb-2 tracking-tight">
                {artist.name}
              </h1>

              <div className="flex flex-wrap items-center gap-x-2 md:gap-x-3 gap-y-1 text-xs text-zinc-400 mb-3">
                <span className="flex items-center gap-1">
                  <Headphones size={12} />
                  {formatCompactNumber(artist.monthlyListeners)} ouvintes
                </span>
                {artist.country && (
                  <span className="flex items-center gap-1">
                    <Globe size={12} />
                    {artist.country}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Album size={12} />
                  {albums.length} {albums.length === 1 ? 'álbum' : 'álbuns'}
                </span>
              </div>

              {Array.isArray(artist.genre) && artist.genre.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {artist.genre.map((g: string) => (
                    <span
                      key={g}
                      className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] text-zinc-300 font-medium capitalize"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlayTopTracks}
                  disabled={topTracks.length === 0}
                  className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-red-600 hover:bg-red-500 transition-all duration-300 flex items-center justify-center shadow-lg shadow-red-600/25 hover:scale-105 disabled:opacity-40"
                >
                  {isAnyTrackActive && isPlaying ? (
                    <Pause size={18} fill="white" className="text-white" />
                  ) : (
                    <Play size={18} fill="white" className="text-white ml-0.5" />
                  )}
                </button>

                {/* Botão ALEATÓRIO */}
                <button
                  onClick={handleShufflePlay}
                  disabled={!canShuffle}
                  title="Tocar aleatoriamente"
                  aria-label="Tocar aleatoriamente"
                  className="group/shuffle w-10 h-10 md:w-11 md:h-11 rounded-full border border-zinc-700 bg-zinc-900/50 backdrop-blur-sm hover:bg-zinc-800/70 hover:border-zinc-500 transition-all duration-300 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Shuffle
                    size={16}
                    className="text-zinc-300 group-hover/shuffle:text-white transition-colors duration-300"
                  />
                </button>

                {token && (
                  <button
                    onClick={handleFollow}
                    className={`h-8 md:h-9 px-3 md:px-4 rounded-full border flex items-center gap-1.5 text-xs font-semibold transition-all duration-300
                    ${
                      following
                        ? 'border-red-500/30 bg-red-500/10 text-red-400'
                        : 'border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:text-white hover:border-zinc-500'
                    }`}
                  >
                    {following ? (
                      <><UserCheck size={13} /> Seguindo</>
                    ) : (
                      <><UserPlus size={13} /> Seguir</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="hidden lg:flex flex-col gap-3 shrink-0 w-56">
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-0.5">Ouvintes</p>
                  <p className="text-sm font-bold text-white">{formatCompactNumber(artist.monthlyListeners)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-0.5">Plays</p>
                  <p className="text-sm font-bold text-white">{formatCompactNumber(artist.totalPlays)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-0.5">Álbuns</p>
                  <p className="text-sm font-bold text-white">{albums.length}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-0.5">Faixas</p>
                  <p className="text-sm font-bold text-white">{totalTracksFromAlbums}</p>
                </div>
              </div>
            </div>

            {hasSocials && (
              <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-3">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-2">Redes</p>
                <div className="flex gap-2">
                  {socials.website && (
                    <a href={socials.website} target="_blank" rel="noreferrer"
                      className="w-8 h-8 rounded-lg border border-zinc-700/50 bg-zinc-900/50 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-500 transition-all"
                      title="Website">
                      <Globe size={14} />
                    </a>
                  )}
                  {socials.instagram && (
                    <a href={`https://www.instagram.com/${socials.instagram}`} target="_blank" rel="noreferrer"
                      className="w-8 h-8 rounded-lg border border-zinc-700/50 bg-zinc-900/50 flex items-center justify-center text-zinc-400 hover:text-pink-400 hover:border-pink-500/30 transition-all"
                      title="Instagram">
                      <FaInstagram size={14} />
                    </a>
                  )}
                  {socials.twitter && (
                    <a href={socials.twitter} target="_blank" rel="noreferrer"
                      className="w-8 h-8 rounded-lg border border-zinc-700/50 bg-zinc-900/50 flex items-center justify-center text-zinc-400 hover:text-sky-400 hover:border-sky-500/30 transition-all"
                      title="Twitter">
                      <FaTwitter size={14} />
                    </a>
                  )}
                  {socials.youtube && (
                    <a href={socials.youtube} target="_blank" rel="noreferrer"
                      className="w-8 h-8 rounded-lg border border-zinc-700/50 bg-zinc-900/50 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:border-red-500/30 transition-all"
                      title="YouTube">
                      <FaYoutube size={14} />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===================== CONTEÚDO PRINCIPAL ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        <div className="min-w-0 space-y-10">
          {/* POPULARES */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold tracking-tight">Populares</h2>
              {topTracks.length > 0 && (
                <span className="text-[11px] text-zinc-600 font-medium uppercase tracking-wider">Top {topTracks.length}</span>
              )}
            </div>

            {topTracks.length === 0 ? (
              <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/20 p-6 text-center">
                <Music2 size={28} className="text-zinc-700 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">Este artista ainda não tem faixas.</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {topTracks.map((track, i) => {
                  const isCurrent = currentTrack?._id === track._id;
                  const isHovered = hoveredTrack === track._id;

                  return (
                    <div
                      key={track._id}
                      className={`group/track flex h-18 items-center gap-2 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-lg transition-all duration-200 cursor-pointer
                        ${isCurrent ? 'bg-white/[0.04]' : 'hover:bg-white/[0.025]'}`}
                      onMouseEnter={() => setHoveredTrack(track._id)}
                      onMouseLeave={() => setHoveredTrack(null)}
                    >
                      <div className="w-5 md:w-6 flex items-center justify-center shrink-0">
                        {isCurrent && isPlaying ? (
                          <div className="flex items-end gap-[2px] h-3.5">
                            <span className="w-[2.5px] bg-red-500 rounded-full animate-[music-bar_0.7s_ease-in-out_infinite]" style={{ height: '60%' }} />
                            <span className="w-[2.5px] bg-red-500 rounded-full animate-[music-bar_0.5s_ease-in-out_infinite_0.1s]" style={{ height: '100%' }} />
                            <span className="w-[2.5px] bg-red-500 rounded-full animate-[music-bar_0.8s_ease-in-out_infinite_0.2s]" style={{ height: '40%' }} />
                          </div>
                        ) : (
                          <span className={`text-xs font-medium tabular-nums transition-colors duration-200
                            ${isCurrent ? 'text-red-500' : isHovered ? 'text-white' : 'text-zinc-600'}`}>
                            {isHovered ? <Play size={11} fill="currentColor" /> : i + 1}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <TrackCard
                          track={track}
                          queue={topTracks}
                          subtitle={formatTrackTime(track.duration)}
                        />
                      </div>

                      <span className="text-[11px] text-zinc-600 font-medium tabular-nums shrink-0">
                        {formatTrackTime(track.duration)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* DISCOGRAFIA */}
          <section>
            <div className="flex items-center justify-between mb-4 md:mb-5">
              <h2 className="text-xl font-bold tracking-tight">Discografia</h2>
              {albums.length > 0 && (
                <span className="text-[11px] text-zinc-600 font-medium uppercase tracking-wider">
                  {albums.length} {albums.length === 1 ? 'lançamento' : 'lançamentos'}
                </span>
              )}
            </div>

            {albums.length === 0 ? (
              <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/20 p-6 text-center">
                <Disc3 size={28} className="text-zinc-700 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">Este artista ainda não tem álbuns.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {albums.map((album) => {
                  const albumCover = resolveAlbumCover(album);
                  return (
                    <button
                      key={album._id}
                      onClick={() => router.push(`/album/${album._id}`)}
                      className="group/album text-left"
                    >
                      <div className="aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/50 mb-3 relative shadow-md shadow-black/20 group-hover/album:shadow-lg group-hover/album:shadow-black/30 transition-all duration-500">
                        {albumCover ? (
                          <img
                            src={albumCover}
                            alt={album.title}
                            className="w-full h-full object-cover group-hover/album:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                            <Disc3 size={28} className="text-zinc-700" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover/album:bg-black/20 transition-all duration-300 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover/album:opacity-100 scale-75 group-hover/album:scale-100 transition-all duration-300 shadow-lg shadow-red-600/30">
                            <ExternalLink size={16} className="text-white" />
                          </div>
                        </div>
                      </div>
                      <p className="text-sm font-semibold truncate group-hover/album:text-red-400 transition-colors duration-200 mb-0.5">
                        {album.title}
                      </p>
                      {album.releaseDate && (
                        <p className="text-[11px] text-zinc-500 font-medium">
                          {new Date(album.releaseDate).getFullYear()}
                          {album.type && <span className="mx-1 text-zinc-700">•</span>}
                          {album.type && <span className="capitalize">{album.type}</span>}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Coluna Direita: Sobre */}
        <aside className="space-y-4 md:space-y-5">
          <div className="lg:hidden rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-3 md:p-4">
            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-white">{formatCompactNumber(artist.monthlyListeners)}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Ouvintes</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">{formatCompactNumber(artist.totalPlays)}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Plays</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">{albums.length}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Álbuns</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">{totalTracksFromAlbums}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Faixas</p>
              </div>
            </div>
          </div>

          {artist.bio && (
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-5">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-3 flex items-center gap-2">
                <AudioLines size={12} />
                Sobre
              </h3>
              <p className="text-sm text-zinc-300 leading-[1.75] whitespace-pre-line">
                {artist.bio}
              </p>
            </div>
          )}

          <div className="lg:hidden rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-3 md:p-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-3">Redes</h3>
            <div className="flex gap-2">
              {socials.website && (
                <a href={socials.website} target="_blank" rel="noreferrer"
                  className="w-9 h-9 rounded-lg border border-zinc-800 bg-zinc-900/50 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
                  <Globe size={15} />
                </a>
              )}
              {socials.instagram && (
                <a href={socials.instagram} target="_blank" rel="noreferrer"
                  className="w-9 h-9 rounded-lg border border-zinc-800 bg-zinc-900/50 flex items-center justify-center text-zinc-400 hover:text-pink-400 transition-all">
                  <FaInstagram size={15} />
                </a>
              )}
              {socials.twitter && (
                <a href={socials.twitter} target="_blank" rel="noreferrer"
                  className="w-9 h-9 rounded-lg border border-zinc-800 bg-zinc-900/50 flex items-center justify-center text-zinc-400 hover:text-sky-400 transition-all">
                  <FaTwitter size={15} />
                </a>
              )}
              {socials.youtube && (
                <a href={socials.youtube} target="_blank" rel="noreferrer"
                  className="w-9 h-9 rounded-lg border border-zinc-800 bg-zinc-900/50 flex items-center justify-center text-zinc-400 hover:text-red-500 transition-all">
                  <FaYoutube size={15} />
                </a>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}