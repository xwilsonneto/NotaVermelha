// app/(dashboard)/page.tsx
'use client';

import { useEffect, useState } from 'react';

import { trackService } from '../services/api';
import type { Track, ApiResponse } from '../services/api';
import { usePlayerStore } from '../store/playerStore';

import TrackCard from '../components/TrackCard';
import AlbumCard from '../components/AlbumCard';
import ArtistCard from '../components/ArtistCard';
import HorizontalScroll from '../components/HorizontalScroll';
import SectionHeader from '../components/SectionHeader';
import Feed from '../components/feed/Feed';

import { useDashboard } from './DashboardContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

// ─── SKELETONS ────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="w-[160px] shrink-0 rounded-2xl bg-zinc-900/60 border border-zinc-800/40 overflow-hidden animate-pulse">
      <div className="aspect-square bg-zinc-800" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-zinc-800 rounded w-3/4" />
        <div className="h-2.5 bg-zinc-800/60 rounded w-1/2" />
      </div>
    </div>
  );
}

function ArtistSkeleton() {
  return (
    <div className="w-[150px] shrink-0 rounded-2xl bg-zinc-900/60 border border-zinc-800/40 p-5 flex flex-col items-center gap-3 animate-pulse">
      <div className="w-20 h-20 rounded-full bg-zinc-800" />
      <div className="h-3 bg-zinc-800 rounded w-20" />
      <div className="h-2.5 bg-zinc-800/60 rounded w-14" />
    </div>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────

function albumIdOf(track: any): string | null {
  if (!track?.album) return null;
  return typeof track.album === 'object' ? track.album._id : track.album;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

// ─── PAGE ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  // token, user e allTracks já vêm prontos do layout — sem refazer fetch/login aqui.
  const { token, user, allTracks } = useDashboard();
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [hasHistory, setHasHistory] = useState(false);
  const [albums, setAlbums] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [loadingAlbums, setLoadingAlbums] = useState(true);
  const [loadingArtists, setLoadingArtists] = useState(true);

  useEffect(() => {
    if (!token) return;

    fetch(`${API_URL}/tracks/me/recently-played?limit=6`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res: ApiResponse<Track[]>) => {
        if (res.success && res.data.length > 0) {
          setRecentTracks(res.data);
          setHasHistory(true);
        } else {
          trackService.getAll().then((r) => {
            if (r.success) setRecentTracks(r.data.slice(0, 6));
          });
        }
        setLoadingTracks(false);
      })
      .catch(() => {
        trackService.getAll().then((r) => {
          if (r.success) setRecentTracks(r.data.slice(0, 6));
        });
        setLoadingTracks(false);
      });

    fetch(`${API_URL}/albums`)
      .then((r) => r.json())
      .then((res: ApiResponse<any[]>) => {
        if (res.success) setAlbums(res.data);
        setLoadingAlbums(false);
      })
      .catch(() => setLoadingAlbums(false));

    fetch(`${API_URL}/artists`)
      .then((r) => r.json())
      .then((res: ApiResponse<any[]>) => {
        if (res.success) setArtists(res.data);
        setLoadingArtists(false);
      })
      .catch(() => setLoadingArtists(false));
  }, [token]);
  useEffect(() => {
    if (!currentTrack) return;
    setRecentTracks((prev) => {
      if (prev.some((t) => t._id === currentTrack._id)) return prev;

      setHasHistory(true);

      const albumId = albumIdOf(currentTrack);
      const withoutSameAlbum = albumId
        ? prev.filter((t) => albumIdOf(t) !== albumId)
        : prev;

      return [currentTrack, ...withoutSameAlbum].slice(0, 6);
    });
  }, [currentTrack]);

  return (
    <>
      <div className="mb-6 xl:mb-8 px-4 xl:px-0">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          {greeting()},{' '}
          <span className="text-red-400">{user?.name?.split(' ')[0] ?? user?.username}</span>
        </h1>
        <p className="mt-2 text-zinc-500">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.9fr] gap-4 xl:gap-6 h-auto xl:h-[calc(100vh-220px)]">
        <div className="overflow-y-auto custom-scroll px-4 xl:pl-6 xl:pr-0">
          <SectionHeader title="Feed" subtitle="O que a comunidade está compartilhando" />
          <Feed />
        </div>

        <div className="overflow-y-auto px-4 xl:px-0 xl:pr-2 custom-scroll">
          <section className="mb-8 xl:mb-10">
            <SectionHeader
              title="Músicas"
              subtitle={hasHistory ? 'Últimas que você ouviu' : 'Últimos lançamentos na plataforma'}
              action={
                <button className="text-xs text-zinc-500 hover:text-red-400 transition-colors">
                  Ver todas
                </button>
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {loadingTracks
                ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
                : recentTracks.map((track) => (
                    <div key={track._id} className="w-full min-w-0">
                      <TrackCard track={track} queue={allTracks.length > 0 ? allTracks : recentTracks} />
                    </div>
                  ))}
            </div>
          </section>

          <section className="mb-8 xl:mb-10">
            <SectionHeader
              title="Álbuns"
              subtitle="Discografia independente"
              action={
                <button className="text-xs text-zinc-500 hover:text-red-400 transition-colors">
                  Ver todos
                </button>
              }
            />
            <HorizontalScroll>
              {loadingAlbums
                ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
                : albums.slice(0, 20).map((album) => (
                    <div key={album._id} className="w-[160px] shrink-0">
                      <AlbumCard album={album} />
                    </div>
                  ))}
            </HorizontalScroll>
          </section>

          <section className="mb-8 xl:mb-10">
            <SectionHeader
              title="Artistas"
              subtitle="Conheça quem faz a música acontecer"
              action={
                <button className="text-xs text-zinc-500 hover:text-red-400 transition-colors">
                  Ver todos
                </button>
              }
            />
            <HorizontalScroll>
              {loadingArtists
                ? Array.from({ length: 6 }).map((_, i) => <ArtistSkeleton key={i} />)
                : artists.slice(0, 20).map((artist) => (
                    <div key={artist._id} className="w-[150px] shrink-0">
                      <ArtistCard artist={artist} />
                    </div>
                  ))}
            </HorizontalScroll>
          </section>
        </div>
      </div>
    </>
  );
}