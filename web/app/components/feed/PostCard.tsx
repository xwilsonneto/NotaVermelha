// components/feed/PostCard.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Heart, Repeat2, Trash2, MessageCircle, X, UserPlus, UserCheck } from 'lucide-react';
import type { Post } from '@/app/(dashboard)/feed/hooks/usePosts';

interface PostCardProps {
  post:            Post;
  currentUserId:   string;
  isFollowing?:    boolean;          // se o usuário logado segue o autor
  onFollowToggle?: (userId: string) => Promise<void>; // chamada à API
  onLike:          (id: string) => void;
  onRepost:        (id: string) => void;
  onDelete:        (id: string) => Promise<boolean>;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m    = Math.floor(diff / 60_000);
  if (m < 1)   return 'agora';
  if (m < 60)  return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export default function PostCard({
  post,
  currentUserId,
  isFollowing = false,
  onFollowToggle,
  onLike,
  onRepost,
  onDelete,
}: PostCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [following, setFollowing] = useState(isFollowing);
  const [followLoading, setFollowLoading] = useState(false);

  const liked    = post.likes.includes(currentUserId);
  const reposted = post.reposts.includes(currentUserId);
  const isOwner  = post.author._id === currentUserId;

  const imageAttachments = (post.attachments ?? []).filter(
    (att: any) => att.kind === 'image' && att.url
  );

  function goToProfile(e: React.MouseEvent) {
    e.stopPropagation();
    router.push(`/${post.author.username}`);
  }

  async function handleFollow(e: React.MouseEvent) {
    e.stopPropagation();
    if (!onFollowToggle || isOwner || followLoading) return;

    const prev = following;
    setFollowLoading(true);
    try {
      await onFollowToggle(post.author._id);
      setFollowing(!prev);
    } catch {
      // erro silencioso — o pai deve toastar se quiser
    } finally {
      setFollowLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Deletar esta postagem?')) return;
    setDeleting(true);
    await onDelete(post._id);
    setDeleting(false);
  }

  return (
    <>
      <article className="border-b border-zinc-800 px-3 md:px-5 py-3 md:py-4 hover:bg-zinc-900/40 transition-colors">

        {/* Cabeçalho */}
        <div className="flex items-start gap-2.5 md:gap-3">
          {/* Avatar clicável */}
          <button
            onClick={goToProfile}
            className="relative w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-full overflow-hidden hover:ring-2 hover:ring-red-500/40 transition-all"
          >
            <Image
              src={post.author.avatar || '/placeholder-avatar.png'}
              alt={post.author.name}
              fill
              className="object-cover"
            />
          </button>

          <div className="flex-1 min-w-0">
            {/* Linha superior: info + botão seguir */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 md:gap-1.5 flex-wrap min-w-0">
                {/* Nome clicável */}
                <button
                  onClick={goToProfile}
                  className="font-semibold text-sm text-white truncate hover:underline"
                >
                  {post.author.name}
                </button>

                {/* @username clicável */}
                <button
                  onClick={goToProfile}
                  className="text-zinc-500 text-xs md:text-sm truncate hover:text-zinc-300 transition-colors"
                >
                  @{post.author.username}
                </button>

                <span className="text-zinc-600 text-xs">·</span>
                <span className="text-zinc-500 text-[10px] md:text-xs">{timeAgo(post.createdAt)}</span>
              </div>

              {/* Botão Seguir (não aparece no próprio post) */}
              {!isOwner && onFollowToggle && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`shrink-0 h-7 px-2.5 rounded-full border text-[11px] font-semibold flex items-center gap-1 transition-all duration-200
                    ${following
                      ? 'border-zinc-700 bg-transparent text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                      : 'border-zinc-600 bg-zinc-800/50 text-zinc-200 hover:bg-zinc-700 hover:text-white hover:border-zinc-500'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {followLoading ? (
                    <span className="w-3 h-3 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
                  ) : following ? (
                    <>
                      <UserCheck size={12} />
                      <span className="hidden sm:inline">Seguindo</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={12} />
                      <span>Seguir</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Texto */}
            <p className="mt-1 text-sm md:text-[15px] text-zinc-100 whitespace-pre-wrap break-words leading-snug">
              {post.text}
            </p>

            {/* ── IMAGENS DO POST ─────────────────────────────────── */}
            {imageAttachments.length > 0 && (
              <div
                className={`mt-2.5 md:mt-3 grid gap-0.5 md:gap-1 rounded-xl overflow-hidden border border-zinc-800 ${
                  imageAttachments.length === 1
                    ? 'grid-cols-1'
                    : imageAttachments.length === 2
                    ? 'grid-cols-2'
                    : imageAttachments.length === 3
                    ? 'grid-cols-2'
                    : 'grid-cols-2'
                }`}
              >
                {imageAttachments.map((att: any, i: number) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLightbox(att.url)}
                    className={`relative bg-zinc-900 ${
                      imageAttachments.length === 3 && i === 0 ? 'row-span-2' : ''
                    }`}
                  >
                    <img
                      src={att.url}
                      alt=""
                      className="w-full h-40 md:h-52 sm:h-44 object-cover hover:opacity-90 transition"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Ações */}
            <div className="mt-2.5 md:mt-3 flex items-center gap-4 md:gap-6">

              {/* Comentário */}
              <button
                className="flex items-center gap-1 md:gap-1.5 text-zinc-500 hover:text-blue-400 transition-colors group"
                aria-label="Comentar"
              >
                <MessageCircle
                  size={16}
                  className="md:w-[17px] md:h-[17px] group-hover:scale-110 transition-transform"
                />
                <span className="text-xs">0</span>
              </button>

              {/* Repost */}
              <button
                onClick={() => onRepost(post._id)}
                className={`flex items-center gap-1 md:gap-1.5 transition-colors group ${
                  reposted
                    ? 'text-green-400'
                    : 'text-zinc-500 hover:text-green-400'
                }`}
                aria-label={reposted ? 'Remover repost' : 'Repostar'}
              >
                <Repeat2
                  size={16}
                  className="md:w-[17px] md:h-[17px] group-hover:scale-110 transition-transform"
                />
                <span className="text-xs">{post.reposts.length}</span>
              </button>

              {/* Curtida */}
              <button
                onClick={() => onLike(post._id)}
                className={`flex items-center gap-1 md:gap-1.5 transition-colors group ${
                  liked
                    ? 'text-red-500'
                    : 'text-zinc-500 hover:text-red-500'
                }`}
                aria-label={liked ? 'Descurtir' : 'Curtir'}
              >
                <Heart
                  size={16}
                  fill={liked ? 'currentColor' : 'none'}
                  className="md:w-[17px] md:h-[17px] group-hover:scale-110 transition-transform"
                />
                <span className="text-xs">{post.likes.length}</span>
              </button>

              {/* Delete (só para o autor) */}
              {isOwner && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="ml-auto flex items-center gap-1 text-zinc-600 hover:text-red-500 transition-colors disabled:opacity-40"
                  aria-label="Deletar postagem"
                >
                  <Trash2 size={14} className="md:w-[15px] md:h-[15px]" />
                </button>
              )}

            </div>
          </div>
        </div>
      </article>

      {/* ── LIGHTBOX ──────────────────────────────────────────────── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-zinc-800/80 text-white flex items-center justify-center hover:bg-zinc-700 transition"
          >
            <X size={20} />
          </button>
          <img
            src={lightbox}
            alt=""
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}