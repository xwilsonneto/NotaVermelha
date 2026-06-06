// src/components/navigation/BottomNavigation.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../navigation/AppNavigation';

type BottomNavNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type TabItem = {
  id: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconActive: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  route: keyof RootStackParamList | null;
};

const TABS: TabItem[] = [
  {
    id: 'home',
    icon: 'home-outline',
    iconActive: 'home',
    label: 'Início',
    route: 'Home',
  },
  {
    id: 'search',
    icon: 'magnify',
    iconActive: 'magnify',
    label: 'Buscar',
    route: 'Discover',
  },
  {
    id: 'library',
    icon: 'bookshelf',
    iconActive: 'bookshelf',
    label: 'Biblioteca',
    route: null, // future screen
  },
  {
    id: 'feed',
    icon: 'timeline-outline',
    iconActive: 'timeline',
    label: 'Feed',
    route: null, // future screen
  },
];

interface BottomNavigationProps {
  activeTab?: string;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab = 'home' }) => {
  const navigation = useNavigation<BottomNavNavigationProp>();
  const insets = useSafeAreaInsets();

  const handleTabPress = (tab: TabItem) => {
    if (tab.route) {
      navigation.navigate(tab.route as any);
    } else {
      console.log(`Tab ${tab.id} - em breve!`);
    }
  };

  return (
    <View
      style={{
        paddingBottom: insets.bottom || 8,
        backgroundColor: '#0a0a0a',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <View className="flex-row items-center justify-around px-2 pt-2">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => handleTabPress(tab)}
              className="flex-1 items-center py-1"
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={isActive ? tab.iconActive : tab.icon}
                size={24}
                color={isActive ? '#f87171' : '#6b7280'}
              />
              <Text
                style={{
                  fontFamily: isActive ? 'Poppins_600SemiBold' : 'Poppins_400Regular',
                  fontSize: 10,
                  marginTop: 3,
                  color: isActive ? '#f87171' : '#6b7280',
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
