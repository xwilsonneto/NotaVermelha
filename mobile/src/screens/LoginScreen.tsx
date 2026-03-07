// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Animated,
  Easing,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigation';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  // ✅ isAuthenticated removido — não é mais usado aqui
  const { login, isLoading, error, clearError } = useAuthStore();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ✅ REMOVIDO: useEffect que escutava isAuthenticated e navegava na montagem
  // Isso causava navegação prematura quando o componente montava com sessão ativa

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    clearError();
    try {
      await login(email.trim(), password);
      // ✅ Navega aqui, após o await confirmar sucesso
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch {
      // erro já está no store, não navega
    }
  };

  return (
    <LinearGradient
      colors={['#dc2626', '#7f1d1d', '#0a0a0a']}
      locations={[0, 0.12, 1]}
      className="flex-1"
    >
      <StatusBar translucent backgroundColor="transparent" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="px-6 items-center" style={{ paddingTop: insets.top + 40 }}>
            <View className="flex-row items-center justify-center mb-4">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="absolute left-0 p-2"
              >
                <MaterialCommunityIcons name="arrow-left" size={28} color="#f87171" />
              </TouchableOpacity>
              <MaterialCommunityIcons name="music-note" size={40} color="#f87171" />
            </View>
            <Text
              className="text-3xl text-white text-center mb-2"
              style={{ fontFamily: 'Poppins_700Bold' }}
            >
              BEM-VINDO
            </Text>
            <Text
              className="text-base text-gray-200 text-center"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              Entre na revolução musical
            </Text>
          </View>

          <Animated.View
            className="flex-1 justify-center px-6 mt-10"
            style={{ opacity: fadeAnim, transform: [{ translateY }] }}
          >
            <View className="rounded-3xl p-6">

              {/* Erro da API */}
              {error ? (
                <View className="bg-red-900/50 border border-red-500 rounded-2xl p-4 mb-6">
                  <Text
                    className="text-red-300 text-sm text-center"
                    style={{ fontFamily: 'Poppins_400Regular' }}
                  >
                    {error}
                  </Text>
                </View>
              ) : null}

              {/* Email */}
              <View className="mb-8">
                <TextInput
                  className="text-white text-lg pb-3 border-b border-gray-600"
                  placeholder="Email"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={(t) => { setEmail(t); clearError(); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{ fontFamily: 'Poppins_400Regular' }}
                  editable={!isLoading}
                />
              </View>

              {/* Senha */}
              <View className="mb-10">
                <View className="flex-row items-center border-b border-gray-600">
                  <TextInput
                    className="flex-1 text-white text-lg pb-3"
                    placeholder="Senha"
                    placeholderTextColor="#9ca3af"
                    value={password}
                    onChangeText={(t) => { setPassword(t); clearError(); }}
                    secureTextEntry={!showPassword}
                    style={{ fontFamily: 'Poppins_400Regular' }}
                    editable={!isLoading}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="pb-3 pl-2">
                    <MaterialCommunityIcons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={22}
                      color="#9ca3af"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Botão Login */}
              <TouchableOpacity
                activeOpacity={0.85}
                className="bg-red-600 rounded-full px-8 py-4 items-center mb-4 shadow-md"
                onPress={handleLogin}
                disabled={isLoading || !email.trim() || !password.trim()}
                style={{ opacity: isLoading || !email.trim() || !password.trim() ? 0.6 : 1 }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    className="text-white text-lg"
                    style={{ fontFamily: 'Poppins_700Bold' }}
                  >
                    ENTRAR
                  </Text>
                )}
              </TouchableOpacity>

              {/* Ir para Register */}
              <TouchableOpacity
                activeOpacity={0.85}
                className="border border-red-600 rounded-full px-8 py-4 items-center"
                onPress={() => navigation.navigate('Register')}
                disabled={isLoading}
              >
                <Text
                  className="text-red-400 text-lg"
                  style={{ fontFamily: 'Poppins_700Bold' }}
                >
                  CRIAR CONTA
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <View style={{ height: insets.bottom + 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
