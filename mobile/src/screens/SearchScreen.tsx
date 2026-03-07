// src/screens/SearchScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StatusBar, 
  TextInput, 
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Keyboard,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMusicData, Track } from '../hooks/useMusicData';
import { MiniPlayer } from '../components/player/MiniPlayer';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // ✅ Hook centralizado
  const { 
    searchTracks, 
    playTrack, 
    currentTrack, 
    isPlaying, 
    loading, 
    error,
    refresh,
    tracks 
  } = useMusicData();
  
  const results = useMemo(() => searchTracks(query), [query, searchTracks, tracks]);

  // ✅ Monitorar teclado
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // ✅ Debounce na busca
  useEffect(() => {
    if (query.trim()) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setIsSearching(false);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setIsSearching(false);
    }
  }, [query]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } catch (err) {
      console.error('Erro ao atualizar:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    Keyboard.dismiss();
  };

  const handlePlayTrack = useCallback((track: Track) => {
    try {
      playTrack(track);
      Keyboard.dismiss();
    } catch (error) {
      console.error('Erro ao reproduzir música:', error);
    }
  }, [playTrack]);

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const renderTrack = useCallback(({ item }: { item: Track }) => {
    const isCurrentlyPlaying = currentTrack?._id === item._id;
    
    return (
      <TouchableOpacity
        className="flex-row items-center bg-white/5 rounded-xl p-3 mb-2 active:bg-white/10"
        onPress={() => handlePlayTrack(item)}
        activeOpacity={0.7}
      >
        <View className="relative">
          <Image 
            source={{ uri: item.album?.cover || item.coverUrl || '' }}
            className="w-12 h-12 rounded-lg mr-3"
            resizeMode="cover"
            // ✅ CORREÇÃO: placeholder online
            defaultSource={{ uri: 'https://via.placeholder.com/150/1a1a1a/ffffff?text=Cover' }}
            onError={() => console.log('Erro ao carregar imagem:', item.title)}
          />
          {isCurrentlyPlaying && (
            <View className="absolute inset-0 bg-black/50 rounded-lg items-center justify-center">
              <MaterialCommunityIcons 
                name={isPlaying ? "pause" : "play"} 
                size={16} 
                color="#f87171" 
              />
            </View>
          )}
        </View>
        
        <View className="flex-1">
          <Text 
            className="text-white"
            style={{ 
              fontFamily: 'Poppins_600SemiBold',
              color: isCurrentlyPlaying ? '#f87171' : '#ffffff'
            }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.title || 'Título desconhecido'}
          </Text>
          <Text 
            className="text-gray-400 text-sm mt-0.5"
            style={{ fontFamily: 'Poppins_400Regular' }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.artists?.map(artist => artist.name).join(', ') || 'Artista desconhecido'}
          </Text>
        </View>
        
        <View className="items-end">
          <Text 
            className="text-gray-400 text-sm"
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            {formatDuration(item.duration || 0)}
          </Text>
          {item.playCount > 0 && (
            <View className="flex-row items-center mt-1">
              <MaterialCommunityIcons name="play" size={12} color="#9CA3AF" />
              <Text 
                className="text-gray-400 text-xs ml-1"
                style={{ fontFamily: 'Poppins_400Regular' }}
              >
                {item.playCount.toLocaleString()}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [currentTrack, isPlaying, handlePlayTrack]);

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
            className="text-white mt-4"
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            Carregando músicas...
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
            Erro ao carregar
          </Text>
          <Text 
            className="text-gray-400 text-center mt-2 mb-6"
            style={{ fontFamily: 'Poppins_400Regular' }}
          >
            {error}
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
            paddingBottom: keyboardVisible 
              ? 20 
              : insets.bottom + 100
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6 pt-6" style={{ paddingTop: insets.top + 20 }}>
            <Text 
              className="text-3xl text-white mb-6"
              style={{ fontFamily: 'Poppins_700Bold' }}
            >
              Buscar
            </Text>
            
            {/* Barra de Busca */}
            <View className="bg-white/10 rounded-2xl px-4 py-3 flex-row items-center mb-6">
              <MaterialCommunityIcons
                name="magnify"
                size={24}
                color="#6b7280"
              />
              <TextInput
                className="flex-1 ml-3 text-white"
                placeholder="Buscar músicas, artistas..."
                placeholderTextColor="#6b7280"
                value={query}
                onChangeText={setQuery}
                style={{ fontFamily: 'Poppins_400Regular' }}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
              />
              {query !== '' && (
                <TouchableOpacity 
                  onPress={handleClearSearch}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={20}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Resultados */}
            {isSearching ? (
              <View className="items-center py-12">
                <ActivityIndicator size="large" color="#f87171" />
                <Text 
                  className="text-white mt-4"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  Buscando...
                </Text>
              </View>
            ) : query.trim() === '' ? (
              <View className="items-center py-12">
                <MaterialCommunityIcons 
                  name="music-note-outline" 
                  size={64} 
                  color="#6b7280" 
                />
                <Text 
                  className="text-white text-lg mt-4 text-center"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                >
                  Busque suas músicas favoritas
                </Text>
                <Text 
                  className="text-gray-400 text-center mt-2 px-8"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  Digite o nome da música, artista ou álbum para começar
                </Text>
                
                {tracks.length > 0 && (
                  <View className="mt-8 w-full">
                    <Text 
                      className="text-white text-lg mb-4"
                      style={{ fontFamily: 'Poppins_600SemiBold' }}
                    >
                      Sugestões
                    </Text>
                    <FlatList
                      data={tracks.slice(0, 5)}
                      keyExtractor={(item) => item._id}
                      renderItem={renderTrack}
                      scrollEnabled={false}
                      initialNumToRender={5}
                    />
                  </View>
                )}
              </View>
            ) : results.length > 0 ? (
              <>
                <Text 
                  className="text-white text-lg mb-4"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                >
                  {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
                </Text>
                <FlatList
                  data={results}
                  keyExtractor={(item) => item._id}
                  renderItem={renderTrack}
                  scrollEnabled={false}
                  initialNumToRender={10}
                  maxToRenderPerBatch={5}
                  windowSize={5}
                />
              </>
            ) : (
              <View className="items-center py-12">
                <MaterialCommunityIcons name="music-off" size={64} color="#6b7280" />
                <Text 
                  className="text-white text-lg mt-4 text-center"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                >
                  Nenhum resultado encontrado
                </Text>
                <Text 
                  className="text-gray-400 text-center mt-2 px-8"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  Tente buscar por outro termo ou verifique a ortografia
                </Text>
                <TouchableOpacity
                  onPress={handleClearSearch}
                  className="mt-6 bg-red-600 px-6 py-3 rounded-full"
                >
                  <Text 
                    className="text-white text-sm"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
                  >
                    Limpar busca
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Esconder MiniPlayer quando teclado está visível */}
        {!keyboardVisible && <MiniPlayer />}
      </LinearGradient>
    </View>
  );
}