// src/screens/DiscoverScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MiniPlayer } from '../components/player/MiniPlayer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomNavigation } from '../components/home/BottomNavigation';

type DiscoverNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SearchResult {
  id: string;
  type: 'music' | 'album' | 'artist';
  title: string;
  subtitle?: string;
  image: string;
  data?: any;
}

const RECENT_SEARCHES_KEY = '@music_app/recent_searches';

const DiscoverScreen: React.FC = () => {
  const navigation = useNavigation<DiscoverNavigationProp>();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Dados do catálogo
  const { tracks, artists, albums, getTracksByArtist, loading, refresh } = useMusicData();

  // ✅ Controle de reprodução separado
  const { playTrack } = useMusicPlayer();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  // Carregar buscas recentes
  useEffect(() => {
    AsyncStorage.getItem(RECENT_SEARCHES_KEY)
      .then(saved => { if (saved) setRecentSearches(JSON.parse(saved)); })
      .catch(() => {});
  }, []);

  const saveRecentSearch = useCallback(async (term: string) => {
    if (!term.trim()) return;
    setRecentSearches(prev => {
      const next = [term, ...prev.filter(s => s !== term)].slice(0, 3);
      AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  // Animação de entrada
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
          playTrack(track, tracks); // passa a fila completa para navegação prev/next
          navigation.navigate('Player');
        }
      } else if (result.type === 'album') {
        const album = result.data as Album;
        if (album?._id) navigation.navigate('Album', { albumId: album._id });
      } else if (result.type === 'artist') {
        const artist = result.data as Artist;
        if (artist?._id) navigation.navigate('Artist', { artistId: artist._id });
      }
    } catch (e) {
      console.error('💥 Erro ao processar resultado:', e);
    }
  }, [playTrack, navigation, tracks]);

  // Ordem: artista > álbuns > músicas
  const performSearch = useCallback((query: string): SearchResult[] => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const artistResults: SearchResult[] = [];
    const albumResults: SearchResult[]  = [];
    const trackResults: SearchResult[]  = [];

    // 1. Artistas
    artists.forEach(artist => {
      if (artist.name?.toLowerCase().includes(q)) {
        const count = getTracksByArtist(artist._id).length;
        artistResults.push({
          id: `artist-${artist._id}`,
          type: 'artist',
          title: artist.name || 'Artista desconhecido',
          subtitle: `Artista • ${count} música${count !== 1 ? 's' : ''}`,
          image: artist.avatar || '',
          data: artist,
        });
      }
    });

    // 2. Álbuns diretos
    const albumIdsInResults = new Set<string>();
    albums.forEach(album => {
      if (album.title?.toLowerCase().includes(q)) {
        const count = tracks.filter(t => t.album?._id === album._id).length;
        albumResults.push({
          id: `album-${album._id}`,
          type: 'album',
          title: album.title || 'Álbum desconhecido',
          subtitle: `Álbum • ${count} música${count !== 1 ? 's' : ''}`,
          image: album.cover || '',
          data: album,
        });
        albumIdsInResults.add(album._id);
      }
    });

    // 3. Álbuns dos artistas encontrados (que ainda não estão nos resultados)
    artistResults.forEach(({ data: artist }) => {
      albums
        .filter(album =>
          !albumIdsInResults.has(album._id) &&
          tracks.some(
            t => t.album?._id === album._id && t.artists?.some((a: any) => a._id === artist._id)
          )
        )
        .forEach(album => {
          const count = tracks.filter(t => t.album?._id === album._id).length;
          albumResults.push({
            id: `album-${album._id}`,
            type: 'album',
            title: album.title || 'Álbum desconhecido',
            subtitle: `Álbum • ${count} música${count !== 1 ? 's' : ''}`,
            image: album.cover || '',
            data: album,
          });
          albumIdsInResults.add(album._id);
        });
    });

    // 4. Músicas
    tracks.forEach(track => {
      if (
        track.title?.toLowerCase().includes(q) ||
        track.artists?.some(a => a.name?.toLowerCase().includes(q)) ||
        track.album?.title?.toLowerCase().includes(q)
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

    return [...artistResults, ...albumResults, ...trackResults];
  }, [tracks, albums, artists, getTracksByArtist]);

  // Debounce da busca
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const id = setTimeout(() => {
      setSearchResults(performSearch(searchQuery));
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(id);
  }, [searchQuery, performSearch]);

  const handleSearch         = useCallback((q: string) => setSearchQuery(q), []);
  const handleSubmitSearch   = useCallback(() => { if (searchQuery.trim()) saveRecentSearch(searchQuery.trim()); }, [searchQuery, saveRecentSearch]);
  const handleRecentPress    = useCallback((s: string) => { setSearchQuery(s); saveRecentSearch(s); }, [saveRecentSearch]);
  const clearRecentSearches  = useCallback(() => {
    setRecentSearches([]);
    AsyncStorage.removeItem(RECENT_SEARCHES_KEY).catch(() => {});
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refresh(); } finally { setRefreshing(false); }
  }, [refresh]);

  const renderSearchResult = useCallback(({ item }: { item: SearchResult }) => {
    const iconName: any = item.type === 'music' ? 'music' : item.type === 'album' ? 'album' : 'account';
    const typeLabel     = item.type === 'music' ? 'Música' : item.type === 'album' ? 'Álbum' : 'Artista';

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
          />
        ) : (
          <View className="w-12 h-12 bg-white/10 rounded-lg items-center justify-center">
            <MaterialCommunityIcons name={iconName} size={24} color="#f87171" />
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
          <Text className="text-gray-500 text-xs mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
            {typeLabel}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [handleResultPress]);

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
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

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
          contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 100 }}
        >
          {/* Header + Search bar */}
          <Animated.View
            className="pt-12 px-6 pb-4"
            style={{ opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }}
          >
            <Text className="text-white text-2xl mb-6" style={{ fontFamily: 'Poppins_700Bold' }}>
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
                onSubmitEditing={handleSubmitSearch}
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

          {/* Body */}
          <Animated.View
            className="flex-1"
            style={{ opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }}
          >
            {searchQuery === '' ? (
              <View className="flex-1">
                {recentSearches.length > 0 ? (
                  <View className="px-6 mb-6">
                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-white text-lg" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        Buscas Recentes
                      </Text>
                      <TouchableOpacity onPress={clearRecentSearches}>
                        <Text className="text-red-400 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                          Limpar
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {recentSearches.map((search, index) => (
                      <TouchableOpacity
                        key={index}
                        className="flex-row items-center py-3 border-b border-white/5"
                        onPress={() => handleRecentPress(search)}
                      >
                        <MaterialCommunityIcons name="clock-outline" size={20} color="#6b7280" />
                        <Text
                          className="text-white ml-3 flex-1"
                          style={{ fontFamily: 'Poppins_400Regular' }}
                          numberOfLines={1}
                        >
                          {search}
                        </Text>
                        <MaterialCommunityIcons name="chevron-right" size={16} color="#6b7280" />
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View className="flex-1 justify-center items-center px-6 py-12">
                    <MaterialCommunityIcons name="compass" size={64} color="#6b7280" />
                    <Text
                      className="text-white text-lg text-center mt-4"
                      style={{ fontFamily: 'Poppins_600SemiBold' }}
                    >
                      Descubra novas músicas
                    </Text>
                    <Text
                      className="text-gray-400 text-center mt-2"
                      style={{ fontFamily: 'Poppins_400Regular' }}
                    >
                      Use a barra de busca para encontrar artistas, álbuns ou músicas
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View className="flex-1">
                {isSearching ? (
                  <View className="flex-1 justify-center items-center py-12">
                    <ActivityIndicator size="large" color="#f87171" />
                    <Text className="text-white mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>
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
                      keyExtractor={item => item.id}
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
        <BottomNavigation activeTab="search" />
      </LinearGradient>
    </View>
  );
};

export default DiscoverScreen;
