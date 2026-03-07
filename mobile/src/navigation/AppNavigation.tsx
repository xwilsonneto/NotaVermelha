import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LandingScreen from '../screens/LandingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import PlayerScreen from '../screens/PlayerScreen';
import DiscoverScreen from '../screens/DiscoverScreen';

export type RootStackParamList = {
  Landing: undefined;
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Player: undefined;
  Discover: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Landing"
        screenOptions={{
          headerShown: false,
          animation: 'fade', // ✅ Animação fade suave
          animationDuration: 300, // ✅ Duração personalizada
        }}
      >
        <Stack.Screen 
          name="Landing" 
          component={LandingScreen}
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{
            animation: 'slide_from_right', // ✅ Slide da direita para Login
          }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{
            animation: 'slide_from_right', // ✅ Slide da direita para Register
          }}
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            animation: 'fade_from_bottom', // ✅ Fade do bottom para Home
          }}
        />
        <Stack.Screen 
          name="Player" 
          component={PlayerScreen}
          options={{
            animation: 'slide_from_bottom', // ✅ Slide do bottom para Player
          }}
        />
        <Stack.Screen 
          name="Discover" 
          component={DiscoverScreen}
          options={{
            animation: 'slide_from_right', // ✅ Slide da direita para Discover
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}