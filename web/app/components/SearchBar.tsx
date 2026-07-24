// app/components/SearchBar.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Mic2, Disc3, Music2 } from 'lucide-react';

import type { Track } from '@/app/services/api';
import { usePlayerStore } from '@/app/store/playerStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

interface SearchResults {
  artists: any[];
  albums: any[];
  tracks: any[];
}

export default function SearchBar({
  token,
  allTracks,
}: {
  token: string | null;
  allTracks: Track[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { play } = usePlayerStore();

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce da busca
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = query.trim();
    if (!q) {
      setResults(null);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(q)}&limit=5`, { headers });
        const data = await res.json();
        if (data.success) {
          setResults(data.data);
          setOpen(true);
        }
      } catch {
        // silencia erros de rede
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query, token]);

  const hasResults =
    results && (results.artists.length > 0 || results.albums.length > 0 || results.tracks.length > 0);

  const clear = () => {
    setQuery('');
    setResults(null);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="flex-1 max-w-xs sm:max-w-sm md:max-w-md mx-auto relative">
      {/* Input */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results) setOpen(true);
          }}
          placeholder="Buscar músicas, artistas, álbuns..."
          className="w-full bg-zinc-900/80 border border-zinc-800 focus:border-zinc-600 rounded-xl pl-9 pr-9 py-2 md:py-2.5 text-xs md:text-sm outline-none transition-colors placeholder:text-zinc-600"
        />
        {query && (
          <button
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full mt-2 left-0 right-0 z-50 bg-zinc-950 border border-zinc-800 rounded-xl md:rounded-2xl shadow-2xl overflow-hidden">
          {loading && <div className="px-4 py-3 text-xs text-zinc-500">Buscando...</div>}

          {!loading && !hasResults && (
            <div className="px-4 py-4 text-sm text-zinc-500 text-center">
              Nenhum resultado para <span className="text-white">"{query}"</span>
            </div>
          )}

          {!loading && hasResults && (
            <div className="max-h-[320px] md:max-h-[420px] overflow-y-auto custom-scroll">
              {/* 1 — Artistas */}
              {results!.artists.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 px-3 md:px-4 pt-2 md:pt-3 pb-1.5">
                    <Mic2 size={12} className="text-zinc-500" />
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                      Artistas
                    </span>
                  </div>
                  {results!.artists.map((artist) => (
                    <button
                      key={artist._id}
                      onClick={() => {
                        router.push(`/artist/${artist._id}`);
                        clear();
                      }}
                      className="w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-2.5 hover:bg-zinc-800/60 transition-colors text-left"
                    >
                      <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-zinc-800 overflow-hidden shrink-0">
                        {artist.avatar ? (
                          <img src={artist.avatar} alt={artist.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Mic2 size={14} className="text-zinc-600" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{artist.name}</p>
                        {artist.genre && <p className="text-xs text-zinc-500 truncate">{artist.genre}</p>}
                      </div>
                    </button>
                  ))}
                </section>
              )}

              {/* 2 — Álbuns */}
              {results!.albums.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 px-3 md:px-4 pt-2 md:pt-3 pb-1.5">
                    <Disc3 size={12} className="text-zinc-500" />
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                      Álbuns
                    </span>
                  </div>
                  {results!.albums.map((album) => (
                    <button
                      key={album._id}
                      onClick={() => {
                        router.push(`/album/${album._id}`);
                        clear();
                      }}
                      className="w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-2.5 hover:bg-zinc-800/60 transition-colors text-left"
                    >
                      <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-zinc-800 overflow-hidden shrink-0">
                        {(album.coverUrl || album.cover) ? (
                          <img
                            src={album.coverUrl ?? album.cover}
                            alt={album.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Disc3 size={14} className="text-zinc-600" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{album.title}</p>
                        {album.artist?.name && (
                          <p className="text-xs text-zinc-500 truncate">{album.artist.name}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </section>
              )}

              {/* 3 — Músicas */}
              {results!.tracks.length > 0 && (
                <section className="pb-2">
                  <div className="flex items-center gap-2 px-3 md:px-4 pt-2 md:pt-3 pb-1.5">
                    <Music2 size={12} className="text-zinc-500" />
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                      Músicas
                    </span>
                  </div>
                  {results!.tracks.map((track) => {
                    const artistName = Array.isArray(track.artists)
                      ? track.artists.map((a: any) => a.name ?? a).join(', ')
                      : '—';
                    const cover = track.coverUrl ?? track.album?.coverUrl ?? track.album?.cover;
                    return (
                      <button
                        key={track._id}
                        onClick={() => {
                          // Toca a track; usa allTracks como queue se disponível
                          const queue = allTracks.length > 0 ? allTracks : [track];
                          play(track, queue);
                          clear();
                        }}
                        className="w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-2.5 hover:bg-zinc-800/60 transition-colors text-left"
                      >
                        <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-zinc-800 overflow-hidden shrink-0">
                          {cover ? (
                            <img src={cover} alt={track.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music2 size={14} className="text-zinc-600" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{track.title}</p>
                          <p className="text-xs text-zinc-500 truncate">{artistName}</p>
                        </div>
                      </button>
                    );
                  })}
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}