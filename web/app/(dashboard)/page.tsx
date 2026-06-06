'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Music2, Disc3, Users, ListMusic, Rss,
  LogOut, Settings, Search, Bell, Newspaper,
  Calendar, Radio, ImageIcon, BadgeCheck
} from 'lucide-react';

import { useAuthStore } from '@/app/store/authStore';
import { trackService, albumService, artistService } from '../services/api';
import type { Track, ApiResponse } from '../services/api';

import Player from '../components/Player';
import TrackCard from '../components/TrackCard';
import AlbumCard from '../components/AlbumCard';
import ArtistCard from '../components/ArtistCard';
import HorizontalScroll from '../components/HorizontalScroll';
import SectionHeader from '../components/SectionHeader';

// ─── Skeleton ───────────────────────────────────────────────────────────────
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

// ─── Feed placeholder ────────────────────────────────────────────────────────
const FEED_FEATURES = [
  { icon: Newspaper, label: 'Posts de texto', desc: 'Compartilhe pensamentos com sua comunidade' },
  { icon: ImageIcon, label: 'Fotos & imagens', desc: 'Divulgue seu trabalho visualmente' },
  { icon: Calendar, label: 'Eventos', desc: 'Divulgue shows e lançamentos' },
  { icon: Radio, label: 'Música em tempo real', desc: 'Mostre o que está ouvindo agora' },
];

function FeedPlaceholder() {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-700/60 bg-zinc-900/30 p-8 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-950/40 border border-red-800/40 flex items-center justify-center mb-4">
        <Rss size={24} className="text-red-400" />
      </div>
      <h3 className="text-lg font-black mb-1">Feed social em breve</h3>
      <p className="text-sm text-zinc-500 max-w-xs leading-relaxed mb-6">
        A rede social da NotaVermelha está sendo construída. Em breve você poderá:
      </p>
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {FEED_FEATURES.map(({ icon: Icon, label, desc }) => (
          <div
            key={label}
            className="rounded-xl bg-zinc-900/60 border border-zinc-800/60 p-3 text-left"
          >
            <Icon size={16} className="text-red-400 mb-2" />
            <p className="text-xs font-semibold">{label}</p>
            <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sidebar nav item ────────────────────────────────────────────────────────
interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  soon?: boolean;
  onClick?: () => void;
}

function NavItem({ icon: Icon, label, active, soon, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left
        ${active
          ? 'bg-red-600/20 border border-red-600/30 text-red-300'
          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
        }`}
    >
      <Icon size={18} className={active ? 'text-red-400' : ''} />
      <span className="flex-1">{label}</span>
      {soon && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500 border border-zinc-700">
          em breve
        </span>
      )}
    </button>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const { user, token, logout, _hasHydrated } = useAuthStore();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [loadingAlbums, setLoadingAlbums] = useState(true);
  const [loadingArtists, setLoadingArtists] = useState(true);
  const [activeSection, setActiveSection] = useState<'discover' | 'feed' | 'library'>('discover');

  // Redireciona se não autenticado
  useEffect(() => {
    if (_hasHydrated && !token) {
      router.replace('/login');
    }
  }, [_hasHydrated, token, router]);

  // Carrega dados
  useEffect(() => {
    if (!token) return;

    trackService.getAll().then((res) => {
      if (res.success) setTracks(res.data);
      setLoadingTracks(false);
    });

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/albums`)
      .then((r) => r.json())
      .then((res: ApiResponse<any[]>) => {
        if (res.success) setAlbums(res.data);
        setLoadingAlbums(false);
      })
      .catch(() => setLoadingAlbums(false));

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/artists`)
      .then((r) => r.json())
      .then((res: ApiResponse<any[]>) => {
        if (res.success) setArtists(res.data);
        setLoadingArtists(false);
      })
      .catch(() => setLoadingArtists(false));
  }, [token]);

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-[#090909] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const avatarUrl = user?.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'U')}&background=7f1d1d&color=fff`;
  const isArtist = ['artist', 'band', 'label'].includes(user?.role ?? '');

  return (
    <div className="min-h-screen bg-[#090909] text-white flex flex-col">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 bg-[#090909]/90 backdrop-blur-xl border-b border-zinc-800/60">
        <div className="max-w-screen-2xl mx-auto flex items-center gap-4 px-6 h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-lg shadow-[0_0_20px_rgba(220,38,38,0.4)]">
              🐞
            </div>
            <span className="font-black text-lg tracking-tight hidden sm:block">NotaVermelha</span>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-auto">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar músicas, artistas, álbuns..."
                className="w-full bg-zinc-900/80 border border-zinc-800 focus:border-zinc-600 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none transition-colors placeholder:text-zinc-600"
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors relative">
              <Bell size={18} />
            </button>

            {/* Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
              <img
                src={avatarUrl}
                alt={user?.name}
                className="w-8 h-8 rounded-full object-cover border border-zinc-700"
              />
              <div className="hidden md:block">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-semibold leading-none">{user?.name ?? user?.username}</p>
                  {user?.isVerified && <BadgeCheck size={13} className="text-red-400" />}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 max-w-screen-2xl mx-auto w-full">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-zinc-800/60 px-3 py-6 gap-1 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-600 px-3 mb-2">Navegar</p>
          <NavItem icon={Music2} label="Descobrir" active={activeSection === 'discover'} onClick={() => setActiveSection('discover')} />
          <NavItem icon={Rss} label="Feed" soon onClick={() => setActiveSection('feed')} />
          <NavItem icon={ListMusic} label="Biblioteca" onClick={() => setActiveSection('library')} />

          <div className="h-px bg-zinc-800/60 my-3" />

          <p className="text-xs uppercase tracking-[0.2em] text-zinc-600 px-3 mb-2">Conta</p>
          {isArtist && (
            <NavItem icon={Disc3} label="Meu perfil artístico" onClick={() => router.push('/profile')} />
          )}
          <NavItem icon={Settings} label="Configurações" onClick={() => router.push('/settings')} />
          <NavItem icon={LogOut} label="Sair" onClick={logout} />

          <div className="mt-auto pt-4">
            <div className="rounded-xl bg-red-950/30 border border-red-800/30 p-3">
              <p className="text-xs font-bold text-red-300 mb-1">
                {user?.subscription?.type === 'premium' ? '✦ Premium' : 'Plano gratuito'}
              </p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {user?.subscription?.type === 'premium'
                  ? 'Obrigado por apoiar a independência!'
                  : 'Considere o plano premium para apoiar os artistas.'}
              </p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 px-6 py-8 pb-32">

          {/* Greeting */}
          <div className="mb-10">
            <h1 className="text-4xl font-black tracking-tight">
              {greeting()},{' '}
              <span className="text-red-400">{user?.name?.split(' ')[0] ?? user?.username}</span>
            </h1>
            <p className="mt-2 text-zinc-500">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          {/* ── Músicas ── */}
          <section className="mb-10">
            <SectionHeader
              title="Músicas"
              subtitle="Últimos lançamentos na plataforma"
              action={
                <button className="text-xs text-zinc-500 hover:text-red-400 transition-colors">
                  Ver todas
                </button>
              }
            />
            <HorizontalScroll>
              {loadingTracks
                ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
                : tracks.slice(0, 20).map((track) => (
                    <div key={track._id} className="w-[160px] shrink-0">
                      <TrackCard track={track} queue={tracks} />
                    </div>
                  ))
              }
            </HorizontalScroll>
          </section>

          {/* ── Álbuns ── */}
          <section className="mb-10">
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
                  ))
              }
            </HorizontalScroll>
          </section>

          {/* ── Artistas ── */}
          <section className="mb-10">
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
                  ))
              }
            </HorizontalScroll>
          </section>

          {/* ── Feed (placeholder) ── */}
          <section className="mb-10">
            <SectionHeader
              title="Feed"
              subtitle="O que a comunidade está compartilhando"
            />
            <FeedPlaceholder />
          </section>
        </main>
      </div>

      {/* Player */}
      <Player />
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}