// src/screens/DiscoverScreen.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Animated,
  Easing,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigation';
import { useMusicData, Track, Artist, Album } from '../contexts/MusicDataContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MiniPlayer } from '../components/player/MiniPlayer';

type DiscoverNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SearchResult {
  id: string;
  type: 'music' | 'album' | 'artist';
  title: string;
  subtitle?: string;
  image: string;
  data?: any;
}

const DiscoverScreen: React.FC = () => {
  const navigation = useNavigation<DiscoverNavigationProp>();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const {
    tracks,
    artists,
    albums,
    playTrack,
    getTracksByArtist,
    getFeaturedBands,
    loading,
    refresh,
  } = useMusicData();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleResultPress = useCallback((result: SearchResult) => {
    if (!result.data) return;

    try {
      if (result.type === 'music') {
        const track = result.data as Track;
        if (track?.audioUrl) {
          playTrack(track);
          navigation.navigate('Player');
        }
      } else if (result.type === 'album') {
        const album = result.data as Album;
        if (album?._id) {
          // ✅ Vai para a tela do álbum
          navigation.navigate('Album', { albumId: album._id });
        }
      } else if (result.type === 'artist') {
        const artist = result.data as Artist;
        if (artist?._id) {
          navigation.navigate('Artist', { artistId: artist._id });
        }
      }
    } catch (error) {
      console.error('💥 Erro ao processar resultado:', error);
    }
  }, [playTrack, navigation]);

  // Ordem: artista > TODOS os álbuns > TODAS as músicas
  const performSearch = useCallback((query: string): SearchResult[] => {
    if (!query.trim()) return [];

    const normalizedQuery = query.toLowerCase();

    // Listas separadas para garantir a ordem correta independente de quantos álbuns o artista tiver
    const artistResults: SearchResult[] = [];
    const albumResults: SearchResult[]  = [];
    const trackResults: SearchResult[]  = [];

    // 1º Artistas
    artists.forEach(artist => {
      if (artist.name?.toLowerCase().includes(normalizedQuery)) {
        const artistTracks = getTracksByArtist(artist._id);
        artistResults.push({
          id: `artist-${artist._id}`,
          type: 'artist',
          title: artist.name || 'Artista desconhecido',
          subtitle: `Artista • ${artistTracks.length} música${artistTracks.length !== 1 ? 's' : ''}`,
          image: artist.avatar || '',
          data: artist,
        });
      }
    });

    // 2º Álbuns — todos antes de qualquer música
    albums.forEach(album => {
      if (album.title?.toLowerCase().includes(normalizedQuery)) {
        const albumTracks = tracks.filter(t => t.album?._id === album._id);
        albumResults.push({
          id: `album-${album._id}`,
          type: 'album',
          title: album.title || 'Álbum desconhecido',
          subtitle: `Álbum • ${albumTracks.length} música${albumTracks.length !== 1 ? 's' : ''}`,
          image: album.cover || '',
          data: album,
        });
      }
    });

    // Álbuns dos artistas encontrados também sobem (se ainda não estiverem na lista)
    const albumIdsInResults = new Set(albumResults.map(r => r.id));
    artistResults.forEach(artistResult => {
      const artist = artistResult.data;
      albums
        .filter(album => {
          // álbum pertence ao artista e ainda não está nos resultados
          const belongsToArtist = tracks.some(
            t => t.album?._id === album._id &&
                 t.artists?.some((a: any) => a._id === artist._id)
          );
          return belongsToArtist && !albumIdsInResults.has(`album-${album._id}`);
        })
        .forEach(album => {
          const albumTracks = tracks.filter(t => t.album?._id === album._id);
          albumResults.push({
            id: `album-${album._id}`,
            type: 'album',
            title: album.title || 'Álbum desconhecido',
            subtitle: `Álbum • ${albumTracks.length} música${albumTracks.length !== 1 ? 's' : ''}`,
            image: album.cover || '',
            data: album,
          });
          albumIdsInResults.add(`album-${album._id}`);
        });
    });

    // 3º Músicas — sempre por último
    tracks.forEach(track => {
      if (
        track.title?.toLowerCase().includes(normalizedQuery) ||
        track.artists?.some(artist => artist.name?.toLowerCase().includes(normalizedQuery)) ||
        track.album?.title?.toLowerCase().includes(normalizedQuery)
      ) {
        trackResults.push({
          id: `music-${track._id}`,
          type: 'music',
          title: track.title || 'Título desconhecido',
          subtitle: track.artists?.map((a: any) => a.name).join(', ') || 'Artista desconhecido',
          image: track.album?.cover || track.coverUrl || '',
          data: track,
        });
      }
    });

    // Retorna sempre: artistas → todos os álbuns → todas as músicas
    return [...artistResults, ...albumResults, ...trackResults];
  }, [tracks, albums, artists, getTracksByArtist]);

  const recentSearchesRef = useRef(recentSearches);
  recentSearchesRef.current = recentSearches;

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const timeoutId = setTimeout(() => {
      const results = performSearch(searchQuery);
      setSearchResults(results);
      setIsSearching(false);

      // Salvar busca recente
      const trimmed = searchQuery.trim();
      if (trimmed && !recentSearchesRef.current.includes(trimmed)) {
        setRecentSearches(prev => [trimmed, ...prev.slice(0, 4)]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const renderSearchResult = useCallback(({ item }: { item: SearchResult }) => {
    const getIconName = (): any => {
      switch (item.type) {
        case 'music': return 'music';
        case 'album': return 'album';
        case 'artist': return 'account';
        default: return 'music';
      }
    };

    const getItemType = () => {
      switch (item.type) {
        case 'music': return 'Música';
        case 'album': return 'Álbum';
        case 'artist': return 'Artista';
        default: return '';
      }
    };

    return (
      <TouchableOpacity
        className="flex-row items-center p-4 border-b border-white/10 active:bg-white/5"
        onPress={() => item.data && handleResultPress(item)}
        disabled={!item.data}
      >
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            className="w-12 h-12 rounded-lg"
            resizeMode="cover"
            defaultSource={{ uri: 'https://via.placeholder.com/150/1a1a1a/ffffff?text=Cover' }}
            onError={() => console.log('Erro ao carregar imagem:', item.title)}
          />
        ) : (
          <View className="w-12 h-12 bg-white/10 rounded-lg items-center justify-center">
            <MaterialCommunityIcons name={getIconName()} size={24} color="#f87171" />
          </View>
        )}

        <View className="ml-4 flex-1">
          <Text
            className="text-white text-base"
            style={{ fontFamily: 'Poppins_600SemiBold' }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.title}
          </Text>
          <Text
            className="text-gray-400 text-sm mt-1"
            style={{ fontFamily: 'Poppins_400Regular' }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.subtitle}
          </Text>
        </View>

        <View className="items-center">
          <MaterialCommunityIcons name="chevron-right" size={20} color="#6b7280" />
          <Text
            className="text-gray-500 text-xs mt-1"
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            {getItemType()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [handleResultPress]);

  const popularArtists = useMemo(() => getFeaturedBands(3), [getFeaturedBands]);

  const featuredAlbums = useMemo(() => {
    return [...albums]
      .sort((a, b) =>
        new Date(b.releaseDate || 0).getTime() - new Date(a.releaseDate || 0).getTime()
      )
      .slice(0, 3);
  }, [albums]);

  const renderSuggestions = useCallback(() => {
    return (
      <View className="px-6">
        {popularArtists.length > 0 && (
          <View className="mb-6">
            <Text
              className="text-white text-lg mb-3"
              style={{ fontFamily: 'Poppins_600SemiBold' }}
            >
              Artistas Populares
            </Text>
            {popularArtists.map((artist: Artist) => (
              <TouchableOpacity
                key={artist._id}
                className="flex-row items-center py-3 border-b border-white/5"
                onPress={() => handleResultPress({
                  id: `artist-${artist._id}`,
                  type: 'artist',
                  title: artist.name,
                  subtitle: 'Artista',
                  image: artist.avatar,
                  data: artist,
                })}
              >
                <Image
                  source={{ uri: artist.avatar }}
                  className="w-8 h-8 rounded-full"
                  resizeMode="cover"
                  defaultSource={{ uri: 'https://via.placeholder.com/150/1a1a1a/ffffff?text=Avatar' }}
                />
                <Text
                  className="text-white ml-3 flex-1"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {artist.name}
                </Text>
                <MaterialCommunityIcons name="chevron-right" size={16} color="#6b7280" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {featuredAlbums.length > 0 && (
          <View className="mb-6">
            <Text
              className="text-white text-lg mb-3"
              style={{ fontFamily: 'Poppins_600SemiBold' }}
            >
              Álbuns em Destaque
            </Text>
            {featuredAlbums.map((album: Album) => (
              <TouchableOpacity
                key={album._id}
                className="flex-row items-center py-3 border-b border-white/5"
                onPress={() => handleResultPress({
                  id: `album-${album._id}`,
                  type: 'album',
                  title: album.title,
                  subtitle: 'Álbum',
                  image: album.cover,
                  data: album,
                })}
              >
                <Image
                  source={{ uri: album.cover }}
                  className="w-8 h-8 rounded-lg"
                  resizeMode="cover"
                  defaultSource={{ uri: 'https://via.placeholder.com/150/1a1a1a/ffffff?text=Album' }}
                />
                <Text
                  className="text-white ml-3 flex-1"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {album.title}
                </Text>
                <MaterialCommunityIcons name="chevron-right" size={16} color="#6b7280" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  }, [popularArtists, featuredAlbums, handleResultPress]);

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#f87171" />
        <Text className="text-white mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>
          Carregando músicas...
        </Text>
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
            />
          }
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: insets.bottom + 100,
          }}
        >
          <Animated.View
            className="pt-12 px-6 pb-4"
            style={{ opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }}
          >
            <Text
              className="text-white text-2xl mb-6"
              style={{ fontFamily: 'Poppins_700Bold' }}
            >
              Descobrir
            </Text>

            <View className="bg-white/10 rounded-2xl px-4 py-3 flex-row items-center">
              <MaterialCommunityIcons name="magnify" size={24} color="#6b7280" />
              <TextInput
                className="flex-1 ml-3 text-white"
                placeholder="Buscar músicas, álbuns ou artistas..."
                placeholderTextColor="#6b7280"
                value={searchQuery}
                onChangeText={handleSearch}
                style={{ fontFamily: 'Poppins_400Regular' }}
                returnKeyType="search"
              />
              {searchQuery !== '' && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialCommunityIcons name="close" size={20} color="#6b7280" />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          <Animated.View
            className="flex-1"
            style={{ opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }}
          >
            {searchQuery === '' ? (
              <View className="flex-1">
                {recentSearches.length > 0 && (
                  <View className="px-6 mb-6">
                    <View className="flex-row justify-between items-center mb-4">
                      <Text
                        className="text-white text-lg"
                        style={{ fontFamily: 'Poppins_600SemiBold' }}
                      >
                        Buscas Recentes
                      </Text>
                      <TouchableOpacity onPress={clearRecentSearches}>
                        <Text
                          className="text-red-400 text-sm"
                          style={{ fontFamily: 'Poppins_400Regular' }}
                        >
                          Limpar
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {recentSearches.map((search, index) => (
                      <TouchableOpacity
                        key={index}
                        className="flex-row items-center py-3 border-b border-white/5"
                        onPress={() => setSearchQuery(search)}
                      >
                        <MaterialCommunityIcons name="clock-outline" size={20} color="#6b7280" />
                        <Text
                          className="text-white ml-3 flex-1"
                          style={{ fontFamily: 'Poppins_400Regular' }}
                          numberOfLines={1}
                        >
                          {search}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {renderSuggestions()}
              </View>
            ) : (
              <View className="flex-1">
                {isSearching ? (
                  <View className="flex-1 justify-center items-center py-12">
                    <ActivityIndicator size="large" color="#f87171" />
                    <Text
                      className="text-white mt-4"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                    >
                      Buscando...
                    </Text>
                  </View>
                ) : searchResults.length > 0 ? (
                  <View>
                    <Text
                      className="text-white text-lg px-6 py-4"
                      style={{ fontFamily: 'Poppins_600SemiBold' }}
                    >
                      {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''}
                    </Text>
                    <FlatList
                      data={searchResults}
                      keyExtractor={(item) => item.id}
                      renderItem={renderSearchResult}
                      showsVerticalScrollIndicator={false}
                      scrollEnabled={false}
                      initialNumToRender={10}
                      maxToRenderPerBatch={5}
                      windowSize={5}
                    />
                  </View>
                ) : (
                  <View className="flex-1 justify-center items-center px-6 py-12">
                    <MaterialCommunityIcons name="music-off" size={64} color="#6b7280" />
                    <Text
                      className="text-white text-lg text-center mt-4"
                      style={{ fontFamily: 'Poppins_600SemiBold' }}
                    >
                      Nenhum resultado encontrado
                    </Text>
                    <Text
                      className="text-gray-400 text-center mt-2"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                    >
                      Tente buscar por outro termo
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Animated.View>
        </ScrollView>

        <MiniPlayer />
      </LinearGradient>
    </View>
  );
};

export default DiscoverScreen;