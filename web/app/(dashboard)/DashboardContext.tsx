// app/(dashboard)/DashboardContext.tsx
'use client';

import { createContext, useContext } from 'react';
import type { Track } from '@/app/services/api';

interface DashboardContextValue {
  token: string | null;
  user: any;
  logout: () => void;
  allTracks: Track[];
  isArtist: boolean;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({
  value,
  children,
}: {
  value: DashboardContextValue;
  children: React.ReactNode;
}) {
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

// Hook usado pelas páginas (home, album/[id], etc.) para pegar
// token/user/allTracks sem precisar buscar tudo de novo.
export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error('useDashboard precisa ser usado dentro de app/(dashboard)/layout.tsx');
  }
  return ctx;
}
