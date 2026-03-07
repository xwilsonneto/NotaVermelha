// src/screens/LandingScreen.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigation';
import Carousel from 'react-native-reanimated-carousel';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type LandingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type CardInfo = {
  id: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
  description: string;
};

const cards: CardInfo[] = [
  {
    id: 1,
    icon: 'music-note-eighth',
    title: 'MÚSICA COLETIVA',
    subtitle: 'A arte é de todos',
    description:
      'Plataforma onde artistas independentes compartilham sua arte sem intermediários capitalistas.',
  },
  {
    id: 2,
    icon: 'hand-heart',
    title: 'DISTRIBUIÇÃO JUSTA',
    subtitle: 'O valor volta para quem cria',
    description:
      '70% dos recursos vai diretamente para os artistas. Modelo transparente e coletivo.',
  },
  {
    id: 3,
    icon: 'account-group',
    title: 'COMUNIDADE SOLIDÁRIA',
    subtitle: 'Juntos somos mais fortes',
    description:
      'Rede de fãs e músicos unidos por uma causa comum. Apoie artistas independentes.',
  },
  {
    id: 4,
    icon: 'flag-variant',
    title: 'JUNTE-SE À REVOLUÇÃO',
    subtitle: 'Faça parte da mudança',
    description:
      'A arte deve pertencer ao povo que a cria, não aos capitalistas que a exploram.',
  },
];

export default function LandingScreen() {
  const navigation = useNavigation<LandingScreenNavigationProp>();
  const carouselRef = useRef<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(15)).current;
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    const anims = [
      // Animação do header
      Animated.parallel([
        Animated.timing(headerFade, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(headerTranslateY, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
      ]),
      // Animação do carousel (começa depois)
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
      ]),
    ];

    Animated.sequence(anims).start();
    return () => anims.forEach((a) => a.stop());
  }, []);

  const renderCard = useCallback(
    ({ item, index }: { item: CardInfo; index: number }) => {
      const isLastCard = index === cards.length - 1;

      return (
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY }],
            width: '100%',
            height: screenHeight * (Platform.OS === 'ios' ? 0.5 : 0.55),
            justifyContent: 'center',
          }}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.05)', 'rgba(0,0,0,0.35)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            className="flex-1 rounded-3xl p-6 items-center justify-center shadow-lg mx-2"
            style={{
              shadowColor: '#f87171',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <MaterialCommunityIcons
              name={item.icon}
              size={48}
              color="#f87171"
              style={{ marginBottom: 16 }}
            />

            <Text
              className="text-2xl text-center text-white mb-2"
              style={{
                fontFamily: 'Poppins_700Bold',
                textShadowColor: 'rgba(255,0,0,0.3)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 6,
              }}
            >
              {item.title}
            </Text>

            <Text
              className="text-lg text-center text-gray-200 mb-4"
              style={{ fontFamily: 'Poppins_600SemiBold' }}
            >
              {item.subtitle}
            </Text>

            <Text
              className="text-base text-center text-gray-100 leading-6 mb-6"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              {item.description}
            </Text>

            {isLastCard && (
              <View className="w-full items-center space-y-3 mt-2">
                <TouchableOpacity
                  activeOpacity={0.85}
                  className="bg-red-600 rounded-full px-8 py-4 w-64 items-center"
                  style={{
                    shadowColor: '#dc2626',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.5,
                    shadowRadius: 8,
                    elevation: 8,
                  }}
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text
                    className="text-white text-lg"
                    style={{ fontFamily: 'Poppins_700Bold' }}
                  >
                    ENTRAR
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  className="border border-red-500 rounded-full px-8 py-4 w-64 items-center"
                  style={{
                    shadowColor: '#dc2626',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                  onPress={() => navigation.navigate('Register')}
                >
                  <Text
                    className="text-red-400 text-lg"
                    style={{ fontFamily: 'Poppins_700Bold' }}
                  >
                    CADASTRAR
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </LinearGradient>
        </Animated.View>
      );
    },
    [fadeAnim, translateY, navigation]
  );

  return (
    <LinearGradient
      colors={['#dc2626', '#7f1d1d', '#0a0a0a']}
      locations={[0, 0.12, 1]}
      className="flex-1"
    >
      <StatusBar translucent backgroundColor="transparent" />

      {/* HEADER */}
      <Animated.View 
        className="px-6 items-center"
        style={{ 
          paddingTop: insets.top + 20,
          opacity: headerFade,
          transform: [{ translateY: headerTranslateY }]
        }}
      >
        <MaterialCommunityIcons
          name="music-circle"
          size={56}
          color="#f87171"
          style={{ marginBottom: 8 }}
        />
        <Text
          className="text-4xl text-white text-center mb-2"
          style={{ fontFamily: 'Poppins_700Bold' }}
        >
          NOTA VERMELHA
        </Text>
        <Text
          className="text-lg text-gray-200 text-center"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          A música é de todos
        </Text>
      </Animated.View>

      {/* CAROUSEL CENTRAL */}
      <View className="flex-1 justify-center items-center">
        <Carousel
          ref={carouselRef}
          loop={false}
          width={screenWidth * 0.9}
          height={screenHeight * (Platform.OS === 'ios' ? 0.5 : 0.55)}
          data={cards}
          renderItem={renderCard}
          onSnapToItem={(index) => setCurrentIndex(index)}
          onProgressChange={(_, absoluteProgress) => {
            const progress = Math.abs(absoluteProgress);
            const nextIndex = Math.round(progress);
            if (nextIndex !== currentIndex) {
              setCurrentIndex(nextIndex);
            }
          }}
          mode="parallax"
          modeConfig={{
            parallaxScrollingScale: 0.9,
            parallaxScrollingOffset: 0,
          }}
          defaultIndex={0}
          autoPlay={false}
          pagingEnabled={true}
          snapEnabled={true}
          enabled={true}
          style={{
            overflow: 'visible',
          }}
          windowSize={cards.length}
          customConfig={() => ({ type: 'negative', viewCount: cards.length })}
        />
      </View>

      {/* INDICADORES */}
      <View 
        className="w-full items-center"
        style={{ 
          paddingBottom: Platform.OS === 'ios' ? insets.bottom + 30 : insets.bottom + 20 
        }}
      >
        <View className="flex-row space-x-3 mb-4">
          {cards.map((_, i) => (
            <View
              key={i}
              className={`rounded-full ${
                i === currentIndex 
                  ? 'bg-red-500 w-3.5 h-3.5' 
                  : 'bg-gray-600 w-2.5 h-2.5'
              }`}
              style={{
                shadowColor: i === currentIndex ? '#f87171' : 'transparent',
                shadowOffset: { width: 0, height: i === currentIndex ? 2 : 0 },
                shadowOpacity: i === currentIndex ? 0.8 : 0,
                shadowRadius: i === currentIndex ? 4 : 0,
                elevation: i === currentIndex ? 4 : 0,
              }}
            />
          ))}
        </View>
        
        {/* Indicador de swipe */}
        {currentIndex < cards.length - 1 && (
          <Animated.View 
            className="flex-row items-center"
            style={{ opacity: headerFade }}
          >
            <MaterialCommunityIcons
              name="gesture-swipe-horizontal"
              size={20}
              color="#6b7280"
            />
            <Text
              className="text-gray-500 text-sm ml-2"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              Deslize para continuar
            </Text>
          </Animated.View>
        )}
      </View>
    </LinearGradient>
  );
}