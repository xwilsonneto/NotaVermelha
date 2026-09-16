'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link'; // <-- Import adicionado para navegação
import {
  Heart,
  MessageCircle,
  Repeat2,
  Share,
  Music2,
  Play,
  UserPlus,
  UserCheck,
} from 'lucide-react';

import { usePlayerStore } from '@/app/store/playerStore';
import type { Post } from '@/app/(dashboard)/feed/hooks/usePosts';

function useCurrentUserId(): string {
  const [userId, setUserId] = useState('');

  useEffect(() => {
    setUserId(localStorage.getItem('userId') ?? '');
  }, []);

  return userId;
}

function timeAgo(dateString?: string): string {
  if (!dateString) return '';
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function formatCompactNumber(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(1).replace('.0', '')}k`;
  return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M`;
}

function resolveTrackCover(track: any): string | null {
  if (!track) return null;
  if (track.album && typeof track.album === 'object') {
    return track.album.cover || track.album.coverUrl || null;
  }
  return track.cover || track.coverUrl || null;
}

function resolveOriginal(post: any) {
  const candidate =
    post?.originalPost ??
    post?.repostOf ??
    post?.repost ??
    post?.sharedPost ??
    null;

  const populated =
    candidate && typeof candidate === 'object' && !Array.isArray(candidate)
      ? candidate
      : null;

  const brokenRepost = Boolean(post?.isRepost) && !populated;

  return {
    isRepost: Boolean(populated || post?.isRepost),
    original: populated ?? post,
    brokenRepost,
  };
}

interface FeedCardProps {
  post: Post;
  currentUserId?: string;
  isFollowing?: boolean;
  onFollowToggle?: (userId: string) => void;
  onLike: (postId: string, currentUserId: string) => void;
  onRepost?: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

export default function FeedCard({
  post,
  currentUserId: currentUserIdProp,
  isFollowing = false,
  onFollowToggle,
  onLike,
  onRepost,
  onDelete,
}: FeedCardProps) {
  const currentUserId = currentUserIdProp ?? useCurrentUserId();
  const { play, currentTrack } = usePlayerStore();

  const { isRepost, original, brokenRepost } = resolveOriginal(post);

  /* ---------- REPOST QUEBRADO / ORIGINAL DELETADO ---------- */
  if (brokenRepost) {
    return (
      <article className="rounded-xl w-full border border-zinc-800 bg-zinc-950 p-4">
        <p className="text-xs text-zinc-600">Publicação original indisponível.</p>
      </article>
    );
  }

  /* ---------- AUTORES ---------- */
  const author = original.author ?? (post as any).author;
  const reposter = isRepost && original !== post ? (post as any).author : null;

  const likes: string[] = original.likes ?? [];
  const liked = currentUserId ? likes.includes(currentUserId) : false;
  const reposts: string[] = original.reposts ?? [];
  const hasReposted = currentUserId ? reposts.includes(currentUserId) : false;

  const targetId = original._id ?? (post as any)._id;

  const authorId =
    typeof author === 'string' ? author : author?._id ?? null;

  const isOwnPost = currentUserId && authorId === currentUserId;

  const track = original.track;

  /* ---------- CORREÇÃO 2: ESTADO DE SEGUIR ---------- */
  // Verifica se a prop isFollowing é verdadeira OU se o objeto author já contém o currentUserId na lista de seguidores
  const derivedFollowing = isFollowing || 
    (author && typeof author === 'object' && Array.isArray(author.followers) && currentUserId 
      ? author.followers.includes(currentUserId) 
      : false);

  const [isFollowingState, setIsFollowingState] = useState(derivedFollowing);

  useEffect(() => {
    setIsFollowingState(derivedFollowing);
  }, [derivedFollowing]);

  const handleFollowClick = () => {
    if (!authorId) return;
    // Atualização otimista do estado local
    setIsFollowingState(!isFollowingState);
    onFollowToggle?.(authorId);
  };

  return (
    <article className="rounded-xl w-full border border-zinc-800 bg-zinc-950 overflow-hidden">

      <div className="p-3 md:p-4">
        <div className="flex gap-2.5 md:gap-3">

          {/* ---------- CORREÇÃO 1: AVATAR COM LINK ---------- */}
          <Link 
            href={author?.username ? `/${author.username}` : '#'} 
            className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-zinc-800 shrink-0 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
          >
            {author?.avatar ? (
              <img
                src={author.avatar}
                alt={author.name ?? author.username ?? ''}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UserCheck size={0} className="hidden" />
              </div>
            )}
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
              <span className="font-semibold text-sm md:text-[15px] truncate">
                {author?.name || author?.username || 'Usuário'}
              </span>

              {author?.username && (
                <span className="text-zinc-500 text-xs md:text-sm">
                  @{author.username}
                </span>
              )}

              {reposter && (
                <span className="flex items-center gap-1 text-[10px] md:text-xs text-zinc-500 font-medium">
                  <Repeat2 size={10} />
                  <span>
                    {reposter.name || reposter.username || 'Usuário'} repostou
                  </span>
                </span>
              )}

              <span className="text-zinc-600 text-[10px] md:text-xs ml-auto shrink-0">
                {timeAgo(original.createdAt ?? (post as any).createdAt)}
              </span>
            </div>

            {original.text && (
              <p className="mt-1 text-sm md:text-[15px] leading-6 whitespace-pre-wrap">
                {original.text}
              </p>
            )}

            {Array.isArray(original.attachments) &&
              original.attachments.length > 0 && (
                <div className="space-y-2 mt-3">
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

            {track && (
              <div
                className={`flex items-center gap-3 p-2.5 mt-3 rounded-lg bg-zinc-900/50 border transition-colors ${
                  currentTrack?._id === track._id
                    ? 'border-red-500/40'
                    : 'border-zinc-800/50 hover:border-zinc-700'
                } cursor-pointer`}
                onClick={() => play(track, [track])}
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
                            .map((a: any) =>
                              typeof a === 'string' ? a : a.name
                            )
                            .join(', ')
                        : 'Artista desconhecido')}
                  </p>
                </div>
                <button className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center shrink-0 transition-colors">
                  <Play size={12} fill="white" className="text-white ml-0.5" />
                </button>
              </div>
            )}
          </div>

          <div className="shrink-0">
            {isOwnPost && onDelete ? (
              <button
                onClick={() => onDelete(targetId)}
                className="text-[10px] md:text-xs text-zinc-600 hover:text-red-400 transition-colors"
              >
                Excluir
              </button>
            ) : (
              !isOwnProfileGuard(isOwnPost) &&
              authorId &&
              onFollowToggle && (
                <button
                  onClick={handleFollowClick}
                  className={`flex items-center gap-1 px-2.5 md:px-3 h-7 md:h-8 rounded-full border text-[10px] md:text-xs font-semibold transition-all duration-300 ${
                    isFollowingState
                      ? 'border-red-500/30 bg-red-500/10 text-red-400'
                      : 'border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:text-white hover:border-zinc-500'
                  }`}
                >
                  {isFollowingState ? (
                    <>
                      <UserCheck size={12} /> Seguindo
                    </>
                  ) : (
                    <>
                      <UserPlus size={12} /> Seguir
                    </>
                  )}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-800 h-10 md:h-11 px-3 md:px-4 flex items-center gap-5 md:gap-8">

        <button
          onClick={() => onLike(targetId, currentUserId)}
          className={`flex items-center gap-1 md:gap-1.5 transition ${
            liked ? 'text-red-400' : 'text-zinc-500 hover:text-red-400'
          }`}
        >
          <Heart
            size={16}
            className="md:w-[18px] md:h-[18px]"
            fill={liked ? 'currentColor' : 'none'}
          />
          {likes.length > 0 && (
            <span className="text-xs">{formatCompactNumber(likes.length)}</span>
          )}
        </button>

        <button className="flex items-center gap-1 md:gap-1.5 text-xs text-zinc-500 hover:text-blue-400 transition">
          <MessageCircle size={16} className="md:w-[18px] md:h-[18px]" />
          {(original.commentsCount ?? 0) > 0 && (
            <span>{formatCompactNumber(original.commentsCount)}</span>
          )}
        </button>

        <button
          onClick={() => onRepost?.(targetId)}
          className={`flex items-center gap-1 md:gap-1.5 text-xs transition ${
            hasReposted
              ? 'text-emerald-400'
              : 'text-zinc-500 hover:text-emerald-400'
          }`}
        >
          <Repeat2 size={16} className="md:w-[18px] md:h-[18px]" />
          {reposts.length > 0 && (
            <span>{formatCompactNumber(reposts.length)}</span>
          )}
        </button>

        <button className="flex items-center gap-1.5 md:gap-2 text-zinc-500 hover:text-white transition">
          <Share size={16} className="md:w-[18px] md:h-[18px]" />
        </button>
      </div>
    </article>
  );
}

function isOwnProfileGuard(isOwn: boolean | ''): boolean {
  return Boolean(isOwn);
}