// src/screens/HomeScreen.tsx
import React, { useEffect, useCallback } from 'react';
import {
  ScrollView,
  StatusBar,
  Animated,
  Easing,
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigation';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { useMusicData } from '../contexts/MusicDataContext';

import { HomeHeader } from '../components/home/HomeHeader';
import { ContinueListening } from '../components/home/ContinueListening';
import { FeedSection } from '../components/home/FeedSection';
import { MiniPlayer } from '../components/player/MiniPlayer';
import { BottomNavigation } from '../components/home/BottomNavigation';

// FeaturedBands foi removido da Home — vive agora na aba Explorar

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { logout } = useAuthStore();
  const insets = useSafeAreaInsets();

  const { loading, error, refresh, tracks } = useMusicData();
  const [refreshing, setRefreshing] = React.useState(false);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideUpAnim = React.useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (!loading) {
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
    }
  }, [loading]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => {
            logout();
            navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
          },
        },
      ]
    );
  }, [logout, navigation]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } catch (err) {
      console.error('Erro ao atualizar:', err);
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <LinearGradient
          colors={['#dc2626', '#7f1d1d', '#0a0a0a']}
          locations={[0, 0.12, 1]}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <StatusBar translucent backgroundColor="transparent" />
          <ActivityIndicator size="large" color="#f87171" />
          <Text
            style={{ color: '#fff', marginTop: 16, paddingHorizontal: 24, textAlign: 'center', fontFamily: 'Poppins_400Regular' }}
          >
            Carregando sua biblioteca musical...
          </Text>
        </LinearGradient>
      </View>
    );
  }

  // ─── Erro ─────────────────────────────────────────────────────────────────
  if (error && !refreshing) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <LinearGradient
          colors={['#dc2626', '#7f1d1d', '#0a0a0a']}
          locations={[0, 0.12, 1]}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}
        >
          <StatusBar translucent backgroundColor="transparent" />
          <Text style={{ color: '#fff', fontSize: 20, textAlign: 'center', marginBottom: 16, fontFamily: 'Poppins_700Bold' }}>
            Erro ao carregar dados
          </Text>
          <Text style={{ color: '#9ca3af', textAlign: 'center', marginBottom: 24, fontFamily: 'Poppins_400Regular' }} numberOfLines={3}>
            {error.length > 100 ? `${error.substring(0, 100)}...` : error}
          </Text>
          <TouchableOpacity
            onPress={handleRefresh}
            style={{ backgroundColor: '#dc2626', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 }}
          >
            <Text style={{ color: '#fff', fontSize: 14, fontFamily: 'Poppins_600SemiBold' }}>
              Tentar novamente
            </Text>
          </TouchableOpacity>
        </LinearGradient>
        <BottomNavigation activeTab="home" />
      </View>
    );
  }

  // ─── Vazio ────────────────────────────────────────────────────────────────
  if (!loading && tracks.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <LinearGradient
          colors={['#dc2626', '#7f1d1d', '#0a0a0a']}
          locations={[0, 0.12, 1]}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}
        >
          <StatusBar translucent backgroundColor="transparent" />
          <Text style={{ color: '#fff', fontSize: 20, textAlign: 'center', marginBottom: 16, fontFamily: 'Poppins_700Bold' }}>
            Nenhuma música encontrada
          </Text>
          <Text style={{ color: '#9ca3af', textAlign: 'center', marginBottom: 24, fontFamily: 'Poppins_400Regular' }}>
            Parece que não há músicas disponíveis no momento.
          </Text>
          <TouchableOpacity
            onPress={handleRefresh}
            style={{ backgroundColor: '#dc2626', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 }}
          >
            <Text style={{ color: '#fff', fontSize: 14, fontFamily: 'Poppins_600SemiBold' }}>
              Recarregar
            </Text>
          </TouchableOpacity>
        </LinearGradient>
        <BottomNavigation activeTab="home" />
      </View>
    );
  }

  // ─── Tela principal ───────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <StatusBar translucent backgroundColor="transparent" />

      <LinearGradient
        colors={['#dc2626', '#7f1d1d', '#0a0a0a']}
        locations={[0, 0.12, 1]}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
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
          contentContainerStyle={{ paddingBottom: 16 }}
        >
          <HomeHeader
            onLogout={handleLogout}
            insets={insets}
            isLoading={loading || refreshing}
          />

          {!loading && (
            <>
              {/* 1. Retomar — zero fricção */}
              <ContinueListening opacity={fadeAnim} translateY={slideUpAnim} />

              {/* 2. Social + Descoberta — feed de quem você segue */}
              <FeedSection opacity={fadeAnim} translateY={slideUpAnim} />
            </>
          )}
        </ScrollView>
      </LinearGradient>

      <MiniPlayer />
      <BottomNavigation activeTab="home" />
    </View>
  );
}
