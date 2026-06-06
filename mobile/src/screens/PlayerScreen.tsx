// src/screens/PlayerScreen.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { useMusicData } from '../contexts/MusicDataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/AppNavigation';
import { useAuthStore } from '../store/authStore';

type PlayerScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Player'>;

const { width: screenWidth } = Dimensions.get('window');
// Capa levemente menor para liberar espaço vertical
const COVER_SIZE = screenWidth * 0.72;

export default function PlayerScreen() {
  const navigation = useNavigation<PlayerScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();

  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    togglePlayPause,
    playNext,
    playPrevious,
    seekTo,
  } = useMusicPlayer();

  const {
    likedTrackIds,
    likeTrack,
    unlikeTrack,
  } = useMusicData();

  const isLiked = currentTrack ? likedTrackIds.has(currentTrack._id) : false;
  const localLikeCount = currentTrack?.likeCount ?? 0;

  const [imageError, setImageError] = useState(false);
  const [progressBarWidth, setProgressBarWidth] = useState(screenWidth - 40);

  // ── Estado local do ícone play/pause ─────────────────────────────────────
  // Inverte imediatamente no toque para alinhar com a animação do botão,
  // sem aguardar a Promise do contexto resolver.
  const [iconPlaying, setIconPlaying] = useState(isPlaying);
  useEffect(() => {
    setIconPlaying(isPlaying);
  }, [isPlaying]);

  // ── Animações de ENTRADA ──────────────────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;

  // ── Animações de BOTÃO ────────────────────────────────────────────────────
  const playButtonScale = useRef(new Animated.Value(1)).current;
  const prevButtonScale = useRef(new Animated.Value(1)).current;
  const nextButtonScale = useRef(new Animated.Value(1)).current;
  const likeScale = useRef(new Animated.Value(1)).current;

  const isClosing = useRef(false);

  // ── Entrada ───────────────────────────────────────────────────────────────
  useEffect(() => {
    isClosing.current = false;
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
    ]).start();
  }, []);

  // Reseta imageError quando a track muda
  useEffect(() => {
    if (currentTrack) setImageError(false);
  }, [currentTrack?._id]);

  // ── Saída ─────────────────────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    if (isClosing.current) return;
    isClosing.current = true;
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
        easing: Easing.in(Easing.quad),
      }),
      Animated.timing(slideAnim, {
        toValue: 28,
        duration: 180,
        useNativeDriver: true,
        easing: Easing.in(Easing.quad),
      }),
    ]).start(() => navigation.goBack());
  }, [fadeAnim, slideAnim, navigation]);

  // ── Feedback visual dos botões ────────────────────────────────────────────
  const animateButton = useCallback((anim: Animated.Value) => {
    Animated.sequence([
      Animated.timing(anim, { toValue: 0.85, duration: 40, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 1, duration: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Controles ─────────────────────────────────────────────────────────────
  const handleTogglePlayPause = useCallback(() => {
    setIconPlaying(prev => !prev); // ícone muda junto com a animação
    animateButton(playButtonScale);
    togglePlayPause().catch((e: any) => {
      setIconPlaying(isPlaying); // reverte se der erro
      console.error('Erro play/pause:', e);
    });
  }, [togglePlayPause, animateButton, playButtonScale, isPlaying]);

  const handlePlayNext = useCallback(() => {
    animateButton(nextButtonScale);
    playNext().catch((e: any) => console.error('Erro skip next:', e));
  }, [playNext, animateButton, nextButtonScale]);

  const handlePlayPrevious = useCallback(() => {
    animateButton(prevButtonScale);
    playPrevious().catch((e: any) => console.error('Erro skip prev:', e));
  }, [playPrevious, animateButton, prevButtonScale]);

  // ── Seek ──────────────────────────────────────────────────────────────────
  const handleSeek = useCallback((event: any) => {
    if (!duration || duration <= 0) return;
    const touchX = event.nativeEvent.locationX;
    const percentage = Math.max(0, Math.min(1, touchX / progressBarWidth));
    seekTo(percentage * duration);
  }, [duration, progressBarWidth, seekTo]);

  // ── Like ──────────────────────────────────────────────────────────────────
  const handleLike = useCallback(() => {
    if (!currentTrack || !isAuthenticated) return;
    Animated.sequence([
      Animated.timing(likeScale, { toValue: 1.4, duration: 80, useNativeDriver: true }),
      Animated.timing(likeScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    if (isLiked) {
      unlikeTrack(currentTrack._id);
    } else {
      likeTrack(currentTrack._id);
    }
  }, [currentTrack, isAuthenticated, isLiked, likeTrack, unlikeTrack, likeScale]);

  // ── Formatação ────────────────────────────────────────────────────────────
  const formatTime = useCallback((seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // ── Sem track ─────────────────────────────────────────────────────────────
  if (!currentTrack) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
        <MaterialCommunityIcons name="music-off" size={48} color="#4b5563" />
        <Text style={{ color: '#6b7280', marginTop: 12, fontFamily: 'Poppins_400Regular' }}>
          Nenhuma música selecionada
        </Text>
      </View>
    );
  }

  const albumCover = currentTrack.album?.cover || currentTrack.coverUrl || '';
  const trackTitle = currentTrack.title || 'Título desconhecido';
  const artistNames = currentTrack.artists?.map((a: any) => a.name).join(', ') || 'Artista desconhecido';
  const albumTitle = currentTrack.album?.title || 'Álbum desconhecido';
  const releaseYear = currentTrack.releaseDate
    ? new Date(currentTrack.releaseDate).getFullYear()
    : '';

  const progressPercentage = duration > 0
    ? Math.min((position / duration) * 100, 100)
    : 0;

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <LinearGradient colors={['#0a0a0a', '#1a1a1a', '#2a2a2a']} style={{ flex: 1 }}>
        <StatusBar translucent backgroundColor="transparent" />

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: insets.top + 12,
          paddingBottom: 8,
        }}>
          <TouchableOpacity
            onPress={handleBack}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            style={{ padding: 8 }}
          >
            <MaterialCommunityIcons name="chevron-down" size={32} color="#f87171" />
          </TouchableOpacity>

          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Poppins_600SemiBold' }} numberOfLines={1}>
              Tocando agora
            </Text>
            <Text style={{ color: '#9ca3af', fontSize: 13, fontFamily: 'Poppins_400Regular' }} numberOfLines={1}>
              {artistNames}
            </Text>
          </View>

          <View style={{ width: 48 }} />
        </View>

        {/* ── Corpo — space-between distribui os blocos sem vazar ──────────── */}
        <View style={{
          flex: 1,
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 20,
        }}>

          {/* Capa */}
          <View style={{ alignItems: 'center', marginTop: 12 }}>
            <Image
              source={{ uri: albumCover || 'https://via.placeholder.com/400/1a1a1a/444444?text=♪' }}
              style={{ width: COVER_SIZE, height: COVER_SIZE, borderRadius: 16 }}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
            {imageError && (
              <View style={{
                position: 'absolute', top: 0, left: 0,
                width: COVER_SIZE, height: COVER_SIZE,
                borderRadius: 16, backgroundColor: '#1a1a1a',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <MaterialCommunityIcons name="music-note" size={64} color="#333" />
              </View>
            )}
          </View>

          {/* Info + ações secundárias */}
          <View style={{ alignItems: 'center', width: '100%' }}>
            {/* Título — reduz a fonte automaticamente se o nome for muito longo */}
            <Text
              style={{
                color: '#fff',
                fontSize: 20,
                fontFamily: 'Poppins_700Bold',
                textAlign: 'center',
                marginBottom: 4,
                width: '100%',
              }}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {trackTitle}
            </Text>
            <Text
              style={{ color: '#9ca3af', fontSize: 15, fontFamily: 'Poppins_400Regular', textAlign: 'center' }}
              numberOfLines={1}
            >
              {artistNames}
            </Text>
            <Text
              style={{ color: '#6b7280', fontSize: 12, fontFamily: 'Poppins_400Regular', textAlign: 'center', marginTop: 2 }}
              numberOfLines={1}
            >
              {albumTitle}{releaseYear ? ` • ${releaseYear}` : ''}
            </Text>

            {/* Ações secundárias */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-around',
              width: '100%',
              marginTop: 12,
              paddingHorizontal: 8,
            }}>
              <TouchableOpacity style={{ padding: 8 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons name="shuffle-variant" size={24} color="#6b7280" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleLike}
                disabled={!isAuthenticated}
                style={{ padding: 8 }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Animated.View style={{ transform: [{ scale: likeScale }] }}>
                  <MaterialCommunityIcons
                    name={isLiked ? 'heart' : 'heart-outline'}
                    size={26}
                    color={isLiked ? '#f87171' : isAuthenticated ? '#6b7280' : '#333'}
                  />
                </Animated.View>
              </TouchableOpacity>

              <TouchableOpacity style={{ padding: 8 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons name="repeat" size={24} color="#6b7280" />
              </TouchableOpacity>

              <TouchableOpacity style={{ padding: 8 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons name="playlist-music" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Progresso + controles principais */}
          <View style={{ width: '100%' }}>
            {/* Barra de progresso */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={handleSeek}
              onLayout={(e) => setProgressBarWidth(e.nativeEvent.layout.width)}
              style={{ paddingVertical: 8 }}
            >
              <View style={{ width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, overflow: 'hidden' }}>
                <View style={{
                  height: '100%',
                  width: `${progressPercentage}%`,
                  backgroundColor: '#dc2626',
                  borderRadius: 2,
                }} />
              </View>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ color: '#6b7280', fontSize: 12, fontFamily: 'Poppins_400Regular' }}>
                {formatTime(position)}
              </Text>
              <Text style={{ color: '#6b7280', fontSize: 12, fontFamily: 'Poppins_400Regular' }}>
                {formatTime(duration)}
              </Text>
            </View>

            {/* Controles principais */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Animated.View style={{ transform: [{ scale: prevButtonScale }] }}>
                <TouchableOpacity
                  onPress={handlePlayPrevious}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={{ padding: 12 }}
                >
                  <MaterialCommunityIcons name="skip-previous" size={38} color="#f87171" />
                </TouchableOpacity>
              </Animated.View>

              <Animated.View style={{ transform: [{ scale: playButtonScale }] }}>
                <TouchableOpacity
                  onPress={handleTogglePlayPause}
                  style={{
                    backgroundColor: '#dc2626',
                    borderRadius: 999,
                    padding: 20,
                    marginHorizontal: 16,
                    shadowColor: '#f87171',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.45,
                    shadowRadius: 10,
                    elevation: 10,
                  }}
                >
                  <MaterialCommunityIcons
                    name={iconPlaying ? 'pause' : 'play'}
                    size={34}
                    color="#fff"
                  />
                </TouchableOpacity>
              </Animated.View>

              <Animated.View style={{ transform: [{ scale: nextButtonScale }] }}>
                <TouchableOpacity
                  onPress={handlePlayNext}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={{ padding: 12 }}
                >
                  <MaterialCommunityIcons name="skip-next" size={38} color="#f87171" />
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>

        </View>
      </LinearGradient>
    </Animated.View>
  );
}
