// src/screens/PlayerScreen.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  StatusBar, 
  Dimensions,
  ActivityIndicator,
  Animated,
  Easing
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMusicData } from '../contexts/MusicDataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/AppNavigation';
import { useAuthStore } from '../store/authStore';
import { trackService } from '../services/api';

type PlayerScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Player'>;

const { width: screenWidth } = Dimensions.get('window');

export default function PlayerScreen() {
  const navigation = useNavigation<PlayerScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  
  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    togglePlayPause,
    playNext,
    playPrevious,
    seekTo,
  } = useMusicData();

  const { token, isAuthenticated } = useAuthStore();

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // ✅ Estado de like otimista
  const [isLiked, setIsLiked] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(0);

  // ✅ Largura real da barra de progresso (para seek confiável no Android)
  const [progressBarWidth, setProgressBarWidth] = useState(screenWidth - 64);

  // Animações — cada botão tem seu próprio Animated.Value para não interferirem
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const playButtonScale = useRef(new Animated.Value(1)).current;
  const prevButtonScale = useRef(new Animated.Value(1)).current;
  const nextButtonScale = useRef(new Animated.Value(1)).current;
  const likeScale = useRef(new Animated.Value(1)).current;

  // ✅ FIX: sem isMounted — não interfere com goBack
  const isClosing = useRef(false);

  // Animação de entrada
  useEffect(() => {
    isClosing.current = false;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, []);

  // Sincroniza likes quando a track muda
  useEffect(() => {
    if (currentTrack) {
      setLocalLikeCount(currentTrack.likeCount || 0);
      setIsLiked(false);
    }
  }, [currentTrack?._id]);

  // ✅ FIX: handleBack navega sempre ao fim da animação, sem checar isMounted
  const handleBack = useCallback(() => {
    if (isClosing.current) return;
    isClosing.current = true;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
    ]).start(() => {
      navigation.goBack();
    });
  }, [fadeAnim, slideAnim, scaleAnim, navigation]);

  const formatTime = useCallback((seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // ✅ FIX: helper de animação — dispara a ação imediatamente, anima em paralelo
  const animateButton = useCallback((anim: Animated.Value, callback: () => void) => {
    callback(); // executa a ação imediatamente, sem esperar animação
    Animated.sequence([
      Animated.timing(anim, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleTogglePlayPause = useCallback(() => {
    animateButton(playButtonScale, () => {
      togglePlayPause().catch((e: any) => console.error('Erro play/pause:', e));
    });
  }, [togglePlayPause, animateButton, playButtonScale]);

  const handlePlayNext = useCallback(() => {
    animateButton(nextButtonScale, () => {
      playNext().catch((e: any) => console.error('Erro skip next:', e));
    });
  }, [playNext, animateButton, nextButtonScale]);

  const handlePlayPrevious = useCallback(() => {
    animateButton(prevButtonScale, () => {
      playPrevious().catch((e: any) => console.error('Erro skip prev:', e));
    });
  }, [playPrevious, animateButton, prevButtonScale]);

  // ✅ FIX: seek usa largura capturada pelo onLayout — confiável no Android
  const handleSeek = useCallback((event: any) => {
    if (!duration || duration <= 0) return;
    const touchX = event.nativeEvent.locationX;
    const percentage = Math.max(0, Math.min(1, touchX / progressBarWidth));
    seekTo(percentage * duration);
  }, [duration, progressBarWidth, seekTo]);

  // ✅ Like otimista com reversão em caso de erro
  const handleLike = useCallback(async () => {
    if (!currentTrack || !isAuthenticated || !token) return;

    const wasLiked = isLiked;
    const prevCount = localLikeCount;

    setIsLiked(!wasLiked);
    setLocalLikeCount(wasLiked ? prevCount - 1 : prevCount + 1);

    Animated.sequence([
      Animated.timing(likeScale, { toValue: 1.4, duration: 120, useNativeDriver: true }),
      Animated.timing(likeScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    const result = wasLiked
      ? await trackService.unlike(currentTrack._id, token)
      : await trackService.like(currentTrack._id, token);

    if (!result.success) {
      setIsLiked(wasLiked);
      setLocalLikeCount(prevCount);
    } else if (result.data?.likeCount !== undefined) {
      setLocalLikeCount(result.data.likeCount);
    }
  }, [currentTrack, isAuthenticated, token, isLiked, localLikeCount, likeScale]);

  if (!currentTrack) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#f87171" />
        <Text className="text-white mt-4">Nenhuma música selecionada</Text>
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
    <Animated.View 
      className="flex-1"
      style={{ 
        opacity: fadeAnim,
        transform: [
          { translateY: slideAnim },
          { scale: scaleAnim }
        ]
      }}
    >
      <LinearGradient
        colors={['#0a0a0a', '#1a1a1a', '#2a2a2a']}
        className="flex-1"
      >
        <StatusBar translucent backgroundColor="transparent" />
        
        {/* Header */}
        <Animated.View 
          className="flex-row items-center px-6" 
          style={{ 
            paddingTop: insets.top + 20,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}
        >
          {/* ✅ FIX: área de toque generosa no botão de fechar */}
          <TouchableOpacity 
            onPress={handleBack}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            style={{ padding: 8 }}
          >
            <MaterialCommunityIcons
              name="chevron-down"
              size={32}
              color="#f87171"
            />
          </TouchableOpacity>
          
          <View className="flex-1 items-center">
            <Text 
              className="text-white text-lg"
              style={{ fontFamily: 'Poppins_600SemiBold' }}
              numberOfLines={1}
            >
              Tocando agora
            </Text>
            <Text 
              className="text-gray-400 text-sm"
              style={{ fontFamily: 'Poppins_400Regular' }}
              numberOfLines={1}
            >
              {artistNames}
            </Text>
          </View>
          
          <View style={{ width: 48 }} />
        </Animated.View>

        {/* Área Principal */}
        <View className="flex-1 justify-center items-center pt-6 px-8">
          {/* Capa do Álbum */}
          <Animated.View 
            className="mb-8 relative"
            style={{
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }}
          >
            {!imageLoaded && !imageError && (
              <View 
                style={{ 
                  width: screenWidth * 0.8, 
                  height: screenWidth * 0.8,
                  borderRadius: 16,
                  backgroundColor: '#333',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <ActivityIndicator size="large" color="#f87171" />
              </View>
            )}
            
            <Image 
              source={{ 
                uri: albumCover || 'https://via.placeholder.com/150/1a1a1a/ffffff?text=Cover'
              }}
              style={{ 
                width: screenWidth * 0.8, 
                height: screenWidth * 0.8,
                borderRadius: 16,
                opacity: imageError ? 0.3 : 1
              }}
              resizeMode="cover"
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(true);
              }}
            />
            
            {imageError && (
              <View 
                style={{ 
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <MaterialCommunityIcons name="music-off" size={48} color="#666" />
              </View>
            )}
            
            <View 
              className="absolute -inset-4 rounded-full border-2 border-white/10"
              style={{ zIndex: -1 }}
            />
          </Animated.View>

          {/* Informações da Música */}
          <Animated.View 
            className="items-center mb-6 w-full"
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }}
          >
            <Text 
              className="text-white text-2xl text-center mb-2"
              style={{ fontFamily: 'Poppins_700Bold' }}
              numberOfLines={2}
            >
              {trackTitle}
            </Text>
            <Text 
              className="text-gray-400 text-lg text-center"
              style={{ fontFamily: 'Poppins_400Regular' }}
              numberOfLines={1}
            >
              {artistNames}
            </Text>
            <Text 
              className="text-gray-500 text-sm text-center mt-1"
              style={{ fontFamily: 'Poppins_400Regular' }}
              numberOfLines={1}
            >
              {albumTitle}{releaseYear ? ` • ${releaseYear}` : ''}
            </Text>
            
            {/* Contadores */}
            <View className="flex-row items-center mt-3">
              <View className="flex-row items-center mr-4">
                <MaterialCommunityIcons name="play" size={14} color="#9CA3AF" />
                <Text 
                  className="text-gray-400 text-xs ml-1"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  {(currentTrack.playCount || 0).toLocaleString()} plays
                </Text>
              </View>
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="heart" size={14} color="#9CA3AF" />
                <Text 
                  className="text-gray-400 text-xs ml-1"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  {localLikeCount.toLocaleString()} likes
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* ✅ FIX: Barra de Progresso com onLayout para largura real no Android */}
          <Animated.View 
            className="w-full mb-6"
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={handleSeek}
              onLayout={(e) => setProgressBarWidth(e.nativeEvent.layout.width)}
            >
              <View className="w-full h-2 bg-white/20 rounded-full mb-2 overflow-hidden">
                <View 
                  className="h-full bg-red-600 rounded-full" 
                  style={{ width: `${progressPercentage}%` }} 
                />
              </View>
            </TouchableOpacity>
            
            <View className="flex-row justify-between">
              <Text 
                className="text-gray-400 text-sm"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                {formatTime(position)}
              </Text>
              <Text 
                className="text-gray-400 text-sm"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                {formatTime(duration)}
              </Text>
            </View>
          </Animated.View>

          {/* ✅ FIX: Controles com Animated.Value independentes por botão */}
          <Animated.View 
            className="flex-row items-center justify-center mt-2"
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }}
          >
            <Animated.View style={{ transform: [{ scale: prevButtonScale }] }}>
              <TouchableOpacity 
                onPress={handlePlayPrevious}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={{ padding: 12 }}
              >
                <MaterialCommunityIcons name="skip-previous" size={36} color="#f87171" />
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={{ transform: [{ scale: playButtonScale }] }}>
              <TouchableOpacity 
                onPress={handleTogglePlayPause}
                className="bg-red-600 rounded-full mx-4"
                style={{
                  padding: 20,
                  shadowColor: '#f87171',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.5,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <MaterialCommunityIcons
                  name={isPlaying ? "pause" : "play"}
                  size={32}
                  color="white"
                />
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={{ transform: [{ scale: nextButtonScale }] }}>
              <TouchableOpacity 
                onPress={handlePlayNext}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={{ padding: 12 }}
              >
                <MaterialCommunityIcons name="skip-next" size={36} color="#f87171" />
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* Ações secundárias */}
          <Animated.View 
            className="flex-row items-center justify-around w-full mt-8 px-4"
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }}
          >
            <TouchableOpacity style={{ padding: 8 }}>
              <MaterialCommunityIcons name="shuffle-variant" size={24} color="#6b7280" />
            </TouchableOpacity>
            
            {/* ✅ Botão de like funcional com animação */}
            <TouchableOpacity 
              onPress={handleLike} 
              disabled={!isAuthenticated}
              style={{ padding: 8 }}
            >
              <Animated.View style={{ transform: [{ scale: likeScale }] }}>
                <MaterialCommunityIcons 
                  name={isLiked ? "heart" : "heart-outline"} 
                  size={24} 
                  color={isLiked ? "#f87171" : isAuthenticated ? "#6b7280" : "#3b3b3b"} 
                />
              </Animated.View>
            </TouchableOpacity>
            
            <TouchableOpacity style={{ padding: 8 }}>
              <MaterialCommunityIcons name="repeat" size={24} color="#6b7280" />
            </TouchableOpacity>
            
            <TouchableOpacity style={{ padding: 8 }}>
              <MaterialCommunityIcons name="playlist-music" size={24} color="#6b7280" />
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={{ height: insets.bottom + 20 }} />
      </LinearGradient>
    </Animated.View>
  );
}
