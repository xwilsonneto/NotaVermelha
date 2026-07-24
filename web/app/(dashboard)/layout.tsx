// app/(dashboard)/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BadgeCheck } from 'lucide-react';

import { useAuthStore } from '@/app/store/authStore';
import { trackService } from '@/app/services/api';
import type { Track } from '@/app/services/api';

import Player from '@/app/components/Player';
import SearchBar from '@/app/components/SearchBar';
import AppSidebar, { type ActiveSection } from '@/app/components/navigation/AppSidebar';

import { DashboardProvider } from './DashboardContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, token, logout, _hasHydrated } = useAuthStore();

  const [activeSection, setActiveSection] = useState<ActiveSection>('discover');
  const [allTracks, setAllTracks] = useState<Track[]>([]);

  useEffect(() => {
    if (_hasHydrated && !token) router.replace('/login');
  }, [_hasHydrated, token, router]);

  // allTracks vive aqui agora (não mais na home page) porque o SearchBar
  // do header também precisa dele, e o header é compartilhado por todas
  // as páginas do dashboard.
  useEffect(() => {
    if (!token) return;
    trackService.getAll().then((r) => {
      if (r.success) setAllTracks(r.data);
    });
  }, [token]);

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-[#090909] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Enquanto o redirect pro /login acontece, não renderiza o dashboard.
  if (!token) return null;

  const avatarUrl =
    user?.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'U')}&background=7f1d1d&color=fff`;
  const isArtist = ['artist', 'band', 'label'].includes(user?.role ?? '');

  return (
    <DashboardProvider value={{ token, user, logout, allTracks, isArtist }}>
      <div className="min-h-screen bg-[#090909] text-white flex flex-col">
        <header className="sticky top-0 z-40 bg-[#090909]/90 backdrop-blur-xl border-b border-zinc-800/60">
          <div className="max-w-screen-2xl mx-auto flex items-center gap-4 px-6 h-16">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-lg shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                🐞
              </div>
              <span className="font-black text-lg tracking-tight hidden sm:block">NotaVermelha</span>
            </div>

            <SearchBar token={token} allTracks={allTracks} />

            <div className="flex items-center gap-2 shrink-0">
              <button className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors">
                <Bell size={18} />
              </button>
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

        <div className="flex flex-1 max-w-screen-2xl mx-auto w-full">
          <AppSidebar
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            isArtist={isArtist}
            logout={logout}
            user={user}
          />

          {/* Área que muda por página. A home fica com o grid feed+músicas;
              o album/[id] entra aqui também, sem duplicar sidebar/header/player. */}
          <main className="flex-1 min-w-0 px-4 sm:px-6 py-6 pb-[136px] lg:pb-[96px] overflow-hidden">
            {children}
          </main>
        </div>

        {/* Player fica aqui (fora do <main>), então nunca desmonta ao trocar
            de página — o <audio> real continua tocando normalmente. */}
        <Player />
      </div>
    </DashboardProvider>
  );
}
