// src/contexts/MusicDataContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Audio } from 'expo-av';
import { trackService, artistService, albumService, testConnection } from '../services/api';
import { useAuthStore } from '../store/authStore';

// Re-export shared types so importers don't need to change
export type { Artist, Album, Track } from './MusicPlayerContext';
import type { Artist, Album, Track } from './MusicPlayerContext';

export interface FeedItem {
  _id: string;
  type: 'track_release' | 'album_release' | 'playlist_created' | 'user_follow' | 'track_like';
  actorUser?: {
    _id: string;
    username: string;
    name: string;
    avatar: string;
  };
  actorArtist?: Artist;
  targetTrack?: Track;
  targetAlbum?: Album;
  targetPlaylist?: any;
  targetUser?: any;
  createdAt: string;
  message?: string;
}

interface MusicDataContextValue {
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
  loading: boolean;
  error: string | null;
  listeningHistory: Track[];

  feedItems: FeedItem[];
  hasMoreFeed: boolean;
  feedLoading: boolean;
  loadMoreFeed: () => Promise<void>;

  /** Notify data context that a track was played (updates history & playCount) */
  onTrackPlayed: (track: Track) => void;

  getPopularTracks: (limit?: number) => Track[];
  getRecentTracks: (limit?: number) => Track[];
  searchTracks: (query: string) => Track[];
  getTracksByArtist: (artistId: string) => Track[];
  getAlbumsByArtist: (artistId: string) => Album[];
  getTracksByAlbum: (albumId: string) => Track[];
  getFeaturedBands: (limit?: number) => Artist[];
  refresh: () => Promise<void>;
  testApiConnection: () => Promise<boolean>;

  // Social — Artistas
  followArtist: (artistId: string) => Promise<void>;
  unfollowArtist: (artistId: string) => Promise<void>;
  checkFollowingArtist: (artistId: string) => Promise<boolean>;

  // Social — Álbuns
  likeAlbum: (albumId: string) => Promise<void>;
  unlikeAlbum: (albumId: string) => Promise<void>;
  checkAlbumLiked: (albumId: string) => Promise<boolean>;

  // Social — Tracks
  likedTrackIds: Set<string>;
  likeTrack: (trackId: string) => Promise<void>;
  unlikeTrack: (trackId: string) => Promise<void>;
  isTrackLiked: (trackId: string) => boolean;
}

const MusicDataContext = createContext<MusicDataContextValue | null>(null);

export const MusicDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [listeningHistory, setListeningHistory] = useState<Track[]>([]);

  // Liked track IDs — ref for mutations, state for renders
  const likedTrackIdsRef = useRef<Set<string>>(new Set());
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set());

  const syncLikedSet = useCallback((fn: (prev: Set<string>) => Set<string>) => {
    likedTrackIdsRef.current = fn(likedTrackIdsRef.current);
    setLikedTrackIds(new Set(likedTrackIdsRef.current));
  }, []);

  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [hasMoreFeed, setHasMoreFeed] = useState<boolean>(true);
  const [feedLoading, setFeedLoading] = useState<boolean>(false);
  const feedCursorRef = useRef<string | null>(null);

  const isLoadingRef = useRef<boolean>(false);
  const hasLoadedRef = useRef<boolean>(false);

  const tracksRef = useRef<Track[]>(tracks);
  tracksRef.current = tracks;

  const { token } = useAuthStore();

  // ── Audio setup (only once) ──────────────────────────────────────────────
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch(err => console.warn('⚠️ Erro ao configurar áudio:', err));
  }, []);

  // ── Connection test ──────────────────────────────────────────────────────
  const testApiConnection = useCallback(async (): Promise<boolean> => {
    try {
      const ok = await testConnection();
      if (!ok) setError('API não está acessível. Verifique se o backend está rodando.');
      return ok;
    } catch {
      setError('Não foi possível conectar à API. Verifique a rede.');
      return false;
    }
  }, []);

  // ── Feed ─────────────────────────────────────────────────────────────────
  const feedLoadingRef = useRef(feedLoading);
  feedLoadingRef.current = feedLoading;

  const loadFeed = useCallback(async (cursor: string | null = null, isLoadMore = false) => {
    if (feedLoadingRef.current || !token) return;
    setFeedLoading(true);
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
      const url = cursor
        ? `${API_URL}/feed/cursor?cursor=${cursor}&limit=20`
        : `${API_URL}/feed/cursor?limit=20`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const result = await res.json();
      if (result.success && result.data) {
        setFeedItems(prev => (isLoadMore ? [...prev, ...result.data] : result.data));
        setHasMoreFeed(result.hasMore ?? false);
        feedCursorRef.current = result.nextCursor ?? null;
      }
    } catch (err) {
      console.error('Erro ao carregar feed:', err);
    } finally {
      setFeedLoading(false);
    }
  }, [token]);

  const hasMoreFeedRef = useRef(hasMoreFeed);
  hasMoreFeedRef.current = hasMoreFeed;

  const loadMoreFeed = useCallback(async () => {
    if (!hasMoreFeedRef.current || feedLoadingRef.current) return;
    await loadFeed(feedCursorRef.current, true);
  }, [loadFeed]);

  // ── Catalog ──────────────────────────────────────────────────────────────
  const loadAllData = useCallback(async (): Promise<void> => {
    if (isLoadingRef.current || hasLoadedRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const ok = await testApiConnection();
      if (!ok) return;

      const result = await trackService.getAll();
      if (result.success && result.data) {
        const tracksData: Track[] = result.data;
        setTracks(tracksData);

        // Derive artists
        const artistMap = new Map<string, Artist>();
        tracksData.forEach(t => t.artists?.forEach(a => {
          if (a?._id && !artistMap.has(a._id)) artistMap.set(a._id, a);
        }));
        setArtists([...artistMap.values()]);

        // Derive albums
        const albumMap = new Map<string, Album>();
        tracksData.forEach(t => {
          if (t.album?._id && !albumMap.has(t.album._id)) albumMap.set(t.album._id, t.album);
        });
        setAlbums([...albumMap.values()]);

        hasLoadedRef.current = true;
      } else {
        setError(result.error || 'Erro ao carregar dados da API');
      }

      if (token) await loadFeed(null, false);
    } catch (err: any) {
      setError(`Erro: ${err.message || 'Não foi possível conectar ao servidor'}`);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [testApiConnection, loadFeed, token]);

  useEffect(() => { loadAllData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Called by MusicPlayerProvider when a track starts playing ────────────
  const onTrackPlayed = useCallback((track: Track) => {
    setListeningHistory(prev => {
      const albumMap = new Map<string, Track>();
      if (track.album?._id) albumMap.set(track.album._id, track);
      prev.forEach(t => {
        const id = t.album?._id;
        if (id && !albumMap.has(id)) albumMap.set(id, t);
      });
      return [...albumMap.values()].slice(0, 10);
    });
    setTracks(prev =>
      prev.map(t => t._id === track._id ? { ...t, playCount: (t.playCount || 0) + 1 } : t)
    );
  }, []);

  // ── Selectors (stable — read from ref, no dep on tracks state) ───────────
  const getPopularTracks = useCallback((limit = 6): Track[] =>
    [...tracksRef.current].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, limit), []);

  const getRecentTracks = useCallback((limit = 6): Track[] =>
    [...tracksRef.current]
      .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
      .slice(0, limit), []);

  const searchTracks = useCallback((query: string): Track[] => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return tracksRef.current.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.artists?.some(a => a.name?.toLowerCase().includes(q)) ||
      t.album?.title?.toLowerCase().includes(q)
    );
  }, []);

  const getTracksByArtist = useCallback((artistId: string): Track[] =>
    tracksRef.current.filter(t => t.artists?.some(a => a._id === artistId)), []);

  const getAlbumsByArtist = useCallback((artistId: string): Album[] => {
    const seen = new Set<string>();
    const result: Album[] = [];
    tracksRef.current.forEach(t => {
      if (t.artists?.some(a => a._id === artistId) && t.album?._id && !seen.has(t.album._id)) {
        seen.add(t.album._id);
        result.push(t.album);
      }
    });
    return result;
  }, []);

  const getTracksByAlbum = useCallback((albumId: string): Track[] =>
    tracksRef.current.filter(t => t.album?._id === albumId), []);

  const getFeaturedBands = useCallback((limit = 4): Artist[] =>
    [...artists].sort((a, b) => (b.monthlyListeners || 0) - (a.monthlyListeners || 0)).slice(0, limit),
  [artists]);

  const forceRefresh = useCallback(async (): Promise<void> => {
    hasLoadedRef.current = false;
    feedCursorRef.current = null;
    setFeedItems([]);
    setHasMoreFeed(true);
    await loadAllData();
  }, [loadAllData]);

  // ── Social — Artists ─────────────────────────────────────────────────────
  const followArtist = useCallback(async (artistId: string): Promise<void> => {
    await artistService.follow(artistId);
    setArtists(prev => prev.map(a =>
      a._id === artistId ? { ...a, monthlyListeners: (a.monthlyListeners || 0) + 1 } : a
    ));
  }, []);

  const unfollowArtist = useCallback(async (artistId: string): Promise<void> => {
    await artistService.unfollow(artistId);
    setArtists(prev => prev.map(a =>
      a._id === artistId ? { ...a, monthlyListeners: Math.max(0, (a.monthlyListeners || 0) - 1) } : a
    ));
  }, []);

  const checkFollowingArtist = useCallback(async (artistId: string): Promise<boolean> => {
    try { return await artistService.checkFollowing(artistId); }
    catch { return false; }
  }, []);

  // ── Social — Albums ──────────────────────────────────────────────────────
  const likeAlbum = useCallback(async (albumId: string): Promise<void> => {
    await albumService.like(albumId);
    setAlbums(prev => prev.map(a =>
      a._id === albumId ? { ...a, likeCount: (a.likeCount || 0) + 1 } : a
    ));
  }, []);

  const unlikeAlbum = useCallback(async (albumId: string): Promise<void> => {
    await albumService.unlike(albumId);
    setAlbums(prev => prev.map(a =>
      a._id === albumId ? { ...a, likeCount: Math.max(0, (a.likeCount || 0) - 1) } : a
    ));
  }, []);

  const checkAlbumLiked = useCallback(async (albumId: string): Promise<boolean> => {
    try { return await albumService.checkLike(albumId); }
    catch { return false; }
  }, []);

  // ── Social — Tracks ──────────────────────────────────────────────────────
  const likeTrack = useCallback(async (trackId: string): Promise<void> => {
    // Optimistic update
    syncLikedSet(prev => { prev.add(trackId); return prev; });
    setTracks(prev => prev.map(t =>
      t._id === trackId ? { ...t, likeCount: (t.likeCount || 0) + 1 } : t
    ));
    try {
      const result = await trackService.like(trackId, token!);
      if (!result.success) {
        syncLikedSet(prev => { prev.delete(trackId); return prev; });
        setTracks(prev => prev.map(t =>
          t._id === trackId ? { ...t, likeCount: Math.max(0, (t.likeCount || 0) - 1) } : t
        ));
      } else if (result.data?.likeCount !== undefined) {
        setTracks(prev => prev.map(t =>
          t._id === trackId ? { ...t, likeCount: result.data.likeCount } : t
        ));
      }
    } catch {
      syncLikedSet(prev => { prev.delete(trackId); return prev; });
      setTracks(prev => prev.map(t =>
        t._id === trackId ? { ...t, likeCount: Math.max(0, (t.likeCount || 0) - 1) } : t
      ));
    }
  }, [token, syncLikedSet]);

  const unlikeTrack = useCallback(async (trackId: string): Promise<void> => {
    syncLikedSet(prev => { prev.delete(trackId); return prev; });
    setTracks(prev => prev.map(t =>
      t._id === trackId ? { ...t, likeCount: Math.max(0, (t.likeCount || 0) - 1) } : t
    ));
    try {
      const result = await trackService.unlike(trackId, token!);
      if (!result.success) {
        syncLikedSet(prev => { prev.add(trackId); return prev; });
        setTracks(prev => prev.map(t =>
          t._id === trackId ? { ...t, likeCount: (t.likeCount || 0) + 1 } : t
        ));
      } else if (result.data?.likeCount !== undefined) {
        setTracks(prev => prev.map(t =>
          t._id === trackId ? { ...t, likeCount: result.data.likeCount } : t
        ));
      }
    } catch {
      syncLikedSet(prev => { prev.add(trackId); return prev; });
      setTracks(prev => prev.map(t =>
        t._id === trackId ? { ...t, likeCount: (t.likeCount || 0) + 1 } : t
      ));
    }
  }, [token, syncLikedSet]);

  const isTrackLiked = useCallback((trackId: string): boolean =>
    likedTrackIdsRef.current.has(trackId), []);

  // ── Memoised context value ───────────────────────────────────────────────
  const value = useMemo<MusicDataContextValue>(() => ({
    tracks,
    artists,
    albums,
    loading,
    error,
    listeningHistory,
    feedItems,
    hasMoreFeed,
    feedLoading,
    loadMoreFeed,
    onTrackPlayed,
    getPopularTracks,
    getRecentTracks,
    searchTracks,
    getTracksByArtist,
    getAlbumsByArtist,
    getTracksByAlbum,
    getFeaturedBands,
    refresh: forceRefresh,
    testApiConnection,
    followArtist,
    unfollowArtist,
    checkFollowingArtist,
    likeAlbum,
    unlikeAlbum,
    checkAlbumLiked,
    likedTrackIds,
    likeTrack,
    unlikeTrack,
    isTrackLiked,
  }), [
    tracks, artists, albums, loading, error, listeningHistory,
    feedItems, hasMoreFeed, feedLoading,
    loadMoreFeed, onTrackPlayed,
    getPopularTracks, getRecentTracks, searchTracks,
    getTracksByArtist, getAlbumsByArtist, getTracksByAlbum, getFeaturedBands,
    forceRefresh, testApiConnection,
    followArtist, unfollowArtist, checkFollowingArtist,
    likeAlbum, unlikeAlbum, checkAlbumLiked,
    likedTrackIds, likeTrack, unlikeTrack, isTrackLiked,
  ]);

  return (
    <MusicDataContext.Provider value={value}>
      {children}
    </MusicDataContext.Provider>
  );
};

export const useMusicData = (): MusicDataContextValue => {
  const ctx = useContext(MusicDataContext);
  if (!ctx) throw new Error('useMusicData deve ser usado dentro de MusicDataProvider');
  return ctx;
};
