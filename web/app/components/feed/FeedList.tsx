'use client';

import PostCard from './PostCard';
import FeedCard from './FeedCard';
import type { Post } from '@/app/(dashboard)/feed/hooks/usePosts';

interface FeedListProps {
  posts:         Post[];
  loading:       boolean;
  error:         string | null;
  onToggleLike:  (postId: string, currentUserId: string) => void;
}

export default function FeedList({ posts, loading, error, onToggleLike }: FeedListProps) {

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden divide-y divide-zinc-800">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="px-5 py-4 animate-pulse flex gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 rounded bg-zinc-800" />
              <div className="h-3 w-full rounded bg-zinc-800" />
              <div className="h-3 w-3/4 rounded bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-zinc-500 text-sm text-center py-8">{error}</p>
    );
  }

  if (!posts.length) {
    return (
      <p className="text-zinc-500 text-sm text-center py-8">
        Nenhuma postagem ainda. Seja o primeiro a compartilhar algo!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <FeedCard
          key={post._id}
          post={post}
          onToggleLike={onToggleLike}
        />
      ))}
    </div>
  );
}
