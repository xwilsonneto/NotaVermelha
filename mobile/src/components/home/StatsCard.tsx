import React from 'react';
import { View, Text, Animated } from 'react-native';

interface StatsCardProps {
  opacity: Animated.Value;
  translateY: Animated.Value;
}

export const StatsCard: React.FC<StatsCardProps> = ({ opacity, translateY }) => {
  return (
    <Animated.View 
      className="px-6 mt-6"
      style={{ 
        opacity, 
        transform: [{ translateY }] 
      }}
    >
      <View className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <Text
          className="text-white text-lg mb-4 text-center"
          style={{ fontFamily: 'Poppins_700Bold' }}
        >
          📊 Impacto Coletivo
        </Text>
        <View className="flex-row justify-between">
          <View className="items-center">
            <Text
              className="text-primary-400 text-2xl"
              style={{ fontFamily: 'Poppins_700Bold' }}
            >
              1.2K
            </Text>
            <Text
              className="text-gray-400 text-xs"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              Artistas
            </Text>
          </View>
          <View className="items-center">
            <Text
              className="text-primary-400 text-2xl"
              style={{ fontFamily: 'Poppins_700Bold' }}
            >
              45K
            </Text>
            <Text
              className="text-gray-400 text-xs"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              Ouvintes
            </Text>
          </View>
          <View className="items-center">
            <Text
              className="text-primary-400 text-2xl"
              style={{ fontFamily: 'Poppins_700Bold' }}
            >
              R$ 28K
            </Text>
            <Text
              className="text-gray-400 text-xs"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              Distribuídos
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};