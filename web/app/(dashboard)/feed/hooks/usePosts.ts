// web/app/(dashboard)/feed/hooks/usePosts.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface PostAuthor {
  _id:      string;
  name:     string;
  username: string;
  avatar?:  string;
}

export interface Post {
  _id:         string;
  text:        string;
  type:        'text' | 'music' | 'event';
  author:      PostAuthor;
  likes:       string[];
  reposts:     string[];
  createdAt:   string;
  attachments: unknown[];
}

export function usePosts(currentUserId: string) {
  const [posts,       setPosts]       = useState<Post[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [hasMore,     setHasMore]     = useState(true);
  const [nextCursor,  setNextCursor]  = useState<string | null>(null);

  const fetchingRef = useRef(false);

  // ── Carregar feed ────────────────────────────────────────────────────────────
  const fetchPosts = useCallback(async (reset = true) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    if (reset) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const cursor = reset ? null : nextCursor;
      const url    = `/api/feed/cursor${cursor ? `?cursor=${cursor}` : ''}`;
      const res    = await fetch(url, { credentials: 'include' });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Erro ${res.status} ao carregar o feed.`);
      }

      const data = await res.json();

      setPosts(prev => reset ? data.posts : [...prev, ...data.posts]);
      setHasMore(data.hasMore ?? false);
      setNextCursor(data.nextCursor ?? null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar o feed.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      fetchingRef.current = false;
    }
  }, [nextCursor]);

  useEffect(() => { fetchPosts(true); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Criar post ───────────────────────────────────────────────────────────────
  const createPost = useCallback(async (text: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/posts', {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ text }),
      });

      // ✅ Lê o body UMA única vez
      const data = await res.json();

      if (!res.ok) throw new Error(data.message ?? 'Erro ao publicar.');

      setPosts(prev => [data.post, ...prev]);
      return true;
    } catch (err) {
      console.error('[createPost]', err);
      return false;
    }
  }, []);

  // ── Curtir / descurtir ───────────────────────────────────────────────────────
  const toggleLike = useCallback(async (postId: string) => {
    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p._id !== postId) return p;
      const liked = p.likes.includes(currentUserId);
      return {
        ...p,
        likes: liked
          ? p.likes.filter(id => id !== currentUserId)
          : [...p.likes, currentUserId],
      };
    }));

    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST', credentials: 'include',
      });
      if (!res.ok) throw new Error();
    } catch {
      fetchPosts(true); // reverte
    }
  }, [currentUserId, fetchPosts]);

  // ── Repostar ─────────────────────────────────────────────────────────────────
  const toggleRepost = useCallback(async (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p._id !== postId) return p;
      const reposted = p.reposts.includes(currentUserId);
      return {
        ...p,
        reposts: reposted
          ? p.reposts.filter(id => id !== currentUserId)
          : [...p.reposts, currentUserId],
      };
    }));

    try {
      const res = await fetch(`/api/posts/${postId}/repost`, {
        method: 'POST', credentials: 'include',
      });
      if (!res.ok) throw new Error();
    } catch {
      fetchPosts(true);
    }
  }, [currentUserId, fetchPosts]);

  // ── Deletar ──────────────────────────────────────────────────────────────────
  const deletePost = useCallback(async (postId: string): Promise<boolean> => {
    setPosts(prev => prev.filter(p => p._id !== postId));

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (!res.ok) throw new Error();
      return true;
    } catch {
      fetchPosts(true);
      return false;
    }
  }, [fetchPosts]);

  // ── Carregar mais (scroll infinito) ─────────────────────────────────────────
  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;
    fetchPosts(false);
  }, [hasMore, loadingMore, loading, fetchPosts]);

  return {
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
    refresh: () => fetchPosts(true),
  };
}