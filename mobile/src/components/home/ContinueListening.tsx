// src/components/home/ContinueListening.tsx
import React, { useEffect, useRef, memo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Image,
  Animated, ScrollView, Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMusicData, Track } from '../../contexts/MusicDataContext';
import { useMusicPlayer } from '../../contexts/MusicPlayerContext';

const { width } = Dimensions.get('window');

// Primeiro card é destaque (maior), os demais são compactos
const FEATURED_SIZE = 160;
const CARD_SIZE = 110;

interface ContinueListeningProps {
  opacity: Animated.Value;
  translateY: Animated.Value;
}

export const ContinueListening = memo<ContinueListeningProps>(({ opacity, translateY }) => {
  const { listeningHistory } = useMusicData();
  const { currentTrack, isPlaying, playTrack } = useMusicPlayer();

  const isMounted = useRef(true);
  const lastTapRef = useRef<{ [key: string]: number }>({});

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Deduplica por álbum, mantém a última faixa ouvida de cada um
  const dedupedByAlbum = React.useMemo(() => {
    if (!listeningHistory || listeningHistory.length === 0) return [];
    const seenAlbums = new Set<string>();
    const result: Track[] = [];
    for (const track of listeningHistory) {
      const albumKey = track.album?._id || track.album?.title || track._id;
      if (!seenAlbums.has(albumKey)) {
        seenAlbums.add(albumKey);
        result.push(track);
      }
    }
    return result.slice(0, 8);
  }, [listeningHistory]);

  // Debounce por track para evitar duplo toque
  const handlePlayTrack = useCallback((track: Track) => {
    const now = Date.now();
    const lastTap = lastTapRef.current[track._id] || 0;
    if (now - lastTap < 300) return;
    lastTapRef.current[track._id] = now;
    playTrack(track);
  }, [playTrack]);

  // ─── Vazio ─────────────────────────────────────────────────────────────────
  if (dedupedByAlbum.length === 0) {
    return (
      <Animated.View style={{ opacity, transform: [{ translateY }], paddingHorizontal: 24, marginBottom: 28 }}>
        <SectionHeader title="Continue Ouvindo" count={null} />
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: 16,
          padding: 32,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
        }}>
          <MaterialCommunityIcons name="history" size={44} color="#4b5563" />
          <Text style={{ color: '#e5e7eb', fontFamily: 'Poppins_600SemiBold', fontSize: 15, marginTop: 12, textAlign: 'center' }}>
            Toque em uma música para começar
          </Text>
          <Text style={{ color: '#6b7280', fontFamily: 'Poppins_400Regular', fontSize: 12, marginTop: 6, textAlign: 'center' }}>
            Seu histórico aparecerá aqui
          </Text>
        </View>
      </Animated.View>
    );
  }

  const [featured, ...rest] = dedupedByAlbum;

  // ─── Conteúdo ──────────────────────────────────────────────────────────────
  return (
    <Animated.View style={{ opacity, transform: [{ translateY }], marginBottom: 28 }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, marginBottom: 14 }}>
        <SectionHeader
          title="Continue Ouvindo"
          count={`${dedupedByAlbum.length} ${dedupedByAlbum.length === 1 ? 'álbum' : 'álbuns'}`}
        />
      </View>

      {/* Scroll horizontal */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
      >
        {/* Card destaque — primeiro item, maior */}
        <FeaturedCard
          track={featured}
          isCurrentPlaying={currentTrack?._id === featured._id && isPlaying}
          onPress={() => handlePlayTrack(featured)}
        />

        {/* Demais cards — compactos */}
        {rest.map((track) => (
          <CompactCard
            key={track._id}
            track={track}
            isCurrentPlaying={currentTrack?._id === track._id && isPlaying}
            onPress={() => handlePlayTrack(track)}
          />
        ))}
      </ScrollView>
    </Animated.View>
  );
});

// ─── Card destaque (160×160 + info abaixo) ────────────────────────────────────
const FeaturedCard = ({
  track,
  isCurrentPlaying,
  onPress,
}: {
  track: Track;
  isCurrentPlaying: boolean;
  onPress: () => void;
}) => {
  const coverUri = track.album?.cover || track.coverUrl || 'https://via.placeholder.com/160/1a1a1a/ffffff?text=Cover';
  const artistName = track.artists?.map((a: any) => a.name).join(', ') || 'Artista desconhecido';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{ width: FEATURED_SIZE }}
    >
      <View style={{ position: 'relative' }}>
        <Image
          source={{ uri: coverUri }}
          style={{
            width: FEATURED_SIZE,
            height: FEATURED_SIZE,
            borderRadius: 12,
            borderWidth: isCurrentPlaying ? 2 : 0,
            borderColor: '#f87171',
          }}
          resizeMode="cover"
        />
        {/* Badge tocando */}
        {isCurrentPlaying && (
          <View style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            backgroundColor: 'rgba(220,38,38,0.9)',
            borderRadius: 20,
            paddingHorizontal: 8,
            paddingVertical: 4,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}>
            <MaterialCommunityIcons name="equalizer" size={12} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'Poppins_600SemiBold' }}>
              Tocando
            </Text>
          </View>
        )}
        {/* Play overlay quando não está tocando */}
        {!isCurrentPlaying && (
          <View style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderRadius: 20,
            padding: 4,
          }}>
            <MaterialCommunityIcons name="play" size={16} color="#fff" />
          </View>
        )}
      </View>

      <Text
        numberOfLines={1}
        style={{
          color: isCurrentPlaying ? '#f87171' : '#fff',
          fontFamily: 'Poppins_600SemiBold',
          fontSize: 13,
          marginTop: 8,
        }}
      >
        {track.title || 'Sem título'}
      </Text>
      <Text
        numberOfLines={1}
        style={{
          color: '#6b7280',
          fontFamily: 'Poppins_400Regular',
          fontSize: 11,
          marginTop: 2,
        }}
      >
        {artistName}
      </Text>
    </TouchableOpacity>
  );
};

// ─── Card compacto (110×110 + info abaixo) ────────────────────────────────────
const CompactCard = ({
  track,
  isCurrentPlaying,
  onPress,
}: {
  track: Track;
  isCurrentPlaying: boolean;
  onPress: () => void;
}) => {
  const coverUri = track.album?.cover || track.coverUrl || 'https://via.placeholder.com/110/1a1a1a/ffffff?text=Cover';
  const artistName = track.artists?.map((a: any) => a.name).join(', ') || 'Artista desconhecido';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{ width: CARD_SIZE }}
    >
      <View style={{ position: 'relative' }}>
        <Image
          source={{ uri: coverUri }}
          style={{
            width: CARD_SIZE,
            height: CARD_SIZE,
            borderRadius: 10,
            borderWidth: isCurrentPlaying ? 2 : 0,
            borderColor: '#f87171',
          }}
          resizeMode="cover"
        />
        {isCurrentPlaying && (
          <View style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 10,
            backgroundColor: 'rgba(220,38,38,0.25)',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <MaterialCommunityIcons name="equalizer" size={24} color="#fff" />
          </View>
        )}
      </View>

      <Text
        numberOfLines={1}
        style={{
          color: isCurrentPlaying ? '#f87171' : '#fff',
          fontFamily: 'Poppins_600SemiBold',
          fontSize: 11,
          marginTop: 6,
        }}
      >
        {track.title || 'Sem título'}
      </Text>
      <Text
        numberOfLines={1}
        style={{
          color: '#6b7280',
          fontFamily: 'Poppins_400Regular',
          fontSize: 10,
          marginTop: 1,
        }}
      >
        {artistName}
      </Text>
    </TouchableOpacity>
  );
};

// ─── Header de seção reutilizável ─────────────────────────────────────────────
const SectionHeader = ({ title, count }: { title: string; count: string | null }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
    <Text style={{ color: '#fff', fontSize: 20, fontFamily: 'Poppins_700Bold' }}>
      {title}
    </Text>
    {count && (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <MaterialCommunityIcons name="history" size={14} color="#6b7280" />
        <Text style={{ color: '#6b7280', fontSize: 12, fontFamily: 'Poppins_400Regular' }}>
          {count}
        </Text>
      </View>
    )}
  </View>
);
