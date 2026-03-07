// src/components/home/ContinueListening.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Animated, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMusicData, Track } from '../../contexts/MusicDataContext';

interface ContinueListeningProps {
  opacity: Animated.Value;
  translateY: Animated.Value;
}

export const ContinueListening: React.FC<ContinueListeningProps> = ({ opacity, translateY }) => {
  // ✅ ÚNICO hook necessário
  const { 
    listeningHistory, 
    currentTrack, 
    isPlaying, 
    playTrack 
  } = useMusicData();

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ✅ LOG para debug
  useEffect(() => {
    console.log('🎧 ContinueListening - listeningHistory:', listeningHistory?.length || 0, 'itens');
    if (listeningHistory && listeningHistory.length > 0) {
      console.log('📋 Primeiro item:', listeningHistory[0]?.title);
    }
  }, [listeningHistory]);

  // ✅ Se não há histórico, mostra mensagem
  if (!listeningHistory || listeningHistory.length === 0) {
    return (
      <Animated.View 
        className="px-6 mb-6"
        style={{ opacity, transform: [{ translateY }] }}
      >
        <Text 
          className="text-white text-xl mb-4"
          style={{ fontFamily: 'Poppins_700Bold' }}
        >
          Continue Ouvindo
        </Text>
        <View className="bg-white/5 rounded-2xl p-8 items-center justify-center border border-white/10">
          <MaterialCommunityIcons name="history" size={48} color="#666" />
          <Text 
            className="text-gray-400 mt-3 text-center"
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            Toque em uma música para começar
          </Text>
          <Text 
            className="text-gray-500 text-xs mt-2 text-center"
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            Seu histórico aparecerá aqui
          </Text>
        </View>
      </Animated.View>
    );
  }

  const handlePlayMusic = (track: Track): void => {
    console.log('▶️ Tocando do histórico:', track.title);
    playTrack(track);
  };

  const getPlayIcon = (track: Track): "play" | "pause" => {
    if (currentTrack?._id === track._id && isPlaying) {
      return "pause";
    }
    return "play";
  };

  const formatDuration = (seconds: number): string => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Animated.View 
      className="px-6 mb-6"
      style={{ 
        opacity, 
        transform: [{ translateY }] 
      }}
    >
      <View className="flex-row items-center justify-between mb-4">
        <Text
          className="text-white text-xl"
          style={{ fontFamily: 'Poppins_700Bold' }}
        >
          Continue Ouvindo
        </Text>
        <View className="flex-row items-center">
          <MaterialCommunityIcons name="history" size={16} color="#9CA3AF" />
          <Text
            className="text-gray-400 text-sm ml-1"
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            {listeningHistory.length} {listeningHistory.length === 1 ? 'álbum' : 'álbuns'}
          </Text>
        </View>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="flex-row"
        contentContainerStyle={{ paddingRight: 20 }}
      >
        {listeningHistory.map((track: Track, index: number) => (
          <TouchableOpacity
            key={track._id}
            className="bg-white/5 rounded-2xl p-3 mr-4 border border-white/10 active:opacity-80"
            style={{ 
              width: 140, // ✅ REDUZIDO de 150 para 140
            }}
            onPress={() => handlePlayMusic(track)}
            activeOpacity={0.7}
          >
            {/* Container da imagem */}
            <View className="relative">
              <Image 
                source={{ 
                  uri: track.album?.cover || 
                       track.coverUrl || 
                       'https://via.placeholder.com/150/1a1a1a/ffffff?text=Cover'
                }}
                style={{ 
                  width: 114, // ✅ REDUZIDO de 124 para 114
                  height: 114, // ✅ REDUZIDO de 124 para 114
                  borderRadius: 8
                }}
                resizeMode="cover"
              />
              
              {/* Badge de play/pause - REPOSICIONADO */}
              <View className="absolute bottom-2 right-2 bg-black/80 rounded-full p-1.5 border border-white/20">
                <MaterialCommunityIcons
                  name={getPlayIcon(track)}
                  size={14} // ✅ REDUZIDO de 16 para 14
                  color={currentTrack?._id === track._id ? "#f87171" : "white"}
                />
              </View>

              {/* Indicador de "Tocando agora" */}
              {currentTrack?._id === track._id && isPlaying && (
                <View className="absolute top-2 left-2 bg-red-600 rounded-full px-1.5 py-0.5">
                  <Text className="text-white text-[8px] font-bold">AGORA</Text>
                </View>
              )}
            </View>

            {/* Informações da música - COM MAIS ESPAÇO */}
            <View className="mt-2">
              <Text
                className="text-white text-xs font-semibold"
                style={{ fontFamily: 'Poppins_600SemiBold' }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {track.title || 'Título desconhecido'}
              </Text>
              
              <Text
                className="text-gray-400 text-[10px] mt-0.5"
                style={{ fontFamily: 'Poppins_400Regular' }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {track.artists?.map((a: any) => a.name).join(', ') || 'Artista desconhecido'}
              </Text>
              
              {/* Nome do álbum (opcional, mas ajuda) */}
              <Text
                className="text-gray-500 text-[8px] mt-0.5"
                style={{ fontFamily: 'Poppins_400Regular' }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {track.album?.title || 'Álbum desconhecido'}
              </Text>
              
              {/* Duração e plays - MAIS COMPACTOS */}
              <View className="flex-row items-center justify-between mt-1.5">
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="clock-outline" size={8} color="#6B7280" />
                  <Text className="text-gray-500 text-[8px] ml-1">
                    {formatDuration(track.duration)}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="play" size={8} color="#6B7280" />
                  <Text className="text-gray-500 text-[8px] ml-1">
                    {(track.playCount || 0) > 999 
                      ? `${(track.playCount / 1000).toFixed(1)}k` 
                      : track.playCount || 0}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );
};