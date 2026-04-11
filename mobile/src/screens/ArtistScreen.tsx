// src/screens/ArtistScreen.tsx
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
import { useMusicData, Track, Album, Artist } from '../contexts/MusicDataContext';
import { MiniPlayer } from '../components/player/MiniPlayer';
import { BottomNavigation } from '../components/home/BottomNavigation';

type ArtistRouteProp = RouteProp<RootStackParamList, 'Artist'>;
type ArtistNavProp = NativeStackNavigationProp<RootStackParamList>;

const formatDuration = (seconds: number): string => {
  if (!seconds) return '0:00';
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
};

const formatListeners = (n?: number): string => {
  if (!n) return '0';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

export default function ArtistScreen() {
  const navigation = useNavigation<ArtistNavProp>();
  const route = useRoute<ArtistRouteProp>();
  const insets = useSafeAreaInsets();
  const { artistId } = route.params;

  const {
    artists, tracks,
    getTracksByArtist, getAlbumsByArtist,
    playTrack, pauseTrack, resumeTrack,
    currentTrack, isPlaying,
    followArtist, unfollowArtist, checkFollowingArtist,
  } = useMusicData();

  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [checkingFollow, setCheckingFollow] = useState(true);

  const artist: Artist | undefined = artists.find(a => a._id === artistId);
  const artistTracks = getTracksByArtist(artistId);
  const artistAlbums = getAlbumsByArtist(artistId);

  // Top 5 músicas por playCount
  const top5Tracks = [...artistTracks]
    .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
    .slice(0, 5);

  // Hero: ignora artist.avatar (campo legado com imagem aleatória)
  // Usa sempre a capa do álbum mais recente da banda
  const latestAlbum = artistAlbums.length > 0
    ? [...artistAlbums].sort((a, b) => {
        const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
        const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
        return dateB - dateA;
      })[0]
    : null;

  const heroImageUri = latestAlbum?.cover || null;

  // ─── FIX 3: Estado do play/pause ─────────────────────────────────────────
  // A música tocando é de alguma track desse artista?
  const isArtistPlaying = isPlaying && artistTracks.some(t => t._id === currentTrack?._id);

  const scrollY = React.useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({ inputRange: [0, 200], outputRange: [0, 1], extrapolate: 'clamp' });

  // Verifica se já segue o artista
  useEffect(() => {
    let cancelled = false;
    checkFollowingArtist(artistId).then(v => {
      if (!cancelled) { setIsFollowing(v); setCheckingFollow(false); }
    });
    return () => { cancelled = true; };
  }, [artistId, checkFollowingArtist]);

  const handleFollow = useCallback(async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowArtist(artistId);
        setIsFollowing(false);
      } else {
        await followArtist(artistId);
        setIsFollowing(true);
      }
    } catch (e) {
      console.error('Erro no follow:', e);
    } finally {
      setFollowLoading(false);
    }
  }, [isFollowing, followLoading, artistId, followArtist, unfollowArtist]);

  // ─── FIX 3: Botão play/pause inteligente ─────────────────────────────────
  const handlePlayPause = useCallback(async () => {
    if (top5Tracks.length === 0) return;

    if (isArtistPlaying) {
      // Já está tocando uma música desse artista → pausar
      await pauseTrack();
    } else if (!isPlaying && currentTrack && artistTracks.some(t => t._id === currentTrack._id)) {
      // Estava pausado em uma música desse artista → retomar
      await resumeTrack();
    } else {
      // Outra música tocando ou nenhuma → iniciar top track
      await playTrack(top5Tracks[0]);
    }
  }, [top5Tracks, isArtistPlaying, isPlaying, currentTrack, artistTracks, pauseTrack, resumeTrack, playTrack]);

  if (!artist) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#f87171" />
      </View>
    );
  }

  const totalDuration = artistTracks.reduce((s, t) => s + (t.duration || 0), 0);
  const totalDurationMin = Math.round(totalDuration / 60);

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <StatusBar translucent backgroundColor="transparent" />

      {/* Header fixo com fade ao rolar */}
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
            {artist.name}
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
        {/* Hero com gradiente */}
        <View style={{ height: 320 }}>
          {/* FIX 1: heroImageUri usa avatar OU capa do álbum mais recente */}
          {heroImageUri ? (
            <Image source={{ uri: heroImageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <LinearGradient colors={['#7f1d1d', '#0a0a0a']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="account-music" size={80} color="#f87171" />
            </LinearGradient>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(10,10,10,0.6)', '#0a0a0a']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 180 }}
          />
          {/* Botão voltar sobre a imagem */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ position: 'absolute', top: insets.top + 8, left: 16, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 6 }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Infos do artista */}
        <View style={{ paddingHorizontal: 20, marginTop: -40 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 26 }} numberOfLines={1}>
                  {artist.name}
                </Text>
                {artist.verified && (
                  <MaterialCommunityIcons name="check-decagram" size={20} color="#3b82f6" style={{ marginLeft: 6 }} />
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <MaterialCommunityIcons name="headphones" size={14} color="#9ca3af" />
                <Text style={{ color: '#9ca3af', fontFamily: 'Poppins_400Regular', fontSize: 13, marginLeft: 5 }}>
                  {formatListeners(artist.monthlyListeners)} ouvintes/mês
                </Text>
              </View>
            </View>

            {/* FIX 3: Botão play/pause com ícone correto */}
            <TouchableOpacity
              onPress={handlePlayPause}
              style={{ backgroundColor: '#dc2626', borderRadius: 28, width: 56, height: 56, alignItems: 'center', justifyContent: 'center', elevation: 6 }}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name={isArtistPlaying ? 'pause' : 'play'}
                size={28}
                color="#fff"
              />
            </TouchableOpacity>
          </View>

          {/* Gêneros */}
          {artist.genre && artist.genre.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
              {artist.genre.slice(0, 4).map((g, i) => (
                <View key={i} style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6, marginBottom: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
                  <Text style={{ color: '#d1d5db', fontSize: 11, fontFamily: 'Poppins_400Regular' }}>{g}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Stats rápidas */}
          <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ color: '#f87171', fontFamily: 'Poppins_700Bold', fontSize: 18 }}>{artistTracks.length}</Text>
              <Text style={{ color: '#9ca3af', fontFamily: 'Poppins_400Regular', fontSize: 11, marginTop: 2 }}>Músicas</Text>
            </View>
            <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ color: '#f87171', fontFamily: 'Poppins_700Bold', fontSize: 18 }}>{artistAlbums.length}</Text>
              <Text style={{ color: '#9ca3af', fontFamily: 'Poppins_400Regular', fontSize: 11, marginTop: 2 }}>Álbuns</Text>
            </View>
            <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ color: '#f87171', fontFamily: 'Poppins_700Bold', fontSize: 18 }}>{totalDurationMin}min</Text>
              <Text style={{ color: '#9ca3af', fontFamily: 'Poppins_400Regular', fontSize: 11, marginTop: 2 }}>Duração</Text>
            </View>
          </View>

          {/* FIX 2: Botão Follow — lógica já estava certa, funciona com api.ts corrigido */}
          <TouchableOpacity
            onPress={handleFollow}
            disabled={followLoading || checkingFollow}
            style={{
              borderWidth: isFollowing ? 0 : 1,
              borderColor: '#dc2626',
              backgroundColor: isFollowing ? '#dc2626' : 'transparent',
              borderRadius: 24,
              paddingVertical: 10,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              marginBottom: 28,
              opacity: followLoading || checkingFollow ? 0.6 : 1,
            }}
            activeOpacity={0.8}
          >
            {followLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name={isFollowing ? 'account-check' : 'account-plus-outline'}
                  size={18}
                  color={isFollowing ? '#fff' : '#dc2626'}
                />
                <Text style={{ color: isFollowing ? '#fff' : '#dc2626', fontFamily: 'Poppins_600SemiBold', fontSize: 14, marginLeft: 6 }}>
                  {isFollowing ? 'Seguindo' : 'Seguir'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Top 5 Músicas */}
          {top5Tracks.length > 0 && (
            <View style={{ marginBottom: 28 }}>
              <Text style={{ color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 18, marginBottom: 14 }}>
                Top músicas
              </Text>
              {top5Tracks.map((track, index) => {
                const isCurrentPlaying = currentTrack?._id === track._id && isPlaying;
                return (
                  <TouchableOpacity
                    key={track._id}
                    onPress={() => playTrack(track)}
                    activeOpacity={0.7}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}
                  >
                    <Text style={{ color: isCurrentPlaying ? '#f87171' : '#6b7280', fontFamily: 'Poppins_600SemiBold', fontSize: 13, width: 24 }}>
                      {index + 1}
                    </Text>
                    <Image
                      source={{ uri: track.album?.cover || track.coverUrl || 'https://via.placeholder.com/150' }}
                      style={{ width: 44, height: 44, borderRadius: 6, marginRight: 12 }}
                      resizeMode="cover"
                    />
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={{ color: isCurrentPlaying ? '#f87171' : '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 13 }}>
                        {track.title}
                      </Text>
                      <Text numberOfLines={1} style={{ color: '#9ca3af', fontFamily: 'Poppins_400Regular', fontSize: 11, marginTop: 2 }}>
                        {track.album?.title || ''}
                      </Text>
                    </View>
                    {isCurrentPlaying ? (
                      <MaterialCommunityIcons name="equalizer" size={18} color="#f87171" />
                    ) : (
                      <Text style={{ color: '#6b7280', fontSize: 11, fontFamily: 'Poppins_400Regular' }}>
                        {formatDuration(track.duration)}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Álbuns do artista */}
          {artistAlbums.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 18, marginBottom: 14 }}>
                Álbuns
              </Text>
              {artistAlbums.map(album => {
                const albumTracks = tracks.filter(t => t.album?._id === album._id);
                return (
                  <TouchableOpacity
                    key={album._id}
                    onPress={() => navigation.navigate('Album', { albumId: album._id })}
                    activeOpacity={0.7}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}
                  >
                    {album.cover ? (
                      <Image source={{ uri: album.cover }} style={{ width: 56, height: 56, borderRadius: 8 }} resizeMode="cover" />
                    ) : (
                      <View style={{ width: 56, height: 56, borderRadius: 8, backgroundColor: 'rgba(220,38,38,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                        <MaterialCommunityIcons name="album" size={26} color="#f87171" />
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text numberOfLines={1} style={{ color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 14 }}>
                        {album.title}
                      </Text>
                      <Text style={{ color: '#9ca3af', fontFamily: 'Poppins_400Regular', fontSize: 12, marginTop: 3 }}>
                        {albumTracks.length} música{albumTracks.length !== 1 ? 's' : ''}
                        {album.releaseDate ? `  •  ${new Date(album.releaseDate).getFullYear()}` : ''}
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#6b7280" />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </Animated.ScrollView>

      <MiniPlayer />
      <BottomNavigation activeTab="search" />
    </View>
  );
}
