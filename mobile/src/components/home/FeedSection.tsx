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
import { useMusicPlayer } from '../../contexts/MusicPlayerContext';
import { getApiConfig } from '../../services/api';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

// O endpoint /feed retorna artistas seguidos, álbuns recentes e atividade social.
// Esperamos também um campo `activity` com ações recentes de quem o usuário segue.
interface FeedActivity {
  _id: string;
  user: { _id: string; name: string; avatar?: string };
  action: 'liked' | 'listening' | 'added'; // tipos de ação
  track?: { _id: string; title: string; artists: { name: string }[]; album?: { cover?: string } };
  album?: { _id: string; title: string; cover?: string; artist?: { name: string } };
  createdAt: string;
}

interface FeedData {
  artists: any[];
  albums: any[];
  tracks: any[];
  activity?: FeedActivity[]; // opcional — backend pode não ter ainda
}

interface FeedSectionProps {
  opacity: Animated.Value;
  translateY: Animated.Value;
}

const API_URL_BASE = getApiConfig().baseUrl;

export const FeedSection: React.FC<FeedSectionProps> = ({ opacity, translateY }) => {
  const navigation = useNavigation<NavProp>();
  const { token } = useAuthStore();
  const { playTrack } = useMusicPlayer();

  const [feed, setFeed] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tokenRef = useRef(token);
  tokenRef.current = token;
  const hasLoadedRef = useRef(false);

  const loadFeed = useCallback(async (force = false) => {
    if (!tokenRef.current) { setLoading(false); return; }
    if (hasLoadedRef.current && !force) return;
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
    } catch {
      setError('Não foi possível carregar o feed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFeed(); }, []);

  const isEmpty = !feed || (
    feed.artists.length === 0 &&
    feed.albums.length === 0 &&
    (!feed.activity || feed.activity.length === 0)
  );

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>

      {/* ── Atividade dos amigos ──────────────────────────────────────────── */}
      <SectionWrapper
        title="Amigos ouvindo"
        onRefresh={!loading ? () => loadFeed(true) : undefined}
        loading={loading}
      >
        {!loading && !token && (
          <EmptyCard
            icon="account-group-outline"
            title="Entre para ver o que rolando"
            subtitle="Faça login para ver o que seus amigos estão ouvindo."
          />
        )}

        {!loading && token && isEmpty && (
          <EmptyCard
            icon="account-group-outline"
            title="Seu feed está vazio"
            subtitle="Siga artistas e pessoas para ver atividade aqui."
          />
        )}

        {loading && (
          <View style={{ alignItems: 'center', paddingVertical: 28 }}>
            <ActivityIndicator color="#f87171" />
          </View>
        )}

        {/* Atividade social */}
        {!loading && feed?.activity && feed.activity.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
          >
            {feed.activity.slice(0, 10).map((item) => (
              <ActivityCard
                key={item._id}
                item={item}
                onPressTrack={() => item.track && playTrack(item.track as any)}
                onPressAlbum={() => item.album && navigation.navigate('Album', { albumId: item.album._id })}
              />
            ))}
          </ScrollView>
        )}

        {/* Fallback: quando /feed ainda não retorna activity, mostra avatares de quem você segue */}
        {!loading && token && feed?.artists && feed.artists.length > 0 && !feed.activity && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
          >
            {feed.artists.map((artist: any) => (
              <ArtistBubble
                key={artist._id}
                artist={artist}
                onPress={() => navigation.navigate('Artist', { artistId: artist._id })}
              />
            ))}
          </ScrollView>
        )}
      </SectionWrapper>

      {/* ── Novidades — artistas que você segue ──────────────────────────── */}
      {!loading && feed?.albums && feed.albums.length > 0 && (
        <SectionWrapper title="Novidades" loading={false}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
          >
            {feed.albums.map((album: any) => (
              <AlbumCard
                key={album._id}
                album={album}
                onPress={() => navigation.navigate('Album', { albumId: album._id })}
              />
            ))}
          </ScrollView>
        </SectionWrapper>
      )}

    </Animated.View>
  );
};

// ─── Wrapper de seção ─────────────────────────────────────────────────────────
const SectionWrapper = ({
  title,
  children,
  loading,
  onRefresh,
}: {
  title: string;
  children: React.ReactNode;
  loading: boolean;
  onRefresh?: () => void;
}) => (
  <View style={{ marginBottom: 28 }}>
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      marginBottom: 14,
    }}>
      <Text style={{ color: '#fff', fontSize: 20, fontFamily: 'Poppins_700Bold' }}>
        {title}
      </Text>
      {onRefresh && !loading && (
        <TouchableOpacity onPress={onRefresh} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="refresh" size={20} color="#6b7280" />
        </TouchableOpacity>
      )}
    </View>
    {children}
  </View>
);

// ─── Card de atividade social ─────────────────────────────────────────────────
const ACTION_LABEL: Record<string, string> = {
  liked: 'curtiu',
  listening: 'ouvindo',
  added: 'adicionou',
};

const ActivityCard = ({
  item,
  onPressTrack,
  onPressAlbum,
}: {
  item: FeedActivity;
  onPressTrack: () => void;
  onPressAlbum: () => void;
}) => {
  const cover =
    item.track?.album?.cover ||
    item.album?.cover ||
    'https://via.placeholder.com/80/1a1a1a/ffffff?text=?';

  const title = item.track?.title || item.album?.title || '';
  const subtitle = item.track
    ? item.track.artists?.map((a) => a.name).join(', ')
    : item.album?.artist?.name || '';

  const onPress = item.track ? onPressTrack : onPressAlbum;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        width: 150,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <Image source={{ uri: cover }} style={{ width: 150, height: 100 }} resizeMode="cover" />
      <View style={{ padding: 10 }}>
        {/* Quem fez a ação */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          {item.user.avatar ? (
            <Image
              source={{ uri: item.user.avatar }}
              style={{ width: 18, height: 18, borderRadius: 9 }}
            />
          ) : (
            <View style={{
              width: 18, height: 18, borderRadius: 9,
              backgroundColor: 'rgba(220,38,38,0.3)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <MaterialCommunityIcons name="account" size={11} color="#f87171" />
            </View>
          )}
          <Text
            numberOfLines={1}
            style={{ color: '#9ca3af', fontSize: 10, fontFamily: 'Poppins_400Regular', flex: 1 }}
          >
            {item.user.name} {ACTION_LABEL[item.action] || item.action}
          </Text>
        </View>

        <Text numberOfLines={1} style={{ color: '#fff', fontSize: 12, fontFamily: 'Poppins_600SemiBold' }}>
          {title}
        </Text>
        <Text numberOfLines={1} style={{ color: '#6b7280', fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 2 }}>
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── Bolha de artista seguido (fallback quando não há activity) ───────────────
const ArtistBubble = ({ artist, onPress }: { artist: any; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={{ alignItems: 'center', width: 64 }} activeOpacity={0.8}>
    {artist.avatar ? (
      <Image
        source={{ uri: artist.avatar }}
        style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: '#dc2626' }}
      />
    ) : (
      <View style={{
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: 'rgba(220,38,38,0.2)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: '#dc2626',
      }}>
        <MaterialCommunityIcons name="account-music" size={24} color="#f87171" />
      </View>
    )}
    <Text
      numberOfLines={1}
      style={{ color: '#d1d5db', fontSize: 10, fontFamily: 'Poppins_400Regular', marginTop: 6, textAlign: 'center' }}
    >
      {artist.name}
    </Text>
  </TouchableOpacity>
);

// ─── Card de álbum (Novidades) ────────────────────────────────────────────────
const AlbumCard = ({ album, onPress }: { album: any; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={{ width: 130 }} activeOpacity={0.8}>
    {album.cover ? (
      <Image source={{ uri: album.cover }} style={{ width: 130, height: 130, borderRadius: 10 }} resizeMode="cover" />
    ) : (
      <View style={{
        width: 130, height: 130, borderRadius: 10,
        backgroundColor: 'rgba(220,38,38,0.15)',
        alignItems: 'center', justifyContent: 'center',
      }}>
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
);

// ─── Estado vazio ─────────────────────────────────────────────────────────────
const EmptyCard = ({ icon, title, subtitle }: { icon: any; title: string; subtitle: string }) => (
  <View style={{
    marginHorizontal: 24,
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
