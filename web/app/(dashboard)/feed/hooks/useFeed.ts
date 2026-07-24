// hooks/useFeed.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('nota-vermelha-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.token ?? null;
  } catch {
    return null;
  }
};

const authHeader = () => {
  const token = getStoredToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface PostAuthor {
  _id:      string;
  name:     string;
  username: string;
  avatar:   string;
}

export interface Post {
  _id:         string;
  text:        string;
  author:      PostAuthor;
  likes:       string[];
  reposts:     string[];
  createdAt:   string;
  type:        'text' | 'music' | 'event';
  attachments: unknown[];
}

interface FeedState {
  posts:       Post[];
  loading:     boolean;
  loadingMore: boolean;
  error:       string | null;
  hasMore:     boolean;
}

export function useFeed(currentUserId: string) {
  const [state, setState] = useState<FeedState>({
    posts:       [],
    loading:     true,
    loadingMore: false,
    error:       null,
    hasMore:     true,
  });

  const loadingRef    = useRef(false);
  const nextCursorRef = useRef<string | null>(null);
  const hasMoreRef    = useRef(true);

  const loadFeed = useCallback(async (reset = true) => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    setState(prev => ({
      ...prev,
      loading:     reset,
      loadingMore: !reset,
      error:       null,
    }));

    try {
      const cursor = reset ? '' : (nextCursorRef.current ?? '');
      const url    = `${API_URL}/feed/cursor${cursor ? `?cursor=${cursor}` : ''}`;
      const res    = await fetch(url, { headers: authHeader() });

      if (!res.ok) throw new Error('Erro ao carregar o feed.');

      const data = await res.json();

      nextCursorRef.current = data.nextCursor ?? null;
      hasMoreRef.current    = data.hasMore    ?? false;

      setState(prev => ({
        ...prev,
        posts:       reset ? data.posts : [...prev.posts, ...data.posts],
        hasMore:     data.hasMore,
        loading:     false,
        loadingMore: false,
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading:     false,
        loadingMore: false,
        error:       err instanceof Error ? err.message : 'Falha ao carregar o feed.',
      }));
    } finally {
      loadingRef.current = false;
    }
  }, []);

  const createPost = useCallback(async (text: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/posts`, {
        method:  'POST',
        headers: authHeader(),
        body:    JSON.stringify({ text }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Erro ao publicar.');

      setState(prev => ({ ...prev, posts: [data.post, ...prev.posts] }));
      return true;
    } catch (err) {
      console.error('[createPost]', err);
      return false;
    }
  }, []);

  const toggleLike = useCallback(async (postId: string) => {
    setState(prev => ({
      ...prev,
      posts: prev.posts.map(p => {
        if (p._id !== postId) return p;
        const liked = p.likes.includes(currentUserId);
        return {
          ...p,
          likes: liked
            ? p.likes.filter(id => id !== currentUserId)
            : [...p.likes, currentUserId],
        };
      }),
    }));

    try {
      const res = await fetch(`${API_URL}/posts/${postId}/like`, {
        method:  'POST',
        headers: authHeader(),
      });
      if (!res.ok) throw new Error();

      const { likesCount, liked } = await res.json();

      setState(prev => ({
        ...prev,
        posts: prev.posts.map(p => {
          if (p._id !== postId) return p;
          const likes = liked
            ? [...p.likes.filter(id => id !== currentUserId), currentUserId]
            : p.likes.filter(id => id !== currentUserId);
          return { ...p, likes: likes.slice(0, likesCount) };
        }),
      }));
    } catch {
      loadFeed(true);
    }
  }, [currentUserId, loadFeed]);

  const toggleRepost = useCallback(async (postId: string) => {
    setState(prev => ({
      ...prev,
      posts: prev.posts.map(p => {
        if (p._id !== postId) return p;
        const reposted = p.reposts.includes(currentUserId);
        return {
          ...p,
          reposts: reposted
            ? p.reposts.filter(id => id !== currentUserId)
            : [...p.reposts, currentUserId],
        };
      }),
    }));

    try {
      const res = await fetch(`${API_URL}/posts/${postId}/repost`, {
        method:  'POST',
        headers: authHeader(),
      });
      if (!res.ok) throw new Error();
    } catch {
      loadFeed(true);
    }
  }, [currentUserId, loadFeed]);

  const deletePost = useCallback(async (postId: string): Promise<boolean> => {
    setState(prev => ({
      ...prev,
      posts: prev.posts.filter(p => p._id !== postId),
    }));

    try {
      const res = await fetch(`${API_URL}/posts/${postId}`, {
        method:  'DELETE',
        headers: authHeader(),
      });
      if (!res.ok) throw new Error();
      return true;
    } catch {
      loadFeed(true);
      return false;
    }
  }, [loadFeed]);

  const loadMore = useCallback(() => {
    if (!hasMoreRef.current || loadingRef.current) return;
    loadFeed(false);
  }, [loadFeed]);

  useEffect(() => {
    loadFeed(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...state,
    createPost,
    toggleLike,
    toggleRepost,
    deletePost,
    loadMore,
    refresh: () => loadFeed(true),
  };
}