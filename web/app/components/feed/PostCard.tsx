// components/feed/PostCard.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Heart, Repeat2, Trash2, MessageCircle } from 'lucide-react';
import type { Post } from '@/app/(dashboard)/feed/hooks/usePosts';

interface PostCardProps {
  post:          Post;
  currentUserId: string;
  onLike:        (id: string) => void;
  onRepost:      (id: string) => void;
  onDelete:      (id: string) => Promise<boolean>;
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
  onLike,
  onRepost,
  onDelete,
}: PostCardProps) {
  const [deleting, setDeleting] = useState(false);

  const liked    = post.likes.includes(currentUserId);
  const reposted = post.reposts.includes(currentUserId);
  const isOwner  = post.author._id === currentUserId;

  async function handleDelete() {
    if (!confirm('Deletar esta postagem?')) return;
    setDeleting(true);
    await onDelete(post._id);
    // se falhar, o hook já reverte; não precisa fazer nada aqui
    setDeleting(false);
  }

  return (
    <article className="border-b border-zinc-800 px-5 py-4 hover:bg-zinc-900/40 transition-colors">

      {/* Cabeçalho */}
      <div className="flex items-start gap-3">
        <div className="relative w-10 h-10 shrink-0">
          <Image
            src={post.author.avatar || '/placeholder-avatar.png'}
            alt={post.author.name}
            fill
            className="rounded-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-sm text-white truncate">
              {post.author.name}
            </span>
            <span className="text-zinc-500 text-sm truncate">
              @{post.author.username}
            </span>
            <span className="text-zinc-600 text-xs">·</span>
            <span className="text-zinc-500 text-xs">{timeAgo(post.createdAt)}</span>
          </div>

          {/* Texto */}
          <p className="mt-1 text-[15px] text-zinc-100 whitespace-pre-wrap break-words leading-snug">
            {post.text}
          </p>

          {/* Ações */}
          <div className="mt-3 flex items-center gap-6">

            {/* Comentário (placeholder) */}
            <button
              className="flex items-center gap-1.5 text-zinc-500 hover:text-blue-400 transition-colors group"
              aria-label="Comentar"
            >
              <MessageCircle
                size={17}
                className="group-hover:scale-110 transition-transform"
              />
              <span className="text-xs">0</span>
            </button>

            {/* Repost */}
            <button
              onClick={() => onRepost(post._id)}
              className={`flex items-center gap-1.5 transition-colors group ${
                reposted
                  ? 'text-green-400'
                  : 'text-zinc-500 hover:text-green-400'
              }`}
              aria-label={reposted ? 'Remover repost' : 'Repostar'}
            >
              <Repeat2
                size={17}
                className="group-hover:scale-110 transition-transform"
              />
              <span className="text-xs">{post.reposts.length}</span>
            </button>

            {/* Curtida */}
            <button
              onClick={() => onLike(post._id)}
              className={`flex items-center gap-1.5 transition-colors group ${
                liked
                  ? 'text-red-500'
                  : 'text-zinc-500 hover:text-red-500'
              }`}
              aria-label={liked ? 'Descurtir' : 'Curtir'}
            >
              <Heart
                size={17}
                fill={liked ? 'currentColor' : 'none'}
                className="group-hover:scale-110 transition-transform"
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
                <Trash2 size={15} />
              </button>
            )}

          </div>
        </div>
      </div>
    </article>
  );
}
