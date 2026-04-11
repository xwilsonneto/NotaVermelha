// src/components/home/FeaturedBands.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Image, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMusicData, Artist, Track } from '../../hooks/useMusicData';

interface FeaturedBandsProps {
  opacity: Animated.Value;
  translateY: Animated.Value;
}

export const FeaturedBands: React.FC<FeaturedBandsProps> = ({ opacity, translateY }) => {
  const { artists, getTracksByArtist, playTrack } = useMusicData();

  const handlePlayBand = (artist: Artist) => {
    const artistTracks = getTracksByArtist(artist._id);
    if (artistTracks.length > 0) {
      playTrack(artistTracks[0]);
    }
  };

  const getArtistStats = (artist: Artist) => {
    const tracks = getTracksByArtist(artist._id);
    const totalDuration = tracks.reduce((sum, track) => sum + track.duration, 0);
    const totalPlays = tracks.reduce((sum, track) => sum + track.playCount, 0);
    
    return {
      trackCount: tracks.length,
      totalDuration,
      totalPlays
    };
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} min`;
  };

  if (artists.length === 0) {
    return (
      <Animated.View style={{ opacity, transform: [{ translateY }] }} className="px-6 mb-6">
        <Text className="text-white text-xl mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>
          Artistas em Destaque
        </Text>
        <View className="bg-white/5 rounded-2xl p-8 items-center justify-center">
          <MaterialCommunityIcons name="account-music" size={40} color="#666" />
          <Text className="text-gray-400 mt-2 text-center">
            Nenhum artista disponível
          </Text>
        </View>
      </Animated.View>
    );
  }

  // Pega os 3 artistas com mais ouvintes mensais
  const featuredArtists = [...artists]
    .sort((a, b) => (b.monthlyListeners || 0) - (a.monthlyListeners || 0))
    .slice(0, 3);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }} className="px-6 mb-6">
      <Text className="text-white text-xl mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>
        Artistas em Destaque
      </Text>

      {featuredArtists.map((artist) => {
        const stats = getArtistStats(artist);
        
        return (
          <TouchableOpacity
            key={artist._id}
            className="bg-white/5 rounded-2xl p-4 mb-3 border border-white/10 active:opacity-80"
            onPress={() => handlePlayBand(artist)}
          >
            <View className="flex-row items-center">
              {artist.avatar ? (
                <Image 
                  source={{ uri: artist.avatar }}
                  className="w-14 h-14 rounded-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-14 h-14 rounded-full bg-red-900/30 items-center justify-center">
                  <MaterialCommunityIcons name="account-music" size={28} color="#f87171" />
                </View>
              )}
              
              <View className="ml-4 flex-1">
                <View className="flex-row items-center">
                  <Text className="text-white text-lg mr-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {artist.name}
                  </Text>
                  {artist.verified && (
                    <MaterialCommunityIcons name="check-decagram" size={16} color="#3b82f6" />
                  )}
                </View>
                
                <View className="flex-row items-center mt-1">
                  <MaterialCommunityIcons name="headphones" size={14} color="#9ca3af" />
                  <Text className="text-gray-300 text-sm ml-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {artist.monthlyListeners?.toLocaleString() || '0'} ouvintes/mês
                  </Text>
                </View>
                
                <View className="flex-row mt-2">
                  <View className="bg-red-900/20 px-2 py-1 rounded mr-2">
                    <Text className="text-red-300 text-xs">
                      {stats.trackCount} música{stats.trackCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View className="bg-gray-800/50 px-2 py-1 rounded">
                    <Text className="text-gray-300 text-xs">
                      {formatDuration(stats.totalDuration)}
                    </Text>
                  </View>
                </View>
              </View>
              
              <MaterialCommunityIcons name="play-circle" size={28} color="#f87171" />
            </View>
            
            {/* Gêneros */}
            {artist.genre && artist.genre.length > 0 && (
              <View className="flex-row flex-wrap mt-3">
                {artist.genre.slice(0, 3).map((genre, index) => (
                  <View key={index} className="bg-white/10 px-2 py-1 rounded-full mr-2 mb-1">
                    <Text className="text-gray-300 text-xs">{genre}</Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
};