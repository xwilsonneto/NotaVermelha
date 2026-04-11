// src/screens/AlbumScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/AppNavigation';
import { useMusicData, Track, Album } from '../contexts/MusicDataContext';
import { MiniPlayer } from '../components/player/MiniPlayer';
import { BottomNavigation } from '../components/home/BottomNavigation';

type AlbumRouteProp = RouteProp<RootStackParamList, 'Album'>;
type AlbumNavProp = NativeStackNavigationProp<RootStackParamList>;

const formatDuration = (seconds: number): string => {
  if (!seconds) return '0:00';
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
};

export default function AlbumScreen() {
  const navigation = useNavigation<AlbumNavProp>();
  const route = useRoute<AlbumRouteProp>();
  const insets = useSafeAreaInsets();
  const { albumId } = route.params;

  const {
    albums, tracks, artists,
    getTracksByAlbum,
    playTrack, currentTrack, isPlaying,
    likeAlbum, unlikeAlbum, checkAlbumLiked,
  } = useMusicData();

  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [checkingLike, setCheckingLike] = useState(true);

  const album: Album | undefined = albums.find(a => a._id === albumId);
  const albumTracks = getTracksByAlbum(albumId).sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0));

  // Descobre o artista pelo primeiro track
  const artistId = albumTracks[0]?.artists?.[0]?._id;
  const artist = artistId ? artists.find(a => a._id === artistId) : undefined;

  const scrollY = React.useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({ inputRange: [0, 220], outputRange: [0, 1], extrapolate: 'clamp' });

  // Verifica like
  useEffect(() => {
    let cancelled = false;
    checkAlbumLiked(albumId).then(v => {
      if (!cancelled) { setIsLiked(v); setCheckingLike(false); }
    });
    return () => { cancelled = true; };
  }, [albumId, checkAlbumLiked]);

  const handleLike = useCallback(async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      if (isLiked) {
        await unlikeAlbum(albumId);
        setIsLiked(false);
      } else {
        await likeAlbum(albumId);
        setIsLiked(true);
      }
    } catch (e) {
      console.error('Erro no like:', e);
    } finally {
      setLikeLoading(false);
    }
  }, [isLiked, likeLoading, albumId, likeAlbum, unlikeAlbum]);

  const handlePlayAll = useCallback(() => {
    if (albumTracks.length > 0) playTrack(albumTracks[0]);
  }, [albumTracks, playTrack]);

  const totalDuration = albumTracks.reduce((s, t) => s + (t.duration || 0), 0);
  const totalMin = Math.round(totalDuration / 60);

  if (!album) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#f87171" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <StatusBar translucent backgroundColor="transparent" />

      {/* Header fixo */}
      <Animated.View style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
        paddingTop: insets.top,
        backgroundColor: '#0a0a0a',
        opacity: headerOpacity,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 16, marginLeft: 12, flex: 1 }} numberOfLines={1}>
            {album.title}
          </Text>
        </View>
      </Animated.View>

      <Animated.ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {/* Hero do álbum */}
        <LinearGradient
          colors={['#7f1d1d', '#3f0d0d', '#0a0a0a']}
          style={{ paddingTop: insets.top + 60, paddingBottom: 28, paddingHorizontal: 24, alignItems: 'center' }}
        >
          {/* Botão voltar */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ position: 'absolute', top: insets.top + 12, left: 16, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, padding: 6 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>

          {/* Capa do álbum - CORRIGIDO: elevation removido do style do Image */}
          {album.cover ? (
            <View style={{ elevation: 12, borderRadius: 12 }}>
              <Image
                source={{ uri: album.cover }}
                style={{ width: 180, height: 180, borderRadius: 12 }}
                resizeMode="cover"
              />
            </View>
          ) : (
            <View style={{ width: 180, height: 180, borderRadius: 12, backgroundColor: 'rgba(220,38,38,0.2)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="album" size={72} color="#f87171" />
            </View>
          )}

          {/* Título */}
          <Text style={{ color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 22, marginTop: 20, textAlign: 'center' }}>
            {album.title}
          </Text>

          {/* Artista */}
          {artist && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Artist', { artistId: artist._id })}
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}
              activeOpacity={0.7}
            >
              {artist.avatar ? (
                <Image source={{ uri: artist.avatar }} style={{ width: 22, height: 22, borderRadius: 11 }} />
              ) : null}
              <Text style={{ color: '#f87171', fontFamily: 'Poppins_600SemiBold', fontSize: 14, marginLeft: artist.avatar ? 6 : 0 }}>
                {artist.name}
              </Text>
              {artist.verified && <MaterialCommunityIcons name="check-decagram" size={14} color="#3b82f6" style={{ marginLeft: 4 }} />}
            </TouchableOpacity>
          )}

          {/* Meta info */}
          <Text style={{ color: '#9ca3af', fontFamily: 'Poppins_400Regular', fontSize: 12, marginTop: 6 }}>
            {albumTracks.length} música{albumTracks.length !== 1 ? 's' : ''}
            {totalMin > 0 ? `  •  ${totalMin} min` : ''}
            {album.releaseDate ? `  •  ${new Date(album.releaseDate).getFullYear()}` : ''}
          </Text>

          {/* Gêneros */}
          {album.genre && album.genre.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 10 }}>
              {album.genre.slice(0, 3).map((g, i) => (
                <View key={i} style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, marginHorizontal: 3, marginBottom: 4 }}>
                  <Text style={{ color: '#d1d5db', fontSize: 11, fontFamily: 'Poppins_400Regular' }}>{g}</Text>
                </View>
              ))}
            </View>
          )}
        </LinearGradient>

        {/* Ações: Play + Like */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 12 }}>
          {/* Like */}
          <TouchableOpacity
            onPress={handleLike}
            disabled={likeLoading || checkingLike}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: isLiked ? 0 : 1,
              borderColor: '#f87171',
              backgroundColor: isLiked ? 'rgba(248,113,113,0.18)' : 'transparent',
              borderRadius: 24,
              paddingVertical: 10,
              paddingHorizontal: 20,
              opacity: likeLoading || checkingLike ? 0.6 : 1,
            }}
            activeOpacity={0.8}
          >
            {likeLoading ? (
              <ActivityIndicator size="small" color="#f87171" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={18}
                  color="#f87171"
                />
                <Text style={{ color: '#f87171', fontFamily: 'Poppins_600SemiBold', fontSize: 13, marginLeft: 6 }}>
                  {isLiked ? 'Curtido' : 'Curtir'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Play All */}
          <TouchableOpacity
            onPress={handlePlayAll}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#dc2626', borderRadius: 24, paddingVertical: 10 }}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="play" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 13, marginLeft: 6 }}>
              Reproduzir
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista de faixas */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={{ color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 18, marginBottom: 14 }}>
            Faixas
          </Text>
          {albumTracks.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <MaterialCommunityIcons name="music-off" size={40} color="#4b5563" />
              <Text style={{ color: '#6b7280', fontFamily: 'Poppins_400Regular', fontSize: 13, marginTop: 10 }}>
                Nenhuma faixa disponível
              </Text>
            </View>
          ) : (
            albumTracks.map((track, index) => {
              const isCurrentPlaying = currentTrack?._id === track._id && isPlaying;
              return (
                <TouchableOpacity
                  key={track._id}
                  onPress={() => playTrack(track)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(255,255,255,0.06)',
                    backgroundColor: isCurrentPlaying ? 'rgba(220,38,38,0.08)' : 'transparent',
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    marginHorizontal: -8,
                  }}
                >
                  {/* Número ou equalizer */}
                  <View style={{ width: 28, alignItems: 'center' }}>
                    {isCurrentPlaying ? (
                      <MaterialCommunityIcons name="equalizer" size={16} color="#f87171" />
                    ) : (
                      <Text style={{ color: '#6b7280', fontFamily: 'Poppins_400Regular', fontSize: 13 }}>
                        {track.trackNumber || index + 1}
                      </Text>
                    )}
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text numberOfLines={1} style={{ color: isCurrentPlaying ? '#f87171' : '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 14 }}>
                      {track.title}
                    </Text>
                    <Text numberOfLines={1} style={{ color: '#9ca3af', fontFamily: 'Poppins_400Regular', fontSize: 11, marginTop: 2 }}>
                      {track.artists?.map(a => a.name).join(', ') || 'Artista desconhecido'}
                    </Text>
                  </View>

                  {/* Duração */}
                  <Text style={{ color: '#6b7280', fontFamily: 'Poppins_400Regular', fontSize: 12 }}>
                    {formatDuration(track.duration)}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </Animated.ScrollView>

      <MiniPlayer />
      <BottomNavigation activeTab="search" />
    </View>
  );
}