// src/contexts/MusicProviders.tsx
//
// Drop-in replacement for wherever you wrap your app.
// Before:
//   <MusicDataProvider>…</MusicDataProvider>
//
// After:
//   <MusicProviders>…</MusicProviders>
//
// The two providers are intentionally decoupled:
//  • MusicPlayerContext  → only playback state (currentTrack, isPlaying, position)
//  • MusicDataContext    → catalog, feed, social
//
// The bridge between them is the `onTrackPlayed` callback that MusicDataProvider
// exposes and MusicPlayerProvider calls whenever a new track starts.

import React, { useCallback } from 'react';
import { MusicDataProvider, useMusicData } from './MusicDataContext';
import { MusicPlayerProvider } from './MusicPlayerContext';
import type { Track } from './MusicPlayerContext';

/**
 * Inner component: has access to MusicDataContext so it can pass
 * `onTrackPlayed` down to MusicPlayerProvider.
 */
const PlayerBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { onTrackPlayed } = useMusicData();
  return (
    <MusicPlayerProvider onTrackPlayed={onTrackPlayed}>
      {children}
    </MusicPlayerProvider>
  );
};

/**
 * Single entry-point. Replace all usages of <MusicDataProvider> with this.
 */
export const MusicProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MusicDataProvider>
    <PlayerBridge>
      {children}
    </PlayerBridge>
  </MusicDataProvider>
);
