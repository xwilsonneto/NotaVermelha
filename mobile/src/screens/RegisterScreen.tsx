// src/screens/RegisterScreen.tsx
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

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  // ✅ isAuthenticated removido — não é mais usado aqui
  const { register, isLoading, error, clearError } = useAuthStore();
  const insets = useSafeAreaInsets();

  const [role, setRole] = useState<'listener' | 'band'>('listener');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    genre: '',
    city: '',
    bio: '',
  });

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

  const setField = (key: keyof typeof form, value: string) => {
    clearError();
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const validate = (): string | null => {
    if (!form.username.trim()) return 'Username é obrigatório';
    if (form.username.trim().length < 3) return 'Username deve ter no mínimo 3 caracteres';
    if (!form.email.trim()) return 'Email é obrigatório';
    if (!form.password) return 'Senha é obrigatória';
    if (form.password.length < 6) return 'Senha deve ter no mínimo 6 caracteres';
    if (form.password !== form.confirmPassword) return 'As senhas não coincidem';
    if (role === 'band' && !form.genre.trim()) return 'Gênero musical é obrigatório para bandas';
    return null;
  };

  const handleRegister = async () => {
    const validationError = validate();
    if (validationError) {
      useAuthStore.setState({ error: validationError });
      return;
    }
    clearError();
    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        role,
        ...(role === 'band' && {
          bandInfo: {
            genre: form.genre.trim(),
            city: form.city.trim(),
            bio: form.bio.trim(),
          },
        }),
      });
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
              <MaterialCommunityIcons name="account-plus" size={40} color="#f87171" />
            </View>
            <Text
              className="text-3xl text-white text-center mb-2"
              style={{ fontFamily: 'Poppins_700Bold' }}
            >
              CRIAR CONTA
            </Text>
            <Text
              className="text-base text-gray-200 text-center"
              style={{ fontFamily: 'Poppins_400Regular' }}
            >
              Junte-se à revolução musical
            </Text>
          </View>

          <Animated.View
            className="flex-1 px-6 mt-8"
            style={{ opacity: fadeAnim, transform: [{ translateY }] }}
          >
            <View className="rounded-3xl p-6">

              {/* Toggle ouvinte / banda */}
              <View className="flex-row bg-black/30 rounded-2xl p-1 mb-8">
                <TouchableOpacity
                  className={`flex-1 py-3 rounded-xl items-center flex-row justify-center gap-2 ${role === 'listener' ? 'bg-red-600' : ''}`}
                  onPress={() => setRole('listener')}
                >
                  <MaterialCommunityIcons
                    name="account-music"
                    size={18}
                    color={role === 'listener' ? '#fff' : '#9ca3af'}
                  />
                  <Text
                    style={{
                      fontFamily: 'Poppins_600SemiBold',
                      fontSize: 13,
                      color: role === 'listener' ? '#fff' : '#9ca3af',
                    }}
                  >
                    Ouvinte
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-1 py-3 rounded-xl items-center flex-row justify-center gap-2 ${role === 'band' ? 'bg-red-600' : ''}`}
                  onPress={() => setRole('band')}
                >
                  <MaterialCommunityIcons
                    name="guitar-electric"
                    size={18}
                    color={role === 'band' ? '#fff' : '#9ca3af'}
                  />
                  <Text
                    style={{
                      fontFamily: 'Poppins_600SemiBold',
                      fontSize: 13,
                      color: role === 'band' ? '#fff' : '#9ca3af',
                    }}
                  >
                    Banda / Artista
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Erro */}
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

              {/* Username */}
              <View className="mb-7">
                <TextInput
                  className="text-white text-base pb-3 border-b border-gray-600"
                  placeholder={role === 'band' ? 'Username da banda (ex: sepultura)' : 'Username (ex: joao)'}
                  placeholderTextColor="#9ca3af"
                  value={form.username}
                  onChangeText={(t) => setField('username', t)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{ fontFamily: 'Poppins_400Regular' }}
                  editable={!isLoading}
                />
              </View>

              {/* Email */}
              <View className="mb-7">
                <TextInput
                  className="text-white text-base pb-3 border-b border-gray-600"
                  placeholder="Email"
                  placeholderTextColor="#9ca3af"
                  value={form.email}
                  onChangeText={(t) => setField('email', t)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{ fontFamily: 'Poppins_400Regular' }}
                  editable={!isLoading}
                />
              </View>

              {/* Senha */}
              <View className="mb-7">
                <View className="flex-row items-center border-b border-gray-600">
                  <TextInput
                    className="flex-1 text-white text-base pb-3"
                    placeholder="Senha (mín. 6 caracteres)"
                    placeholderTextColor="#9ca3af"
                    value={form.password}
                    onChangeText={(t) => setField('password', t)}
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

              {/* Confirmar senha */}
              <View className="mb-7">
                <TextInput
                  className="text-white text-base pb-3 border-b border-gray-600"
                  placeholder="Confirmar senha"
                  placeholderTextColor="#9ca3af"
                  value={form.confirmPassword}
                  onChangeText={(t) => setField('confirmPassword', t)}
                  secureTextEntry={!showPassword}
                  style={{ fontFamily: 'Poppins_400Regular' }}
                  editable={!isLoading}
                />
              </View>

              {/* Campos extras de BANDA */}
              {role === 'band' && (
                <View className="border-t border-gray-700 pt-6 mb-2">
                  <Text
                    className="text-gray-400 text-xs mb-5 uppercase tracking-widest"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
                  >
                    Informações da Banda
                  </Text>

                  <View className="mb-7">
                    <TextInput
                      className="text-white text-base pb-3 border-b border-gray-600"
                      placeholder="Gênero musical (ex: Metal, Punk, Rock)"
                      placeholderTextColor="#9ca3af"
                      value={form.genre}
                      onChangeText={(t) => setField('genre', t)}
                      style={{ fontFamily: 'Poppins_400Regular' }}
                      editable={!isLoading}
                    />
                  </View>

                  <View className="mb-7">
                    <TextInput
                      className="text-white text-base pb-3 border-b border-gray-600"
                      placeholder="Cidade (ex: São Paulo, SP)"
                      placeholderTextColor="#9ca3af"
                      value={form.city}
                      onChangeText={(t) => setField('city', t)}
                      style={{ fontFamily: 'Poppins_400Regular' }}
                      editable={!isLoading}
                    />
                  </View>

                  <View className="mb-7">
                    <TextInput
                      className="text-white text-base pb-3 border-b border-gray-600"
                      placeholder="Bio da banda (opcional)"
                      placeholderTextColor="#9ca3af"
                      value={form.bio}
                      onChangeText={(t) => setField('bio', t)}
                      multiline
                      numberOfLines={3}
                      style={{ fontFamily: 'Poppins_400Regular' }}
                      editable={!isLoading}
                    />
                  </View>
                </View>
              )}

              {/* Botão registrar */}
              <TouchableOpacity
                activeOpacity={0.85}
                className="bg-red-600 rounded-full px-8 py-4 items-center mb-4 shadow-md"
                onPress={handleRegister}
                disabled={isLoading}
                style={{ opacity: isLoading ? 0.6 : 1 }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    className="text-white text-lg"
                    style={{ fontFamily: 'Poppins_700Bold' }}
                  >
                    CRIAR CONTA
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                className="border border-red-600 rounded-full px-8 py-4 items-center"
                onPress={() => navigation.goBack()}
                disabled={isLoading}
              >
                <Text
                  className="text-red-400 text-lg"
                  style={{ fontFamily: 'Poppins_700Bold' }}
                >
                  VOLTAR AO LOGIN
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
