'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Music2,
  Play,
  Pause,
  Headphones,
  Users,
  UserPlus,
  UserCheck,
  Disc3,
  Calendar,
  MessageCircle,
  Repeat2,
  Heart,
  AudioLines,
  Clock,
} from 'lucide-react';

import { usePlayerStore } from '@/app/store/playerStore';
import { useDashboard } from '@/app/(dashboard)/DashboardContext';
import TrackCard from '@/app/components/TrackCard';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

/* =========================================================
   UTILITÁRIOS
   ========================================================= */
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

function resolveTrackCover(track: any): string | null {
  if (!track) return null;
  if (track.album && typeof track.album === 'object') {
    return track.album.cover || track.album.coverUrl || null;
  }
  return track.cover || track.coverUrl || null;
}

function timeAgo(date: string | Date) {
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return then.toLocaleDateString('pt-BR');
}

/* =========================================================
   COMPONENTE PRINCIPAL
   ========================================================= */
export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const { token, user: currentUser } = useDashboard();
  const { play, currentTrack, isPlaying, setIsPlaying } = usePlayerStore();

  const [profile, setProfile] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [following, setFollowing] = useState(false);
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);

  /* ---------- FETCH ---------- */
  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    Promise.all([
      fetch(`${API_URL}/users/${username}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${API_URL}/users/${username}/activity`).then((r) =>
        r.ok ? r.json() : []
      ),
      fetch(`${API_URL}/users/${username}/posts`).then((r) =>
        r.ok ? r.json() : []
      ),
    ])
      .then(([profileRes, activityRes, postsRes]) => {
        if (cancelled) return;
        const user = profileRes?.data ?? profileRes;
        if (!user || !user._id) {
          setNotFound(true);
          return;
        }
        setProfile(user);
        setActivities(activityRes?.data ?? activityRes ?? []);
        setPosts(postsRes?.data ?? postsRes ?? []);
        setFollowing(!!user.followedByMe);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  /* ---------- DERIVADOS ---------- */
  const isOwnProfile = useMemo(() => {
    if (!currentUser || !profile) return false;
    return currentUser._id === profile._id;
  }, [currentUser, profile]);

  const totalPlays = useMemo(() => {
    return activities.reduce((sum, a) => sum + (a.durationPlayed || 0), 0);
  }, [activities]);

  /* ---------- HANDLERS ---------- */
  const handleFollow = async () => {
    if (!token || !profile || isOwnProfile) return;
    const prev = following;
    setFollowing(!prev);
    try {
      const endpoint = prev ? 'unfollow' : 'follow';
      await fetch(`${API_URL}/users/${profile._id}/${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      setFollowing(prev);
    }
  };

  const handlePlayActivity = (activity: any) => {
    const track = activity.track;
    if (!track) return;
    if (currentTrack?._id === track._id) {
      setIsPlaying(!isPlaying);
      return;
    }
    play(track, activities.map((a) => a.track).filter(Boolean));
  };

  /* ---------- LOADING / NOT FOUND ---------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-[3px] border-red-500/30 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-32 text-center">
        <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-2">
          <Users size={32} className="text-zinc-600" />
        </div>
        <p className="text-zinc-400 text-lg">Usuário não encontrado.</p>
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

  const avatar = profile.avatar || profile.profilePicture;
  const displayName = profile.displayName || profile.name || profile.username;

  return (
    <div className="max-w-screen-xl mx-auto pb-24 px-4 md:px-6 lg:px-0">
      {/* ===================== VOLTAR ===================== */}
      <button
        onClick={() => router.back()}
        className="group flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-all duration-300 mb-4 md:mb-5 w-fit"
      >
        <span className="w-7 h-7 rounded-full border border-zinc-800 group-hover:border-zinc-600 group-hover:bg-zinc-800/50 flex items-center justify-center transition-all duration-300">
          <ArrowLeft
            size={13}
            className="group-hover:-translate-x-0.5 transition-transform duration-300"
          />
        </span>
        <span className="font-medium">Voltar</span>
      </button>

      {/* ===================== HERO ===================== */}
      <div className="relative rounded-xl md:rounded-2xl overflow-hidden mb-6 md:mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-zinc-950/20" />

        <div className="relative p-5 md:p-7 flex flex-col lg:flex-row lg:items-end gap-5 lg:gap-8">
          {/* Esquerda: Avatar + Info */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 flex-1 min-w-0">
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shadow-xl shadow-black/40 ring-1 ring-white/10">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                    <Users size={32} className="text-zinc-600" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-[10px] font-bold uppercase tracking-[0.15em] text-white/80">
                  Perfil
                </span>
                {profile.verified && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/20 text-[10px] font-semibold text-blue-400">
                    <Users size={10} />
                    Verificado
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight mb-1 tracking-tight">
                {displayName}
              </h1>
              <p className="text-sm text-zinc-500 mb-3 font-medium">
                @{profile.username}
              </p>

              {profile.bio && (
                <p className="text-sm text-zinc-400 leading-relaxed mb-4 max-w-xl whitespace-pre-line">
                  {profile.bio}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3 text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Headphones size={12} />
                    <strong className="text-zinc-200">
                      {formatCompactNumber(profile.followersCount ?? profile.followers?.length ?? 0)}
                    </strong>{' '}
                    seguidores
                  </span>
                  <span className="w-1 h-1 rounded-full bg-zinc-700" />
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    <strong className="text-zinc-200">
                      {formatCompactNumber(profile.followingCount ?? profile.following?.length ?? 0)}
                    </strong>{' '}
                    seguindo
                  </span>
                  <span className="w-1 h-1 rounded-full bg-zinc-700" />
                  <span className="flex items-center gap-1">
                    <Music2 size={12} />
                    <strong className="text-zinc-200">
                      {formatCompactNumber(activities.length)}
                    </strong>{' '}
                    plays
                  </span>
                </div>

                {!isOwnProfile && token && (
                  <button
                    onClick={handleFollow}
                    className={`h-8 md:h-9 px-3 md:px-4 rounded-full border flex items-center gap-1.5 text-xs font-semibold transition-all duration-300 ml-auto sm:ml-0
                    ${
                      following
                        ? 'border-red-500/30 bg-red-500/10 text-red-400'
                        : 'border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:text-white hover:border-zinc-500'
                    }`}
                  >
                    {following ? (
                      <>
                        <UserCheck size={13} /> Seguindo
                      </>
                    ) : (
                      <>
                        <UserPlus size={13} /> Seguir
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Direita: Stats mini (desktop) */}
          <div className="hidden lg:flex flex-col gap-3 shrink-0 w-56">
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-0.5">
                    Seguidores
                  </p>
                  <p className="text-sm font-bold text-white">
                    {formatCompactNumber(profile.followersCount ?? profile.followers?.length ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-0.5">
                    Seguindo
                  </p>
                  <p className="text-sm font-bold text-white">
                    {formatCompactNumber(profile.followingCount ?? profile.following?.length ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-0.5">
                    Posts
                  </p>
                  <p className="text-sm font-bold text-white">
                    {formatCompactNumber(posts.length)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-0.5">
                    Minutos ouvidos
                  </p>
                  <p className="text-sm font-bold text-white">
                    {formatCompactNumber(Math.floor(totalPlays / 60))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== CONTEÚDO PRINCIPAL ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        {/* ---------- COLUNA ESQUERDA: Posts & Reposts ---------- */}
        <div className="min-w-0 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold tracking-tight">Posts</h2>
              {posts.length > 0 && (
                <span className="text-[11px] text-zinc-600 font-medium uppercase tracking-wider">
                  {posts.length} {posts.length === 1 ? 'publicação' : 'publicações'}
                </span>
              )}
            </div>

            {posts.length === 0 ? (
              <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/20 p-6 text-center">
                <MessageCircle size={28} className="text-zinc-700 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">
                  Este usuário ainda não fez nenhum post.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((post: any) => {
                  const isRepost = post.isRepost === true;
                  const original = post.originalPost || post;
                  const track = original.track;

                  return (
                    <div
                      key={post._id}
                      className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4 md:p-5 hover:bg-zinc-900/50 transition-colors duration-200"
                    >
                      {/* Cabeçalho */}
                      <div className="flex items-center gap-3 mb-3">
                        {/* Avatar do AUTOR ORIGINAL */}
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                          {original.author?.avatar ? (
                            <img
                              src={original.author.avatar}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Users size={14} className="text-zinc-600 m-auto" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Nome do AUTOR ORIGINAL */}
                            <span className="text-sm font-semibold text-zinc-200 truncate">
                              {original.author?.name || original.author?.username || 'Usuário'}
                            </span>

                            {/* Indicador de repost — mostra quem repostou */}
                            {isRepost && post.author && (
                              <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-medium">
                                <Repeat2 size={10} />
                                <span>
                                  {post.author.name || post.author.username || 'Usuário'} repostou
                                </span>
                              </span>
                            )}
                          </div>

                          {/* Data do post ORIGINAL */}
                          <span className="text-[11px] text-zinc-600">
                            {timeAgo(original.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Texto */}
                      {original.text && (
                        <p className="text-sm text-zinc-300 leading-relaxed mb-3 whitespace-pre-line">
                          {original.text}
                        </p>
                      )}

                      {/* ========== ATTACHMENTS (imagens/vídeos) ========== */}
                      {Array.isArray(original.attachments) && original.attachments.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {original.attachments.map((att: any, idx: number) => {
                            if (!att?.url) return null;

                            if (att.kind === 'image') {
                              return (
                                <div
                                  key={idx}
                                  className="rounded-xl overflow-hidden border border-zinc-800/50 bg-zinc-950"
                                >
                                  <img
                                    src={att.url}
                                    alt="Anexo"
                                    className="w-full max-h-[400px] object-cover"
                                    loading="lazy"
                                  />
                                </div>
                              );
                            }

                            if (att.kind === 'video') {
                              return (
                                <div
                                  key={idx}
                                  className="rounded-xl overflow-hidden border border-zinc-800/50 bg-zinc-950"
                                >
                                  <video
                                    src={att.url}
                                    controls
                                    className="w-full max-h-[400px]"
                                    preload="metadata"
                                  />
                                </div>
                              );
                            }

                            return null;
                          })}
                        </div>
                      )}

                      {/* Track anexada */}
                      {track && (
                        <div
                          className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-950/50 border border-zinc-800/50 cursor-pointer hover:border-zinc-700 transition-colors"
                          onClick={() =>
                            play(track, [track, ...activities.map((a) => a.track)].filter(Boolean))
                          }
                        >
                          <div className="w-10 h-10 rounded-md overflow-hidden bg-zinc-900 shrink-0">
                            {resolveTrackCover(track) ? (
                              <img
                                src={resolveTrackCover(track)!}
                                alt={track.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Music2 size={14} className="text-zinc-700 m-auto" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-200 truncate">
                              {track.title}
                            </p>
                            <p className="text-[11px] text-zinc-500 truncate">
                              {track.artistName ||
                                (Array.isArray(track.artists)
                                  ? track.artists
                                      .map((a: any) => (typeof a === 'string' ? a : a.name))
                                      .join(', ')
                                  : 'Artista desconhecido')}
                            </p>
                          </div>
                          <button className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center shrink-0 transition-colors">
                            <Play size={12} fill="white" className="text-white ml-0.5" />
                          </button>
                        </div>
                      )}

                      {/* Ações */}
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-800/50">
                        <button className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors">
                          <Heart size={14} />
                          {formatCompactNumber(original.likes?.length || 0)}
                        </button>
                        <button className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-sky-400 transition-colors">
                          <MessageCircle size={14} />
                          {formatCompactNumber(original.commentsCount || 0)}
                        </button>
                        <button className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-emerald-400 transition-colors">
                          <Repeat2 size={14} />
                          {formatCompactNumber(original.reposts?.length || 0)}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* ---------- COLUNA DIREITA ---------- */}
        <aside className="space-y-4 md:space-y-5">
          {/* Stats mobile/tablet */}
          <div className="lg:hidden rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-3 md:p-4">
            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-white">
                  {formatCompactNumber(profile.followersCount ?? profile.followers?.length ?? 0)}
                </p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Seguidores</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">
                  {formatCompactNumber(profile.followingCount ?? profile.following?.length ?? 0)}
                </p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Seguindo</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">
                  {formatCompactNumber(posts.length)}
                </p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Posts</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">
                  {formatCompactNumber(Math.floor(totalPlays / 60))}
                </p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Min</p>
              </div>
            </div>
          </div>

          {/* Últimas músicas escutadas */}
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-5">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-4 flex items-center gap-2">
                <Clock size={12} />
                Últimas tocadas
            </h3>

            {(() => {
                // Deduplica por música E por álbum, mantendo a mais recente de cada
                const seenTrackIds = new Set<string>();
                const seenAlbumIds = new Set<string>();
                const uniqueActivities: any[] = [];

                for (const activity of activities) {
                const track = activity.track;
                if (!track) continue;

                const trackId = track._id?.toString();
                const albumId =
                    track.album?._id?.toString() ||
                    (typeof track.album === 'string' ? track.album : null);

                if (seenTrackIds.has(trackId)) continue;
                if (albumId && seenAlbumIds.has(albumId)) continue;

                seenTrackIds.add(trackId);
                if (albumId) seenAlbumIds.add(albumId);
                uniqueActivities.push(activity);

                if (uniqueActivities.length >= 8) break;
                }

                if (uniqueActivities.length === 0) {
                return (
                    <div className="text-center py-4">
                    <Headphones size={24} className="text-zinc-700 mx-auto mb-2" />
                    <p className="text-xs text-zinc-500">Nenhuma atividade recente.</p>
                    </div>
                );
                }

                return (
                <div className="space-y-0.5">
                    {uniqueActivities.map((activity: any, i: number) => {
                    const track = activity.track;
                    const isCurrent = currentTrack?._id === track._id;
                    const isHovered = hoveredTrack === track._id;
                    const trackCover = resolveTrackCover(track);

                    return (
                        <div
                        key={activity._id || i}
                        className={`group/track flex h-14 items-center gap-2 md:gap-3 px-2 md:px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer
                            ${isCurrent ? 'bg-white/[0.04]' : 'hover:bg-white/[0.025]'}`}
                        onMouseEnter={() => setHoveredTrack(track._id)}
                        onMouseLeave={() => setHoveredTrack(null)}
                        onClick={() => handlePlayActivity(activity)}
                        >
                        <div className="w-5 md:w-6 flex items-center justify-center shrink-0">
                            {isCurrent && isPlaying ? (
                            <div className="flex items-end gap-[2px] h-3.5">
                                <span
                                className="w-[2.5px] bg-red-500 rounded-full animate-[music-bar_0.7s_ease-in-out_infinite]"
                                style={{ height: '60%' }}
                                />
                                <span
                                className="w-[2.5px] bg-red-500 rounded-full animate-[music-bar_0.5s_ease-in-out_infinite_0.1s]"
                                style={{ height: '100%' }}
                                />
                                <span
                                className="w-[2.5px] bg-red-500 rounded-full animate-[music-bar_0.8s_ease-in-out_infinite_0.2s]"
                                style={{ height: '40%' }}
                                />
                            </div>
                            ) : (
                            <span
                                className={`text-xs font-medium tabular-nums transition-colors duration-200
                                ${isCurrent ? 'text-red-500' : isHovered ? 'text-white' : 'text-zinc-600'}`}
                            >
                                {isHovered ? (
                                <Play size={11} fill="currentColor" />
                                ) : (
                                i + 1
                                )}
                            </span>
                            )}
                        </div>

                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-md overflow-hidden shrink-0 bg-zinc-900 ring-1 ring-white/5">
                            {trackCover ? (
                            <img
                                src={trackCover}
                                alt={track.title}
                                className="w-full h-full object-cover"
                            />
                            ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Music2 size={14} className="text-zinc-700" />
                            </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <p
                            className={`text-sm font-medium truncate ${
                                isCurrent ? 'text-red-400' : 'text-zinc-200 group-hover/track:text-white'
                            }`}
                            >
                            {track.title}
                            </p>
                            <p className="text-[11px] text-zinc-500 truncate">
                            {track.artistName ||
                                (Array.isArray(track.artists)
                                ? track.artists
                                    .map((a: any) => (typeof a === 'string' ? a : a.name))
                                    .join(', ')
                                : 'Artista desconhecido')}
                            </p>
                        </div>

                        <div className="flex flex-col items-end shrink-0">
                            <span className="text-[10px] text-zinc-600 font-medium tabular-nums">
                            {formatTrackTime(track.duration)}
                            </span>
                            <span className="text-[10px] text-zinc-700">
                            {timeAgo(activity.playedAt)}
                            </span>
                        </div>
                        </div>
                    );
                    })}
                </div>
                );
            })()}
            </div>

          {/* Top gêneros */}
          {Array.isArray(profile.topGenres) && profile.topGenres.length > 0 && (
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-5">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-3 flex items-center gap-2">
                <AudioLines size={12} />
                Top gêneros
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.topGenres.map((g: string) => (
                  <span
                    key={g}
                    className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] text-zinc-300 font-medium capitalize"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}