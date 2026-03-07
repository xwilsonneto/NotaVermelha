import React from 'react';
import { View, Text, Animated } from 'react-native';

interface WelcomeCardProps {
  opacity: Animated.Value;
  translateY: Animated.Value;
}

export const WelcomeCard: React.FC<WelcomeCardProps> = ({ opacity, translateY }) => {
  return (
    <Animated.View 
      className="px-6 mb-8"
      style={{ 
        opacity, 
        transform: [{ translateY }] 
      }}
    >
      <View className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <Text
          className="text-white text-xl mb-2"
          style={{ fontFamily: 'Poppins_700Bold' }}
        >
          🌹 A revolução musical começou!
        </Text>
        <Text
          className="text-gray-300 text-base leading-6"
          style={{ fontFamily: 'Poppins_400Regular' }}
        >
          Explore músicas independentes, apoie artistas diretamente e faça parte da comunidade.
        </Text>
      </View>
    </Animated.View>
  );
};