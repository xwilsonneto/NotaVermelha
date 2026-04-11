// src/components/home/FeedSection.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, Animated, ScrollView, TouchableOpacity,
  Image, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigation';
import { useAuthStore } from '../../store/authStore';
import { useMusicData } from '../../contexts/MusicDataContext';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface FeedData {
  artists: any[];
  albums: any[];
  tracks: any[];
}

interface FeedSectionProps {
  opacity: Animated.Value;
  translateY: Animated.Value;
}

import { getApiConfig } from '../../services/api';
const API_URL_BASE = getApiConfig().baseUrl;

export const FeedSection: React.FC<FeedSectionProps> = ({ opacity, translateY }) => {
  const navigation = useNavigation<NavProp>();
  const { token } = useAuthStore();
  const { playTrack } = useMusicData();

  const [feed, setFeed] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tokenRef = useRef(token);
  tokenRef.current = token;
  const hasLoadedRef = useRef(false);

  const loadFeed = useCallback(async (force = false) => {
    if (!tokenRef.current) { setLoading(false); return; }
    if (hasLoadedRef.current && !force) return; // evita re-fetch por re-render do player
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL_BASE}/feed`, {
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
      const json = await res.json();
      if (json.success) {
        setFeed(json.data);
        hasLoadedRef.current = true;
      } else {
        setError('Erro ao carregar feed');
      }
    } catch (e) {
      setError('Não foi possível carregar o feed');
    } finally {
      setLoading(false);
    }
  }, []); // sem dependências — usa tokenRef para não recriar

  useEffect(() => { loadFeed(); }, []); // roda só uma vez ao montar

  const isEmpty = !feed || (feed.artists.length === 0 && feed.albums.length === 0 && feed.tracks.length === 0);

  return (
    <Animated.View
      style={{ opacity, transform: [{ translateY }], paddingHorizontal: 24, marginBottom: 24 }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text style={{ color: '#fff', fontSize: 20, fontFamily: 'Poppins_700Bold' }}>
          Feed
        </Text>
        {!loading && (
          <TouchableOpacity onPress={() => loadFeed(true)}>
            <MaterialCommunityIcons name="refresh" size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Loading */}
      {loading && (
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <ActivityIndicator color="#f87171" />
        </View>
      )}

      {/* Não autenticado */}
      {!loading && !token && (
        <EmptyCard
          icon="account-music-outline"
          title="Entre para ver seu feed"
          subtitle="Faça login para seguir artistas e ver novidades."
        />
      )}

      {/* Sem follows */}
      {!loading && token && isEmpty && (
        <EmptyCard
          icon="account-group-outline"
          title="Seu feed está vazio"
          subtitle="Siga artistas para ver seus álbuns e músicas aqui."
        />
      )}

      {/* Conteúdo */}
      {!loading && !isEmpty && feed && (
        <View style={{ gap: 24 }}>

          {/* Artistas que você segue */}
          {feed.artists.length > 0 && (
            <View>
              <Text style={{ color: '#9ca3af', fontSize: 11, fontFamily: 'Poppins_600SemiBold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
                Seguindo
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
                {feed.artists.map((artist: any) => (
                  <TouchableOpacity
                    key={artist._id}
                    onPress={() => navigation.navigate('Artist', { artistId: artist._id })}
                    style={{ alignItems: 'center', marginHorizontal: 8, width: 64 }}
                    activeOpacity={0.8}
                  >
                    {artist.avatar ? (
                      <Image source={{ uri: artist.avatar }} style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: '#dc2626' }} />
                    ) : (
                      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(220,38,38,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#dc2626' }}>
                        <MaterialCommunityIcons name="account-music" size={24} color="#f87171" />
                      </View>
                    )}
                    <Text numberOfLines={1} style={{ color: '#d1d5db', fontSize: 10, fontFamily: 'Poppins_400Regular', marginTop: 6, textAlign: 'center' }}>
                      {artist.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Álbuns recentes */}
          {feed.albums.length > 0 && (
            <View>
              <Text style={{ color: '#9ca3af', fontSize: 11, fontFamily: 'Poppins_600SemiBold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
                Álbuns Recentes
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
                {feed.albums.map((album: any) => (
                  <TouchableOpacity
                    key={album._id}
                    onPress={() => navigation.navigate('Album', { albumId: album._id })}
                    style={{ marginHorizontal: 6, width: 120 }}
                    activeOpacity={0.8}
                  >
                    {album.cover ? (
                      <Image source={{ uri: album.cover }} style={{ width: 120, height: 120, borderRadius: 10 }} resizeMode="cover" />
                    ) : (
                      <View style={{ width: 120, height: 120, borderRadius: 10, backgroundColor: 'rgba(220,38,38,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                        <MaterialCommunityIcons name="album" size={40} color="#f87171" />
                      </View>
                    )}
                    <Text numberOfLines={1} style={{ color: '#fff', fontSize: 12, fontFamily: 'Poppins_600SemiBold', marginTop: 8 }}>
                      {album.title}
                    </Text>
                    <Text numberOfLines={1} style={{ color: '#6b7280', fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 2 }}>
                      {album.artist?.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Tracks recentes */}
          {feed.tracks.length > 0 && (
            <View>
              <Text style={{ color: '#9ca3af', fontSize: 11, fontFamily: 'Poppins_600SemiBold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
                Músicas Recentes
              </Text>
              {feed.tracks.slice(0, 6).map((track: any) => (
                <TouchableOpacity
                  key={track._id}
                  onPress={() => playTrack(track)}
                  activeOpacity={0.7}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}
                >
                  {(track.album?.cover || track.coverUrl) ? (
                    <Image source={{ uri: track.album?.cover || track.coverUrl }} style={{ width: 44, height: 44, borderRadius: 6 }} resizeMode="cover" />
                  ) : (
                    <View style={{ width: 44, height: 44, borderRadius: 6, backgroundColor: 'rgba(220,38,38,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialCommunityIcons name="music" size={20} color="#f87171" />
                    </View>
                  )}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text numberOfLines={1} style={{ color: '#fff', fontSize: 13, fontFamily: 'Poppins_600SemiBold' }}>
                      {track.title}
                    </Text>
                    <Text numberOfLines={1} style={{ color: '#6b7280', fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 2 }}>
                      {track.artists?.map((a: any) => a.name).join(', ')}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="play-circle-outline" size={24} color="#f87171" />
                </TouchableOpacity>
              ))}
            </View>
          )}

        </View>
      )}
    </Animated.View>
  );
};

// ─── Componente auxiliar ───────────────────────────────────────────────────
const EmptyCard: React.FC<{ icon: any; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
  <View style={{
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  }}>
    <MaterialCommunityIcons name={icon} size={44} color="#4b5563" />
    <Text style={{ color: '#e5e7eb', fontFamily: 'Poppins_600SemiBold', fontSize: 15, marginTop: 12, textAlign: 'center' }}>
      {title}
    </Text>
    <Text style={{ color: '#6b7280', fontFamily: 'Poppins_400Regular', fontSize: 12, marginTop: 6, textAlign: 'center', lineHeight: 18 }}>
      {subtitle}
    </Text>
  </View>
);
