// src/components/home/HomeHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';

interface HomeHeaderProps {
  onLogout: () => void;
  insets: { top: number };
  isLoading?: boolean; // ✅ NOVA PROP
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({ 
  onLogout, 
  insets,
  isLoading = false 
}) => {
  const { user } = useAuthStore();

  return (
    <View className="px-6 pt-6" style={{ paddingTop: insets.top + 20 }}>
      <View className="flex-row items-center justify-between mb-6">
        <View className="flex-row items-center">
          <MaterialCommunityIcons
            name="music-circle"
            size={36}
            color="#f87171"
          />
          <View className="ml-3">
            <Text
              className="text-2xl text-white"
              style={{ fontFamily: 'Poppins_700Bold' }}
            >
              NOTA VERMELHA
            </Text>
            <Text
              className="text-gray-300 text-sm"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              Bem-vindo, {user?.name || 'Usuário'}
            </Text>
          </View>
        </View>
        
        <View className="flex-row items-center">
          {/* ✅ Indicador de loading */}
          {isLoading && (
            <ActivityIndicator 
              size="small" 
              color="#f87171" 
              style={{ marginRight: 12 }}
            />
          )}
          
          <TouchableOpacity 
            onPress={onLogout} 
            className="p-2"
            disabled={isLoading}
          >
            <MaterialCommunityIcons 
              name="logout" 
              size={24} 
              color={isLoading ? "#6b7280" : "#f87171"} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};