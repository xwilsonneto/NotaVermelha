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

export interface PostAttachment {
  kind: string;   // 'image' | 'video'
  url:  string;
  meta?: any;
}

export interface Post {
  _id:            string;
  text:           string;
  author:         PostAuthor;
  likes:          string[];
  reposts:        string[];
  createdAt:      string;
  type:           'text' | 'music' | 'event';
  attachments:    PostAttachment[];
  commentsCount?: number;
  track?:         any;
  isRepost?:      boolean;
  /**
   * Só está "completo" quando populado (objeto).
   * Quando é string, é o ObjectId cru — tratar como original não carregado.
   */
  originalPost?:  Post | string | null;
}

interface FeedState {
  posts:       Post[];
  loading:     boolean;
  loadingMore: boolean;
  error:       string | null;
  hasMore:     boolean;
}

/**
 * O FeedCard opera sobre o conteúdo ORIGINAL (originalPost quando populado),
 * então o id alvo pode ser o do wrapper OU o do original dentro do wrapper.
 */
function matchesPostOrOriginal(p: Post, targetId: string): boolean {
  if (p._id === targetId) return true;
  const op = p.originalPost;
  if (op && typeof op === 'object' && op._id === targetId) return true;
  return false;
}

/** Retorna o objeto alvo dentro do post (original populado ou o próprio post). */
function resolveTarget(p: Post): Post {
  const op = p.originalPost;
  return op && typeof op === 'object' ? op : p;
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

  const createPost = useCallback(async (
    text: string,
    attachments?: { kind: string; url: string; meta?: any }[]
  ): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/posts`, {
        method:  'POST',
        headers: authHeader(),
        body:    JSON.stringify({ text, attachments }),
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
    // Atualização otimista — casando wrapper OU original
    setState(prev => ({
      ...prev,
      posts: prev.posts.map(p => {
        if (!matchesPostOrOriginal(p, postId)) return p;
        const target = resolveTarget(p);
        const liked  = target.likes.includes(currentUserId);
        const newLikes = liked
          ? target.likes.filter(id => id !== currentUserId)
          : [...target.likes, currentUserId];

        // Atualiza no lugar certo (original populado ou o próprio post)
        if (p.originalPost && typeof p.originalPost === 'object') {
          return { ...p, originalPost: { ...p.originalPost, likes: newLikes } };
        }
        return { ...p, likes: newLikes };
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
          if (!matchesPostOrOriginal(p, postId)) return p;
          const base = resolveTarget(p);
          const likes = liked
            ? [...base.likes.filter(id => id !== currentUserId), currentUserId]
            : base.likes.filter(id => id !== currentUserId);
          const finalLikes = likes.slice(0, likesCount);

          if (p.originalPost && typeof p.originalPost === 'object') {
            return { ...p, originalPost: { ...p.originalPost, likes: finalLikes } };
          }
          return { ...p, likes: finalLikes };
        }),
      }));
    } catch {
      loadFeed(true);
    }
  }, [currentUserId, loadFeed]);

  const toggleRepost = useCallback(async (postId: string) => {
    // Atualização otimista — casando wrapper OU original
    setState(prev => ({
      ...prev,
      posts: prev.posts.map(p => {
        if (!matchesPostOrOriginal(p, postId)) return p;
        const target   = resolveTarget(p);
        const reposted = target.reposts.includes(currentUserId);
        const newReposts = reposted
          ? target.reposts.filter(id => id !== currentUserId)
          : [...target.reposts, currentUserId];

        if (p.originalPost && typeof p.originalPost === 'object') {
          return { ...p, originalPost: { ...p.originalPost, reposts: newReposts } };
        }
        return { ...p, reposts: newReposts };
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
    // Remove o wrapper cujo original (ou ele mesmo) é o alvo
    setState(prev => ({
      ...prev,
      posts: prev.posts.filter(p => !matchesPostOrOriginal(p, postId)),
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