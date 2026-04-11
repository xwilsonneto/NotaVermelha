// src/components/player/MiniPlayer.tsx
import React, { useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Animated, PanResponder } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMusicData } from '../../contexts/MusicDataContext';
import { RootStackParamList } from '../../navigation/AppNavigation';

type MiniPlayerNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const MiniPlayer: React.FC = () => {
  const navigation = useNavigation<MiniPlayerNavigationProp>();

  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    togglePlayPause,
    playNext,
    playPrevious,
  } = useMusicData();

  const panY = useRef(new Animated.Value(0)).current;
  const lastTap = useRef(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
          opacityAnim.setValue(Math.max(0.5, 1 - gestureState.dy / 300));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          Animated.parallel([
            Animated.timing(panY, { toValue: 300, duration: 250, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
          ]).start(() => {
            if (navigation.canGoBack()) navigation.goBack();
            panY.setValue(0);
            opacityAnim.setValue(1);
          });
        } else {
          Animated.parallel([
            Animated.spring(panY, { toValue: 0, useNativeDriver: true }),
            Animated.spring(opacityAnim, { toValue: 1, useNativeDriver: true }),
          ]).start();
        }
      },
    })
  ).current;

  const tapFeedback = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.98, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
  }, [scaleAnim]);

  const handleOpenPlayer = useCallback(() => {
    tapFeedback();
    navigation.navigate('Player');
  }, [navigation, tapFeedback]);

  const handlePlayPause = useCallback(async () => {
    const now = Date.now();
    if (now - lastTap.current < 300) return;
    lastTap.current = now;
    tapFeedback();
    try { await togglePlayPause(); } catch (e) { console.error('❌', e); }
  }, [togglePlayPause, tapFeedback]);

  const handleNext = useCallback(async () => {
    tapFeedback();
    try { await playNext(); } catch (e) { console.error('❌', e); }
  }, [playNext, tapFeedback]);

  const handlePrevious = useCallback(async () => {
    tapFeedback();
    try { await playPrevious(); } catch (e) { console.error('❌', e); }
  }, [playPrevious, tapFeedback]);

  // Se não há track, retorna null mas reserva zero espaço (sem alterar layout do BottomNav)
  if (!currentTrack) return null;

  const progressPercentage = duration > 0 ? Math.min((position / duration) * 100, 100) : 0;

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const imageSource = {
    uri:
      currentTrack.album?.cover ||
      currentTrack.coverUrl ||
      'https://via.placeholder.com/150/1a1a1a/ffffff?text=Cover',
  };

  return (
    // ✅ SEM position:absolute — fica no fluxo normal, empilhado acima do BottomNavigation
    <Animated.View
      style={{
        transform: [{ translateY: panY }, { scale: scaleAnim }],
        opacity: opacityAnim,
      }}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        onPress={handleOpenPlayer}
        activeOpacity={0.9}
        style={{
          backgroundColor: 'rgba(10,10,10,0.97)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.1)',
        }}
      >
        {/* Barra de progresso */}
        <View style={{ width: '100%', height: 2, backgroundColor: 'rgba(255,255,255,0.15)' }}>
          <View
            style={{
              height: '100%',
              width: `${progressPercentage}%`,
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
            paddingHorizontal: 16,
            paddingVertical: 10,
          }}
        >
          {/* Capa + título + artista */}
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
            <Animated.Image
              source={imageSource}
              style={{
                width: 44,
                height: 44,
                borderRadius: 6,
                marginRight: 12,
                transform: [{ scale: scaleAnim }],
              }}
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
                {currentTrack.artists?.map((a: any) => a.name).join(', ') || 'Artista Desconhecido'}
              </Text>
            </View>
          </View>

          {/* Controles */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={handlePrevious}
              style={{ padding: 8 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons name="skip-previous" size={26} color="#f87171" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePlayPause}
              style={{
                backgroundColor: '#dc2626',
                borderRadius: 20,
                padding: 8,
                marginHorizontal: 6,
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons name="skip-next" size={26} color="#f87171" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};
