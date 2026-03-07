// src/components/player/MiniPlayer.tsx
import React, { useCallback, useEffect, useRef } from 'react';
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
    playPrevious 
  } = useMusicData();

  const panY = useRef(new Animated.Value(0)).current;
  const lastTap = useRef(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // PanResponder para swipe down (minimizar)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
          // Opacidade diminui conforme arrasta para baixo
          opacityAnim.setValue(Math.max(0.5, 1 - gestureState.dy / 300));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          // Fecha com animação
          Animated.parallel([
            Animated.timing(panY, {
              toValue: 300,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
            // Reset valores
            panY.setValue(0);
            opacityAnim.setValue(1);
          });
        } else {
          // Voltar à posição original
          Animated.parallel([
            Animated.spring(panY, {
              toValue: 0,
              useNativeDriver: true,
            }),
            Animated.spring(opacityAnim, {
              toValue: 1,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  const handleOpenPlayer = useCallback(() => {
    console.log('🎯 Abrindo tela do player...');
    
    // Animação de clique
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Navega com transição personalizada
    navigation.navigate('Player');
  }, [navigation]);

  const handlePlayPause = useCallback(async () => {
    try {
      const now = Date.now();
      if (now - lastTap.current < 300) return;
      lastTap.current = now;
      
      // Feedback visual
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
      
      await togglePlayPause();
    } catch (error) {
      console.error('❌ Erro no togglePlayPause:', error);
    }
  }, [togglePlayPause]);

  const handleNext = useCallback(async () => {
    try {
      // Feedback visual
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
      
      await playNext();
    } catch (error) {
      console.error('❌ Erro no playNext:', error);
    }
  }, [playNext]);

  const handlePrevious = useCallback(async () => {
    try {
      // Feedback visual
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
      
      await playPrevious();
    } catch (error) {
      console.error('❌ Erro no playPrevious:', error);
    }
  }, [playPrevious]);

  if (!currentTrack) return null;

  const progressPercentage = duration > 0
    ? Math.min((position / duration) * 100, 100)
    : 0;

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const imageSource = { 
    uri: currentTrack.album?.cover || 
         currentTrack.coverUrl || 
         'https://via.placeholder.com/150/1a1a1a/ffffff?text=Cover' 
  };

  return (
    <Animated.View
      style={{
        transform: [
          { translateY: panY },
          { scale: scaleAnim }
        ],
        opacity: opacityAnim,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        elevation: 50,
      }}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        onPress={handleOpenPlayer}
        activeOpacity={0.9}
        className="bg-black/95 border-t border-white/10"
      >
        {/* Barra de Progresso com animação */}
        <View className="w-full h-1 bg-white/20">
          <Animated.View
            className="h-full bg-red-600"
            style={{ 
              width: `${progressPercentage}%`,
              transform: [{ scaleY: scaleAnim }]
            }}
          />
        </View>

        {/* Conteúdo */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <View className="flex-row items-center flex-1 mr-4">
            <Animated.Image
              source={imageSource}
              className="w-12 h-12 rounded-md mr-3"
              resizeMode="cover"
              defaultSource={{ uri: 'https://via.placeholder.com/150/1a1a1a/ffffff?text=Cover' }}
              style={{
                transform: [{ scale: scaleAnim }]
              }}
            />

            <View className="flex-1">
              <Animated.Text 
                className="text-white text-sm font-semibold" 
                numberOfLines={1}
                style={{
                  transform: [{ scale: scaleAnim }]
                }}
              >
                {currentTrack.title || 'Título Desconhecido'}
              </Animated.Text>
              <Animated.Text 
                className="text-gray-400 text-xs" 
                numberOfLines={1}
                style={{
                  transform: [{ scale: scaleAnim }]
                }}
              >
                {currentTrack.artists?.map(a => a.name).join(', ') || 'Artista Desconhecido'}
              </Animated.Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={handlePrevious} 
              className="p-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons 
                name="skip-previous" 
                size={24} 
                color="#f87171"
              />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handlePlayPause} 
              className="bg-red-600 rounded-full p-2 mx-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name={isPlaying ? 'pause' : 'play'}
                size={18}
                color="white"
              />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleNext} 
              className="p-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons 
                name="skip-next" 
                size={24} 
                color="#f87171"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-4 pb-2">
          <Animated.Text 
            className="text-gray-400 text-xs text-right"
            style={{
              transform: [{ scale: scaleAnim }]
            }}
          >
            {formatTime(position)} / {formatTime(duration)}
          </Animated.Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};