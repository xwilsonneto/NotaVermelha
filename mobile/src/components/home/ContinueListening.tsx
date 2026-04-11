// src/components/home/ContinueListening.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMusicData, Track } from '../../contexts/MusicDataContext';

interface ContinueListeningProps {
  opacity: Animated.Value;
  translateY: Animated.Value;
}

export const ContinueListening: React.FC<ContinueListeningProps> = ({ opacity, translateY }) => {
  const {
    listeningHistory,
    currentTrack,
    isPlaying,
    playTrack,
  } = useMusicData();

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    console.log('🎧 ContinueListening - listeningHistory:', listeningHistory?.length || 0, 'itens');
  }, [listeningHistory]);

  // Deduplica por álbum: mantém apenas a última faixa ouvida de cada álbum
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
    return result.slice(0, 6); // Máximo 6 itens no grid
  }, [listeningHistory]);

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

  return (
    <Animated.View
      className="mb-6"
      style={{ opacity, transform: [{ translateY }] }}
    >
      {/* Header */}
      <View className="px-6 mb-4 flex-row items-center justify-between">
        <Text
          className="text-white text-xl"
          style={{ fontFamily: 'Poppins_700Bold' }}
        >
          Continue Ouvindo
        </Text>
        <View className="flex-row items-center">
          <MaterialCommunityIcons name="history" size={15} color="#9CA3AF" />
          <Text
            className="text-gray-400 text-sm ml-1"
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            {dedupedByAlbum.length} {dedupedByAlbum.length === 1 ? 'álbum' : 'álbuns'}
          </Text>
        </View>
      </View>

      {/* Grid 2 colunas estilo Spotify */}
      <View className="px-6">
        <View className="flex-row flex-wrap" style={{ gap: 8 }}>
          {dedupedByAlbum.map((track) => {
            const isCurrentPlaying = currentTrack?._id === track._id && isPlaying;
            const coverUri =
              track.album?.cover ||
              track.coverUrl ||
              'https://via.placeholder.com/150/1a1a1a/ffffff?text=Cover';

            return (
              <TouchableOpacity
                key={track._id}
                onPress={() => playTrack(track)}
                activeOpacity={0.75}
                style={{
                  width: '48.5%',
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isCurrentPlaying
                    ? 'rgba(220,38,38,0.18)'
                    : 'rgba(255,255,255,0.07)',
                  borderRadius: 6,
                  overflow: 'hidden',
                  borderWidth: isCurrentPlaying ? 1 : 0,
                  borderColor: '#f87171',
                }}
              >
                {/* Capa do álbum */}
                <Image
                  source={{ uri: coverUri }}
                  style={{ width: 52, height: 52 }}
                  resizeMode="cover"
                />

                {/* Info */}
                <View style={{ flex: 1, paddingHorizontal: 8 }}>
                  <Text
                    numberOfLines={2}
                    style={{
                      color: isCurrentPlaying ? '#f87171' : '#fff',
                      fontFamily: 'Poppins_600SemiBold',
                      fontSize: 11,
                      lineHeight: 14,
                    }}
                  >
                    {track.title || 'Sem título'}
                  </Text>

                  {isCurrentPlaying ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                      <MaterialCommunityIcons name="equalizer" size={10} color="#f87171" />
                      <Text
                        style={{
                          color: '#f87171',
                          fontSize: 9,
                          marginLeft: 3,
                          fontFamily: 'Poppins_400Regular',
                        }}
                      >
                        Tocando
                      </Text>
                    </View>
                  ) : (
                    <Text
                      numberOfLines={1}
                      style={{
                        color: '#9ca3af',
                        fontSize: 10,
                        fontFamily: 'Poppins_400Regular',
                        marginTop: 2,
                      }}
                    >
                      {track.artists?.map((a: any) => a.name).join(', ') || 'Artista desconhecido'}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
};
