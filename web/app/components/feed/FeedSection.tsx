// components/feed/FeedSection.tsx
'use client';

import { useEffect, useRef } from 'react';
import FeedComposer from './composer/FeedComposer';
import PostCard     from './PostCard';
import { useFeed }  from '@/app/(dashboard)/feed/hooks/useFeed';

interface FeedSectionProps {
  currentUserId: string;
}

export default function FeedSection({ currentUserId }: FeedSectionProps) {
  const {
    posts,
    loading,
    loadingMore,
    error,
    hasMore,
    createPost,
    toggleLike,
    toggleRepost,
    deletePost,
    loadMore,
    refresh,
  } = useFeed(currentUserId);

  // ── Scroll infinito via IntersectionObserver ──────────────────────────────
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !loadingMore) loadMore(); },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, loadingMore]);

  return (
    <section className="w-full max-w-[582px]">

      {/* Composer */}
      <FeedComposer onPost={createPost} />

      {/* Lista de posts */}
      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden">

        {/* Skeleton de carregamento inicial */}
        {loading && (
          <div className="divide-y divide-zinc-800">
            {Array.from({ length: 5 }).map((_, i) => (
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
        )}

        {/* Erro */}
        {!loading && error && (
          <div className="py-10 text-center">
            <p className="text-zinc-400 text-sm">{error}</p>
            <button
              onClick={refresh}
              className="mt-3 text-red-500 text-sm hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Feed vazio */}
        {!loading && !error && posts.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-zinc-500 text-sm">Nenhuma publicação ainda.</p>
            <p className="text-zinc-600 text-xs mt-1">Seja o primeiro a compartilhar algo!</p>
          </div>
        )}

        {/* Posts */}
        {!loading && posts.map(post => (
          <PostCard
            key={post._id}
            post={post}
            currentUserId={currentUserId}
            onLike={toggleLike}
            onRepost={toggleRepost}
            onDelete={deletePost}
          />
        ))}

        {/* Sentinel para scroll infinito */}
        {!loading && hasMore && (
          <div ref={sentinelRef} className="py-4 flex justify-center">
            {loadingMore && (
              <div className="w-5 h-5 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin" />
            )}
          </div>
        )}

        {/* Fim da lista */}
        {!loading && !hasMore && posts.length > 0 && (
          <p className="py-6 text-center text-xs text-zinc-600">
            Você chegou ao fim do feed.
          </p>
        )}

      </div>
    </section>
  );
}
