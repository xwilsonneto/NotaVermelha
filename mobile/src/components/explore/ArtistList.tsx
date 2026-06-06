// src/components/explore/ArtistList.tsx
//
// Antes: FeaturedBands — vivia na Home.
// Agora: ArtistList — vive na aba Explorar.
//
// Mostra todos os artistas ordenados por ouvintes mensais.
// Ao tocar em um artista navega para ArtistScreen.
// O botão play inicia a primeira faixa do artista.

import React from 'react';
import {
  View, Text, TouchableOpacity, Image,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigation';
import { useMusicData, Artist } from '../../contexts/MusicDataContext';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface ArtistListProps {
  /** Limita quantos artistas exibir. Omita para exibir todos. */
  limit?: number;
  /** Título da seção. Default: "Artistas" */
  title?: string;
}

export const ArtistList: React.FC<ArtistListProps> = ({
  limit,
  title = 'Artistas',
}) => {
  const navigation = useNavigation<NavProp>();
  const { artists, loading, getTracksByArtist, playTrack } = useMusicData();

  const handlePlayArtist = (artist: Artist) => {
    const tracks = getTracksByArtist(artist._id);
    if (tracks.length > 0) playTrack(tracks[0]);
  };

  const handleNavigateToArtist = (artist: Artist) => {
    navigation.navigate('Artist', { artistId: artist._id });
  };

  const formatListeners = (n?: number): string => {
    if (!n) return '0';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
    return String(n);
  };

  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}min` : `${m} min`;
  };

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 40 }}>
        <ActivityIndicator color="#f87171" />
      </View>
    );
  }

  // ─── Vazio ──────────────────────────────────────────────────────────────────
  if (artists.length === 0) {
    return (
      <View style={{ paddingHorizontal: 24 }}>
        <Text style={{ color: '#fff', fontSize: 20, fontFamily: 'Poppins_700Bold', marginBottom: 14 }}>
          {title}
        </Text>
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: 16,
          padding: 32,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
        }}>
          <MaterialCommunityIcons name="account-music-outline" size={44} color="#4b5563" />
          <Text style={{ color: '#e5e7eb', fontFamily: 'Poppins_600SemiBold', fontSize: 15, marginTop: 12 }}>
            Nenhum artista disponível
          </Text>
        </View>
      </View>
    );
  }

  // Ordena por ouvintes mensais e aplica limite opcional
  const sorted = [...artists]
    .sort((a, b) => (b.monthlyListeners || 0) - (a.monthlyListeners || 0));
  const displayed = limit ? sorted.slice(0, limit) : sorted;

  // ─── Lista ──────────────────────────────────────────────────────────────────
  return (
    <View>
      {/* Header */}
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
        <Text style={{ color: '#6b7280', fontSize: 12, fontFamily: 'Poppins_400Regular' }}>
          {artists.length} {artists.length === 1 ? 'artista' : 'artistas'}
        </Text>
      </View>

      {/* Itens */}
      <ScrollView showsVerticalScrollIndicator={false} scrollEnabled={false}>
        {displayed.map((artist) => {
          const tracks = getTracksByArtist(artist._id);
          const totalDuration = tracks.reduce((s, t) => s + t.duration, 0);

          return (
            <TouchableOpacity
              key={artist._id}
              onPress={() => handleNavigateToArtist(artist)}
              activeOpacity={0.75}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(255,255,255,0.05)',
              }}
            >
              {/* Avatar */}
              {artist.avatar ? (
                <Image
                  source={{ uri: artist.avatar }}
                  style={{ width: 52, height: 52, borderRadius: 26 }}
                  resizeMode="cover"
                />
              ) : (
                <View style={{
                  width: 52, height: 52, borderRadius: 26,
                  backgroundColor: 'rgba(220,38,38,0.2)',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <MaterialCommunityIcons name="account-music" size={26} color="#f87171" />
                </View>
              )}

              {/* Info */}
              <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ color: '#fff', fontSize: 15, fontFamily: 'Poppins_600SemiBold' }}>
                    {artist.name}
                  </Text>
                  {artist.verified && (
                    <MaterialCommunityIcons name="check-decagram" size={14} color="#3b82f6" />
                  )}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 3 }}>
                  <StatChip
                    icon="headphones"
                    label={`${formatListeners(artist.monthlyListeners)}/mês`}
                  />
                  <StatChip
                    icon="music-note"
                    label={`${tracks.length} música${tracks.length !== 1 ? 's' : ''}`}
                  />
                  {totalDuration > 0 && (
                    <StatChip icon="clock-outline" label={formatDuration(totalDuration)} />
                  )}
                </View>

                {/* Gêneros */}
                {artist.genre && artist.genre.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                    {artist.genre.slice(0, 3).map((genre: string, i: number) => (
                      <View key={i} style={{
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 999,
                      }}>
                        <Text style={{ color: '#9ca3af', fontSize: 10, fontFamily: 'Poppins_400Regular' }}>
                          {genre}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Botão play */}
              <TouchableOpacity
                onPress={(e) => { e.stopPropagation(); handlePlayArtist(artist); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ marginLeft: 12 }}
              >
                <MaterialCommunityIcons name="play-circle" size={32} color="#f87171" />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

// ─── Chip de estatística ──────────────────────────────────────────────────────
const StatChip = ({ icon, label }: { icon: any; label: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
    <MaterialCommunityIcons name={icon} size={12} color="#6b7280" />
    <Text style={{ color: '#9ca3af', fontSize: 11, fontFamily: 'Poppins_400Regular' }}>
      {label}
    </Text>
  </View>
);
