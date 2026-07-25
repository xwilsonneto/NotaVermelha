'use client';

import { Heart, MessageCircle, Repeat2, Share } from 'lucide-react';
import type { Post } from '@/app/(dashboard)/feed/hooks/usePosts';

function useCurrentUserId(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userId') ?? '';
  }
  return '';
}

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1)  return 'agora';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)   return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

interface FeedCardProps {
  post: Post;
  onToggleLike: (postId: string, currentUserId: string) => void;
}

export default function FeedCard({ post, onToggleLike }: FeedCardProps) {
  const currentUserId = useCurrentUserId();
  const liked = post.likes.includes(currentUserId);

  return (
    <article className="rounded-xl w-full border border-zinc-800 bg-zinc-950 overflow-hidden">

      <div className="p-3 md:p-4">
        <div className="flex gap-2.5 md:gap-3">

          {/* Avatar */}
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-zinc-800 shrink-0 overflow-hidden">
            {post.author.avatar && (
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 md:gap-2">
              <span className="font-semibold text-sm md:text-[15px]">
                {post.author.name}
              </span>
              <span className="text-zinc-500 text-xs md:text-sm">
                @{post.author.username}
              </span>
              <span className="text-zinc-600 text-[10px] md:text-xs ml-auto">
                {timeAgo(post.createdAt)}
              </span>
            </div>

            <p className="mt-1 text-sm md:text-[15px] leading-6 whitespace-pre-wrap">
              {post.text}
            </p>
          </div>

        </div>
      </div>

      <div className="border-t border-zinc-800 h-10 md:h-11 px-3 md:px-4 flex items-center gap-5 md:gap-8">

        <button
          onClick={() => onToggleLike(post._id, currentUserId)}
          className={`flex items-center gap-1 md:gap-1.5 transition ${
            liked ? 'text-red-400' : 'text-zinc-500 hover:text-red-400'
          }`}
        >
          <Heart size={16} className="md:w-[18px] md:h-[18px]" fill={liked ? 'currentColor' : 'none'} />
          {post.likes.length > 0 && (
            <span className="text-xs">{post.likes.length}</span>
          )}
        </button>

        <button className="flex items-center gap-1.5 md:gap-2 text-zinc-500 hover:text-blue-400 transition">
          <MessageCircle size={16} className="md:w-[18px] md:h-[18px]" />
        </button>

        <button className="flex items-center gap-1.5 md:gap-2 text-zinc-500 hover:text-green-400 transition">
          <Repeat2 size={16} className="md:w-[18px] md:h-[18px]" />
        </button>

        <button className="flex items-center gap-1.5 md:gap-2 text-zinc-500 hover:text-white transition">
          <Share size={16} className="md:w-[18px] md:h-[18px]" />
        </button>

      </div>

    </article>
  );
}