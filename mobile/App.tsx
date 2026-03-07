// App.tsx
import 'react-native-gesture-handler';
import React from 'react';
import './global.css';
import AppNavigator from './src/navigation/AppNavigation';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { ActivityIndicator, View } from 'react-native';
import { MusicDataProvider } from './src/contexts/MusicDataContext'; // ✅ ADICIONADO

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View className="flex-1 bg-[#0a0a0a] items-center justify-center">
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  return (
    <MusicDataProvider> {/* ✅ ADICIONADO — instância única global */}
      <StatusBar style="light" />
      <AppNavigator />
    </MusicDataProvider>
  );
}
