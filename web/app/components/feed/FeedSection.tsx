// components/feed/FeedSection.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import FeedComposer from './composer/FeedComposer';
import FeedCard from './FeedCard';
import { useFeed } from '@/app/(dashboard)/feed/hooks/useFeed';
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

  /**
   * Resolve o ID do autor "real" do conteúdo — MESMA regra do FeedCard.
   * Se for repost com originalPost POPULADO, o alvo é o autor ORIGINAL.
   * Caso contrário, é o próprio autor do post.
   */
  const resolveTargetAuthorId = (post: any): string | null => {
    const candidate =
      post?.originalPost ?? post?.repostOf ?? post?.repost ?? null;

    const populated =
      candidate && typeof candidate === 'object' && !Array.isArray(candidate)
        ? candidate
        : null;

    const target = populated ? populated.author : post?.author;

    if (!target) return null;
    return typeof target === 'string' ? target : (target._id ?? null);
  };

  /**
   * Inicializa o followState com o que a API já sabe (author.isFollowedByMe),
   * sem sobrescrever toggles que o usuário já fez nessa sessão.
   */
  useEffect(() => {
    setFollowState((prev) => {
      const next = { ...prev };

      posts.forEach((post: any) => {
        const targetAuthorId = resolveTargetAuthorId(post);
        const authorObj =
          post?.originalPost && typeof post.originalPost === 'object'
            ? post.originalPost.author
            : post?.author;

        if (
          targetAuthorId &&
          !(targetAuthorId in next) &&
          authorObj &&
          typeof authorObj === 'object' &&
          'isFollowedByMe' in authorObj
        ) {
          next[targetAuthorId] = Boolean(authorObj.isFollowedByMe);
        }
      });

      return next;
    });
  }, [posts]);

  const handleFollowToggle = useCallback(
    async (userId: string) => {
      if (!token) return;

      const currentlyFollowing = followState[userId] ?? false;
      const method = currentlyFollowing ? 'DELETE' : 'POST';

      const res = await fetch(`${API_URL}/users/${userId}/follow`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Falha ao seguir/deixar de seguir');

      setFollowState((prev) => ({ ...prev, [userId]: !currentlyFollowing }));
    },
    [token, followState]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadingMore) loadMore();
      },
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
            <p className="text-zinc-600 text-xs mt-1">
              Seja o primeiro a compartilhar algo!
            </p>
          </div>
        )}

        {/* Posts */}
        {!loading &&
          posts.map((post) => {
            const targetAuthorId = resolveTargetAuthorId(post);

            return (
              <FeedCard
                key={post._id}
                post={post}
                currentUserId={currentUserId}
                isFollowing={
                  targetAuthorId
                    ? (followState[targetAuthorId] ?? false)
                    : false
                }
                onFollowToggle={handleFollowToggle}
                onLike={toggleLike}
                onRepost={toggleRepost}
                onDelete={deletePost}
              />
            );
          })}

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