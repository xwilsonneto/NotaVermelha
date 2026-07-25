// components/feed/FeedSection.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import FeedComposer from './composer/FeedComposer';
import PostCard     from './PostCard';
import { useFeed }  from '@/app/(dashboard)/feed/hooks/useFeed';
import { useDashboard } from '@/app/(dashboard)/DashboardContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

interface FeedSectionProps {
  currentUserId: string;
}

export default function FeedSection({ currentUserId }: FeedSectionProps) {
  const { token } = useDashboard();
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

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Estado local de follow por autor de post
  const [followState, setFollowState] = useState<Record<string, boolean>>({});

  const handleFollowToggle = useCallback(async (userId: string) => {
    if (!token) return;

    const currentlyFollowing = followState[userId] ?? false;
    const method = currentlyFollowing ? 'DELETE' : 'POST';

    const res = await fetch(`${API_URL}/users/${userId}/follow`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error('Falha ao seguir/deixar de seguir');

    setFollowState((prev) => ({ ...prev, [userId]: !currentlyFollowing }));
  }, [token, followState]);

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

  const handleCreatePost = async (
    text: string,
    attachments?: { kind: string; url: string }[]
  ) => {
    return createPost(text, attachments);
  };

  return (
    <section className="w-full max-w-[582px]">

      {/* Composer */}
      <FeedComposer onPost={handleCreatePost} />

      {/* Lista de posts */}
      <div className="mt-4 md:mt-6 rounded-xl md:rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden">

        {/* Skeleton de carregamento inicial */}
        {loading && (
          <div className="divide-y divide-zinc-800">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 md:px-5 py-3 md:py-4 animate-pulse flex gap-3">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-zinc-800 shrink-0" />
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
            isFollowing={followState[post.author._id] ?? false}
            onFollowToggle={handleFollowToggle}
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