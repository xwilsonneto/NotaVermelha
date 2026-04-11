// src/screens/LoginScreen.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Animated,
  Easing,
  ActivityIndicator,
  Platform,
  Keyboard,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigation';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login, isLoading, error, clearError } = useAuthStore();
  const insets = useSafeAreaInsets();
  const passwordRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<KeyboardAwareScrollView>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

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

  const isFormValid = email.trim().length > 0 && password.trim().length > 0;

  const handleLogin = async () => {
    if (!isFormValid) return;

    if (!EMAIL_REGEX.test(email.trim())) {
      useAuthStore.setState({ error: 'Email inválido (ex: nome@dominio.com)' });
      return;
    }

    clearError();
    try {
      await login(email.trim(), password);
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch {
      // erro já está no store
    }
  };

  const handleEmailSubmit = () => {
    passwordRef.current?.focus();
  };

  const handlePasswordSubmit = () => {
    Keyboard.dismiss();
    handleLogin();
  };

  return (
    <LinearGradient
      colors={['#dc2626', '#7f1d1d', '#0a0a0a']}
      locations={[0, 0.12, 1]}
      style={{ flex: 1 }}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <KeyboardAwareScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          flexGrow: 1, 
          paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={Platform.OS === 'ios' ? 40 : 20}
        extraHeight={Platform.OS === 'ios' ? 40 : 20}
        keyboardOpeningTime={0}
        bounces={false}
        scrollToOverflowEnabled={true}
      >
        <View style={{ paddingTop: insets.top + 40, paddingHorizontal: 24 }}>
          {/* Header */}
          <View style={{ alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ position: 'absolute', left: 0, padding: 8 }}
              >
                <MaterialCommunityIcons name="arrow-left" size={28} color="#f87171" />
              </TouchableOpacity>
              <MaterialCommunityIcons name="music-note" size={40} color="#f87171" />
            </View>
            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 28, color: '#fff', textAlign: 'center', marginBottom: 6 }}>
              BEM-VINDO
            </Text>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#e5e7eb', textAlign: 'center' }}>
              Entre na revolução musical
            </Text>
          </View>

          <Animated.View
            style={{
              marginTop: 40,
              opacity: fadeAnim,
              transform: [{ translateY }],
            }}
          >
            {/* Erro da API */}
            {error ? (
              <View style={{ backgroundColor: 'rgba(127,29,29,0.5)', borderWidth: 1, borderColor: '#ef4444', borderRadius: 16, padding: 16, marginBottom: 24 }}>
                <Text style={{ fontFamily: 'Poppins_400Regular', color: '#fca5a5', fontSize: 13, textAlign: 'center' }}>
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Email */}
            <View style={{ borderBottomWidth: 1, borderBottomColor: '#4b5563', marginBottom: 32 }}>
              <TextInput
                style={{ fontFamily: 'Poppins_400Regular', color: '#fff', fontSize: 16, paddingBottom: 12 }}
                placeholder="Email"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={(t) => { setEmail(t); clearError(); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                returnKeyType="next"
                onSubmitEditing={handleEmailSubmit}
                blurOnSubmit={false}
              />
            </View>

            {/* Senha */}
            <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#4b5563', marginBottom: 40 }}>
              <TextInput
                ref={passwordRef}
                style={{ flex: 1, fontFamily: 'Poppins_400Regular', color: '#fff', fontSize: 16, paddingBottom: 12 }}
                placeholder="Senha"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={(t) => { setPassword(t); clearError(); }}
                secureTextEntry={!showPassword}
                editable={!isLoading}
                returnKeyType="done"
                onSubmitEditing={handlePasswordSubmit}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={{ paddingBottom: 12, paddingLeft: 8 }}
              >
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={22}
                  color="#9ca3af"
                />
              </TouchableOpacity>
            </View>

            {/* Botão Login */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={{
                backgroundColor: '#dc2626',
                borderRadius: 50,
                paddingVertical: 16,
                alignItems: 'center',
                marginBottom: 12,
                opacity: isLoading || !isFormValid ? 0.6 : 1,
              }}
              onPress={handleLogin}
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ fontFamily: 'Poppins_700Bold', color: '#fff', fontSize: 16 }}>
                  ENTRAR
                </Text>
              )}
            </TouchableOpacity>

            {/* Ir para Register */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={{
                borderWidth: 1,
                borderColor: '#dc2626',
                borderRadius: 50,
                paddingVertical: 16,
                alignItems: 'center',
                marginBottom: Platform.OS === 'ios' ? 20 : 10,
              }}
              onPress={() => navigation.navigate('Register')}
              disabled={isLoading}
            >
              <Text style={{ fontFamily: 'Poppins_700Bold', color: '#f87171', fontSize: 16 }}>
                CRIAR CONTA
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAwareScrollView>
    </LinearGradient>
  );
}