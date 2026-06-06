// src/components/player/MiniPlayer.tsx
import React, { useCallback, useRef, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMusicPlayer } from '../../contexts/MusicPlayerContext';
import { RootStackParamList } from '../../navigation/AppNavigation';

type MiniPlayerNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const formatTime = (seconds: number, isLong: boolean): string => {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  if (isLong) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const MiniPlayer = memo(() => {
  const navigation = useNavigation<MiniPlayerNavigationProp>();

  // ✅ Assina APENAS o contexto de player — imune a re-renders de catalog/feed
  const { currentTrack, isPlaying, position, duration, togglePlayPause, playNext, playPrevious } =
    useMusicPlayer();

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isNavigating = useRef(false);
  const isProcessing = useRef(false);

  // Limpa flags ao desmontar
  React.useEffect(() => () => {
    isNavigating.current = false;
    isProcessing.current = false;
  }, []);

  const tapFeedback = useCallback(() => {
    scaleAnim.setValue(0.97);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handleOpenPlayer = useCallback(() => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    tapFeedback();
    navigation.navigate('Player');
    setTimeout(() => { isNavigating.current = false; }, 300);
  }, [navigation, tapFeedback]);

  // Ações de controle — guard de duplo-clique leve (150 ms)
  const withGuard = useCallback(
    (fn: () => Promise<void>) => async () => {
      if (isProcessing.current) return;
      isProcessing.current = true;
      tapFeedback();
      try {
        await fn();
      } catch (e) {
        console.error('MiniPlayer action error:', e);
      } finally {
        setTimeout(() => { isProcessing.current = false; }, 150);
      }
    },
    [tapFeedback],
  );

  const handlePlayPause = useCallback(withGuard(togglePlayPause), [withGuard, togglePlayPause]);
  const handleNext      = useCallback(withGuard(playNext),        [withGuard, playNext]);
  const handlePrevious  = useCallback(withGuard(playPrevious),    [withGuard, playPrevious]);

  if (!currentTrack) return null;

  const progressPct  = duration > 0 ? Math.min((position / duration) * 100, 100) : 0;
  const isLongTrack  = duration > 3600;
  const coverUri     = currentTrack.album?.cover || currentTrack.coverUrl || 'https://via.placeholder.com/150/1a1a1a/ffffff?text=Cover';
  const artistNames  = currentTrack.artists?.map((a: any) => a.name).join(', ') || 'Artista Desconhecido';

  return (
    <TouchableWithoutFeedback onPress={handleOpenPlayer}>
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          backgroundColor: 'rgba(10,10,10,0.98)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.08)',
        }}
      >
        {/* Barra de progresso */}
        <View style={{ width: '100%', height: 2, backgroundColor: 'rgba(255,255,255,0.1)' }}>
          <View
            style={{
              height: '100%',
              width: `${progressPct}%`,
              backgroundColor: '#dc2626',
            }}
          />
        </View>

        {/* Conteúdo principal */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          {/* Capa + título + artista */}
          <TouchableOpacity
            onPress={handleOpenPlayer}
            activeOpacity={0.7}
            style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}
          >
            <Image
              source={{ uri: coverUri }}
              style={{ width: 44, height: 44, borderRadius: 6, marginRight: 12 }}
              resizeMode="cover"
            />
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={1}
                style={{ color: '#fff', fontSize: 13, fontFamily: 'Poppins_600SemiBold' }}
              >
                {currentTrack.title || 'Título Desconhecido'}
              </Text>
              <Text
                numberOfLines={1}
                style={{ color: '#9ca3af', fontSize: 11, fontFamily: 'Poppins_400Regular' }}
              >
                {artistNames}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Controles */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={handlePrevious}
              style={{ padding: 8 }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="skip-previous" size={24} color="#f87171" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePlayPause}
              style={{
                backgroundColor: '#dc2626',
                borderRadius: 22,
                padding: 10,
                marginHorizontal: 4,
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={isPlaying ? 'pause' : 'play'}
                size={20}
                color="white"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNext}
              style={{ padding: 8 }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="skip-next" size={24} color="#f87171" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
});
