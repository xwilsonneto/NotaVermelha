// src/components/home/QuickActions.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigation';
import { useMusicData } from '../../hooks/useMusicData';

type QuickActionsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface QuickActionsProps {
  opacity: Animated.Value;
  translateY: Animated.Value;
}

type MaterialIconName = keyof typeof MaterialCommunityIcons.glyphMap;

const actions: {
  id: number;
  icon: MaterialIconName;
  title: string;
  description: string;
  onPress: (navigation: QuickActionsNavigationProp, musicData: ReturnType<typeof useMusicData>) => void;
}[] = [
  {
    id: 1,
    icon: 'compass',
    title: 'Descobrir',
    description: 'Novas músicas',
    onPress: (navigation) => navigation.navigate('Discover'),
  },
  {
    id: 2,
    icon: 'playlist-star',
    title: 'Favoritos',
    description: 'Suas curtidas',
    onPress: (_, musicData) => {
      const likedTracks = musicData.tracks.filter(track => track.likeCount > 0);
      if (likedTracks.length > 0) {
        musicData.playTrack(likedTracks[0]);
      } else {
        alert('🎵 Você ainda não curtiu nenhuma música!');
      }
    },
  },
  {
    id: 3,
    icon: 'timeline',
    title: 'Timeline',
    description: 'Rede de camaradas',
    onPress: () => {
      alert('📱 Linha do Tempo em breve! Estamos desenvolvendo esta funcionalidade.');
    },
  },
  {
    id: 4,
    icon: 'shuffle',
    title: 'Aleatório',
    description: 'Tocar aleatório',
    onPress: (_, musicData) => {
      if (musicData.tracks.length > 0) {
        const randomIndex = Math.floor(Math.random() * musicData.tracks.length);
        musicData.playTrack(musicData.tracks[randomIndex]);
      } else {
        alert('🎵 Nenhuma música disponível!');
      }
    },
  },
];

export const QuickActions: React.FC<QuickActionsProps> = ({ opacity, translateY }) => {
  const navigation = useNavigation<QuickActionsNavigationProp>();
  const musicData = useMusicData();

  return (
    <Animated.View 
      className="px-6 mb-8"
      style={{ 
        opacity, 
        transform: [{ translateY }] 
      }}
    >
      <Text
        className="text-white text-xl mb-4"
        style={{ fontFamily: 'Poppins_700Bold' }}
      >
        Ações Rápidas
      </Text>
      
      <View className="flex-row justify-between flex-wrap">
        {actions.map((action) => (
          <TouchableOpacity 
            key={action.id}
            className="bg-white/5 rounded-2xl p-4 items-center w-[48%] mb-3 border border-white/10 active:opacity-80"
            onPress={() => action.onPress(navigation, musicData)}
          >
            <MaterialCommunityIcons
              name={action.icon}
              size={32}
              color="#f87171"
            />
            <Text
              className="text-white text-sm mt-2 text-center"
              style={{ fontFamily: 'Poppins_600SemiBold' }}
            >
              {action.title}
            </Text>
            <Text
              className="text-gray-400 text-xs mt-1 text-center"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              {action.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );
};