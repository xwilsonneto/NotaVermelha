// src/screens/LibraryScreen.tsx
import React, { useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StatusBar, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  RefreshControl,
  Alert 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMusicData } from '../hooks/useMusicData';
import { MiniPlayer } from '../components/player/MiniPlayer';

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  
  // ✅ Hook centralizado
  const { 
    tracks, 
    artists, 
    albums, 
    playTrack, 
    getPopularTracks,
    loading,
    error,
    refresh 
  } = useMusicData();

  const [refreshing, setRefreshing] = React.useState(false);
  const popularTracks = useMemo(() => getPopularTracks(10), [getPopularTracks, tracks]);

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } catch (err) {
      console.error('Erro ao atualizar:', err);
      Alert.alert('Erro', 'Não foi possível atualizar a biblioteca.');
    } finally {
      setRefreshing(false);
    }
  };

  const handlePlayTrack = (track: any) => {
    try {
      playTrack(track);
    } catch (error) {
      console.error('Erro ao reproduzir música:', error);
      Alert.alert('Erro', 'Não foi possível reproduzir esta música.');
    }
  };

  // ✅ Loading state
  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-black">
        <LinearGradient
          colors={['#dc2626', '#7f1d1d', '#0a0a0a']}
          locations={[0, 0.12, 1]}
          className="flex-1 items-center justify-center"
        >
          <StatusBar translucent backgroundColor="transparent" />
          <ActivityIndicator size="large" color="#f87171" />
          <Text 
            className="text-white mt-4 px-6 text-center"
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            Carregando sua biblioteca musical...
          </Text>
        </LinearGradient>
      </View>
    );
  }

  // ✅ Error state
  if (error && !refreshing) {
    return (
      <View className="flex-1 bg-black">
        <LinearGradient
          colors={['#dc2626', '#7f1d1d', '#0a0a0a']}
          locations={[0, 0.12, 1]}
          className="flex-1 items-center justify-center px-6"
        >
          <StatusBar translucent backgroundColor="transparent" />
          <MaterialCommunityIcons name="alert-circle" size={64} color="#f87171" />
          <Text 
            className="text-white text-xl text-center mt-4"
            style={{ fontFamily: 'Poppins_700Bold' }}
          >
            Erro ao carregar biblioteca
          </Text>
          <Text 
            className="text-gray-400 text-center mt-2 mb-6"
            style={{ fontFamily: 'Poppins_400Regular' }}
            numberOfLines={3}
          >
            {error.length > 100 ? `${error.substring(0, 100)}...` : error}
          </Text>
          
          <TouchableOpacity
            onPress={handleRefresh}
            className="bg-red-600 px-6 py-3 rounded-full"
          >
            <Text 
              className="text-white text-sm"
              style={{ fontFamily: 'Poppins_600SemiBold' }}
            >
              Tentar novamente
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <LinearGradient
        colors={['#dc2626', '#7f1d1d', '#0a0a0a']}
        locations={[0, 0.12, 1]}
        className="flex-1"
      >
        <StatusBar translucent backgroundColor="transparent" />
        
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#f87171']}
              tintColor="#f87171"
              progressBackgroundColor="#0a0a0a"
            />
          }
          contentContainerStyle={{ 
            flexGrow: 1,
            paddingBottom: insets.bottom + 100
          }}
        >
          <View className="px-6 pt-6" style={{ paddingTop: insets.top + 20 }}>
            <Text 
              className="text-3xl text-white mb-6"
              style={{ fontFamily: 'Poppins_700Bold' }}
            >
              Sua Biblioteca
            </Text>
            
            {/* Estatísticas */}
            <View className="flex-row justify-between mb-8 bg-white/5 rounded-2xl p-4">
              <View className="items-center flex-1">
                <Text className="text-white text-2xl" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {tracks.length}
                </Text>
                <Text className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Músicas
                </Text>
              </View>
              <View className="h-full w-px bg-white/10" />
              <View className="items-center flex-1">
                <Text className="text-white text-2xl" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {artists.length}
                </Text>
                <Text className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Artistas
                </Text>
              </View>
              <View className="h-full w-px bg-white/10" />
              <View className="items-center flex-1">
                <Text className="text-white text-2xl" style={{ fontFamily: 'Poppins_700Bold' }}>
                  {albums.length}
                </Text>
                <Text className="text-gray-400 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Álbuns
                </Text>
              </View>
            </View>

            {/* Músicas Populares */}
            <Text 
              className="text-white text-xl mb-4"
              style={{ fontFamily: 'Poppins_600SemiBold' }}
            >
              Músicas Populares
            </Text>
            
            {popularTracks.length > 0 ? (
              popularTracks.map((track, index) => (
                <TouchableOpacity
                  key={track._id}
                  className="flex-row items-center bg-white/5 rounded-xl p-3 mb-2 active:bg-white/10"
                  onPress={() => handlePlayTrack(track)}
                  activeOpacity={0.7}
                >
                  <Text 
                    className="text-gray-400 text-sm mr-4" 
                    style={{ 
                      width: 20, 
                      fontFamily: 'Poppins_600SemiBold' 
                    }}
                  >
                    {index + 1}
                  </Text>
                  
                  <Image 
                    source={{ uri: track.album?.cover || track.coverUrl || '' }}
                    className="w-12 h-12 rounded-lg mr-3"
                    resizeMode="cover"
                    // ✅ CORREÇÃO: placeholder online
                    defaultSource={{ uri: 'https://via.placeholder.com/150/1a1a1a/ffffff?text=Cover' }}
                    onError={() => console.log('Erro ao carregar imagem:', track.title)}
                  />
                  
                  <View className="flex-1">
                    <Text 
                      className="text-white"
                      style={{ fontFamily: 'Poppins_600SemiBold' }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {track.title || 'Título desconhecido'}
                    </Text>
                    <Text 
                      className="text-gray-400 text-sm mt-0.5"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {track.artists?.map(artist => artist.name).join(', ') || 'Artista desconhecido'}
                    </Text>
                  </View>
                  
                  <View className="items-end">
                    <Text 
                      className="text-gray-400 text-sm"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                    >
                      {formatDuration(track.duration || 0)}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <MaterialCommunityIcons name="play" size={12} color="#9CA3AF" />
                      <Text 
                        className="text-gray-400 text-xs ml-1"
                        style={{ fontFamily: 'Poppins_400Regular' }}
                      >
                        {track.playCount?.toLocaleString() || '0'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View className="bg-white/5 rounded-2xl p-8 items-center justify-center">
                <MaterialCommunityIcons name="music-off" size={48} color="#666" />
                <Text 
                  className="text-gray-400 mt-4 text-center"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  Nenhuma música disponível
                </Text>
                <Text 
                  className="text-gray-500 text-sm mt-1 text-center"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  Adicione músicas para começar
                </Text>
              </View>
            )}

            {/* Artistas */}
            {artists.length > 0 && (
              <>
                <Text 
                  className="text-white text-xl mb-4 mt-8"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                >
                  Seus Artistas
                </Text>
                
                <View className="flex-row flex-wrap justify-between">
                  {artists.slice(0, 6).map(artist => (
                    <TouchableOpacity
                      key={artist._id}
                      className="items-center w-1/3 mb-6 px-2"
                      activeOpacity={0.7}
                    >
                      <View className="relative">
                        <Image 
                          source={{ uri: artist.avatar || '' }}
                          className="w-20 h-20 rounded-full"
                          resizeMode="cover"
                          // ✅ CORREÇÃO: placeholder online
                          defaultSource={{ uri: 'https://via.placeholder.com/150/1a1a1a/ffffff?text=Avatar' }}
                        />
                        {artist.verified && (
                          <View className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1">
                            <MaterialCommunityIcons 
                              name="check" 
                              size={12} 
                              color="white" 
                            />
                          </View>
                        )}
                      </View>
                      <Text 
                        className="text-white text-sm mt-2 text-center"
                        style={{ fontFamily: 'Poppins_600SemiBold' }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {artist.name || 'Artista desconhecido'}
                      </Text>
                      {artist.monthlyListeners && artist.monthlyListeners > 0 && (
                        <Text 
                          className="text-gray-500 text-xs mt-1"
                          style={{ fontFamily: 'Poppins_400Regular' }}
                        >
                          {(artist.monthlyListeners / 1000).toFixed(1)}K ouvintes
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Álbuns */}
            {albums.length > 0 && (
              <>
                <Text 
                  className="text-white text-xl mb-4 mt-8"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                >
                  Álbuns
                </Text>
                
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 20 }}
                  decelerationRate="fast"
                >
                  {albums.slice(0, 5).map(album => (
                    <TouchableOpacity
                      key={album._id}
                      className="mr-4"
                      style={{ width: 140 }}
                      activeOpacity={0.7}
                    >
                      <Image 
                        source={{ uri: album.cover || '' }}
                        className="w-full h-40 rounded-lg"
                        resizeMode="cover"
                        // ✅ CORREÇÃO: placeholder online
                        defaultSource={{ uri: 'https://via.placeholder.com/150/1a1a1a/ffffff?text=Album' }}
                      />
                      <Text 
                        className="text-white text-sm mt-2"
                        style={{ fontFamily: 'Poppins_600SemiBold' }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {album.title || 'Álbum desconhecido'}
                      </Text>
                      {album.releaseDate && (
                        <Text 
                          className="text-gray-400 text-xs mt-0.5"
                          style={{ fontFamily: 'Poppins_400Regular' }}
                        >
                          {new Date(album.releaseDate).getFullYear() || 'Ano desconhecido'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}
            
            {/* Footer */}
            {tracks.length > 0 && (
              <View className="py-8 items-center">
                <Text 
                  className="text-gray-500 text-sm"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  {tracks.length} músicas na biblioteca
                </Text>
                <Text 
                  className="text-gray-600 text-xs mt-1"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  Arraste para atualizar
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        <MiniPlayer />
      </LinearGradient>
    </View>
  );
}