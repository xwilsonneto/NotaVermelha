// src/screens/RegisterScreen.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  Image,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  KeyboardEvent,
  LayoutChangeEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigation';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../store/authStore';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const SCROLL_PADDING_ABOVE = 120;

function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e: KeyboardEvent) => setKeyboardHeight(e.endCoordinates.height),
    );

    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0),
    );

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return keyboardHeight;
}

function LineInput({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  editable = true,
  multiline,
  numberOfLines,
  rightElement,
  onSubmitEditing,
  returnKeyType,
  inputRef,
  scrollViewRef,
}: {
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  rightElement?: React.ReactNode;
  onSubmitEditing?: () => void;
  returnKeyType?: any;
  inputRef?: React.RefObject<TextInput | null>;
  scrollViewRef: React.RefObject<ScrollView | null>;
}) {

  const yPosition = useRef(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    yPosition.current = event.nativeEvent.layout.y;
  };

  const handleFocus = useCallback(() => {
    if (!scrollViewRef.current) return;

    scrollViewRef.current.scrollTo({
      y: yPosition.current - SCROLL_PADDING_ABOVE,
      animated: true,
    });

  }, [scrollViewRef]);

  return (
    <View
      onLayout={handleLayout}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#4b5563',
        marginBottom: 28,
      }}
    >
      <TextInput
        ref={inputRef}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        autoCorrect={false}
        style={{
          flex: 1,
          color: '#fff',
          fontSize: 15,
          paddingBottom: 12,
          fontFamily: 'Poppins_400Regular',
        }}
        editable={editable}
        multiline={multiline}
        numberOfLines={numberOfLines}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        blurOnSubmit={false}
        onFocus={handleFocus}
      />
      {rightElement}
    </View>
  );
}

export default function RegisterScreen() {

  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { register, isLoading, error, clearError } = useAuthStore();

  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();

  const scrollViewRef = useRef<ScrollView>(null);

  const nameRef = useRef<TextInput>(null);
  const usernameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const genreRef = useRef<TextInput>(null);
  const cityRef = useRef<TextInput>(null);
  const bioRef = useRef<TextInput>(null);
  const instagramRef = useRef<TextInput>(null);
  const spotifyRef = useRef<TextInput>(null);
  const youtubeRef = useRef<TextInput>(null);

  const [role, setRole] = useState<'listener' | 'band'>('listener');
  const [showPassword, setShowPassword] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    genre: '',
    city: '',
    bio: '',
    instagram: '',
    spotify: '',
    youtube: '',
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const animY = useRef(new Animated.Value(20)).current;

  useEffect(() => {

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(animY, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();

  }, []);

  const setField = (key: keyof typeof form, value: string) => {
    clearError();
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const pickAvatar = async () => {

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à sua galeria para escolher uma foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const validate = (): string | null => {

    if (!form.name.trim()) return 'Nome é obrigatório';
    if (!form.username.trim()) return 'Username é obrigatório';
    if (form.username.trim().length < 3) return 'Username deve ter no mínimo 3 caracteres';
    if (!form.email.trim()) return 'Email é obrigatório';
    if (!EMAIL_REGEX.test(form.email.trim())) return 'Email inválido (ex: nome@dominio.com)';
    if (!form.password) return 'Senha é obrigatória';
    if (form.password.length < 6) return 'Senha deve ter no mínimo 6 caracteres';
    if (form.password !== form.confirmPassword) return 'As senhas não coincidem';
    if (role === 'band' && !form.genre.trim()) return 'Gênero musical é obrigatório para bandas';

    return null;
  };

  const handleRegister = async () => {

    Keyboard.dismiss();

    const validationError = validate();

    if (validationError) {
      useAuthStore.setState({ error: validationError });
      return;
    }

    clearError();

    try {

      await register({
        name: form.name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        role,
        ...(role === 'band' && {
          bandInfo: {
            genre: form.genre.trim(),
            city: form.city.trim(),
            bio: form.bio.trim(),
            socialLinks: {
              instagram: form.instagram.trim(),
              spotify: form.spotify.trim(),
              youtube: form.youtube.trim(),
            },
          },
        }),
      });

      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });

    } catch {}

  };

  const focusNext = (ref: React.RefObject<TextInput | null>) => ref.current?.focus();

  const avatarInitials = form.name.trim() || form.username.trim() || 'U';

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarInitials)}&background=7f1d1d&color=fff&bold=true&size=128`;

  const s = { scrollViewRef };

  return (
    <LinearGradient
      colors={['#dc2626', '#7f1d1d', '#0a0a0a']}
      locations={[0, 0.12, 1]}
      style={{ flex: 1 }}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >

        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: keyboardHeight > 0
              ? keyboardHeight + 24
              : (Platform.OS === 'ios' ? 60 : 40),
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentInset={{ bottom: keyboardHeight }}
          scrollIndicatorInsets={{ bottom: keyboardHeight }}
          bounces={false}
        >

          <View style={{ paddingTop: insets.top + 24, paddingHorizontal: 24 }}>

            <View style={{ alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={{ position: 'absolute', left: 0, padding: 8 }}
                >
                  <MaterialCommunityIcons name="arrow-left" size={28} color="#f87171" />
                </TouchableOpacity>
                <MaterialCommunityIcons name="account-plus" size={36} color="#f87171" />
              </View>
              <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 26, color: '#fff', textAlign: 'center', marginBottom: 4 }}>
                CRIAR CONTA
              </Text>
              <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#e5e7eb', textAlign: 'center' }}>
                Junte-se à revolução musical
              </Text>
            </View>

            <Animated.View style={{ marginTop: 24, opacity: fadeAnim, transform: [{ translateY: animY }] }}>

              <View style={{ flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 16, padding: 4, marginBottom: 28 }}>
                {(['listener', 'band'] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 12,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 6,
                      backgroundColor: role === r ? '#dc2626' : 'transparent',
                    }}
                    onPress={() => setRole(r)}
                  >
                    <MaterialCommunityIcons
                      name={r === 'listener' ? 'account-music' : 'guitar-electric'}
                      size={18}
                      color={role === r ? '#fff' : '#9ca3af'}
                    />
                    <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: role === r ? '#fff' : '#9ca3af' }}>
                      {r === 'listener' ? 'Ouvinte' : 'Banda / Artista'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {error ? (
                <View style={{ backgroundColor: 'rgba(127,29,29,0.5)', borderWidth: 1, borderColor: '#ef4444', borderRadius: 16, padding: 16, marginBottom: 20 }}>
                  <Text style={{ fontFamily: 'Poppins_400Regular', color: '#fca5a5', fontSize: 13, textAlign: 'center' }}>
                    {error}
                  </Text>
                </View>
              ) : null}

              <View style={{ alignItems: 'center', marginBottom: 28 }}>
                <TouchableOpacity onPress={pickAvatar} activeOpacity={0.8}>
                  <Image
                    source={{ uri: avatarUri || defaultAvatar }}
                    style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: '#dc2626' }}
                  />
                  <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#dc2626', borderRadius: 12, padding: 4, borderWidth: 2, borderColor: '#0a0a0a' }}>
                    <MaterialCommunityIcons name="camera" size={14} color="#fff" />
                  </View>
                </TouchableOpacity>
                <Text style={{ fontFamily: 'Poppins_400Regular', color: '#9ca3af', fontSize: 11, marginTop: 6 }}>
                  Toque para adicionar foto
                </Text>
              </View>

              <LineInput {...s}
                inputRef={nameRef}
                placeholder={role === 'band' ? 'Nome da banda (ex: Yuri e os Terráqueos)' : 'Seu nome (ex: João Silva)'}
                value={form.name} onChangeText={(t) => setField('name', t)}
                editable={!isLoading} returnKeyType="next"
                onSubmitEditing={() => focusNext(usernameRef)}
              />

              <LineInput {...s}
                inputRef={usernameRef}
                placeholder={role === 'band' ? 'Username da banda (ex: yuriterraqueos)' : 'Username (ex: joaosilva)'}
                value={form.username} onChangeText={(t) => setField('username', t)}
                autoCapitalize="none" editable={!isLoading} returnKeyType="next"
                onSubmitEditing={() => focusNext(emailRef)}
              />

              <LineInput {...s}
                inputRef={emailRef}
                placeholder="Email (ex: contato@banda.com)"
                value={form.email} onChangeText={(t) => setField('email', t)}
                keyboardType="email-address" autoCapitalize="none"
                editable={!isLoading} returnKeyType="next"
                onSubmitEditing={() => focusNext(passwordRef)}
              />

              <LineInput {...s}
                inputRef={passwordRef}
                placeholder="Senha (mín. 6 caracteres)"
                value={form.password} onChangeText={(t) => setField('password', t)}
                secureTextEntry={!showPassword} autoCapitalize="none"
                editable={!isLoading} returnKeyType="next"
                onSubmitEditing={() => focusNext(confirmPasswordRef)}
                rightElement={
                  <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={{ paddingBottom: 12, paddingLeft: 8 }}>
                    <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#9ca3af" />
                  </TouchableOpacity>
                }
              />

              <LineInput {...s}
                inputRef={confirmPasswordRef}
                placeholder="Confirmar senha"
                value={form.confirmPassword} onChangeText={(t) => setField('confirmPassword', t)}
                secureTextEntry={!showPassword} autoCapitalize="none"
                editable={!isLoading}
                returnKeyType={role === 'band' ? 'next' : 'done'}
                onSubmitEditing={() => role === 'band' ? focusNext(genreRef) : (Keyboard.dismiss(), handleRegister())}
              />

              {role === 'band' && (
                <View style={{ borderTopWidth: 1, borderTopColor: '#374151', paddingTop: 20, marginBottom: 8 }}>
                  <Text style={{ fontFamily: 'Poppins_600SemiBold', color: '#6b7280', fontSize: 11, marginBottom: 20, letterSpacing: 2, textTransform: 'uppercase' }}>
                    Informações da Banda
                  </Text>

                  <LineInput {...s}
                    inputRef={genreRef}
                    placeholder="Gênero musical (ex: Metal, Punk, Rock)"
                    value={form.genre} onChangeText={(t) => setField('genre', t)}
                    editable={!isLoading} returnKeyType="next"
                    onSubmitEditing={() => focusNext(cityRef)}
                  />

                  <LineInput {...s}
                    inputRef={cityRef}
                    placeholder="Cidade (ex: São Paulo, SP)"
                    value={form.city} onChangeText={(t) => setField('city', t)}
                    editable={!isLoading} returnKeyType="next"
                    onSubmitEditing={() => focusNext(bioRef)}
                  />

                  <LineInput {...s}
                    inputRef={bioRef}
                    placeholder="Bio da banda (opcional)"
                    value={form.bio} onChangeText={(t) => setField('bio', t)}
                    multiline numberOfLines={3}
                    editable={!isLoading} returnKeyType="next"
                    onSubmitEditing={() => focusNext(instagramRef)}
                  />

                  <Text style={{ fontFamily: 'Poppins_600SemiBold', color: '#6b7280', fontSize: 11, marginBottom: 20, letterSpacing: 2, textTransform: 'uppercase' }}>
                    Redes Sociais (opcional)
                  </Text>

                  <LineInput {...s}
                    inputRef={instagramRef}
                    placeholder="Instagram (@handle)"
                    value={form.instagram} onChangeText={(t) => setField('instagram', t)}
                    autoCapitalize="none" editable={!isLoading} returnKeyType="next"
                    onSubmitEditing={() => focusNext(spotifyRef)}
                  />

                  <LineInput {...s}
                    inputRef={spotifyRef}
                    placeholder="Spotify (link ou @handle)"
                    value={form.spotify} onChangeText={(t) => setField('spotify', t)}
                    autoCapitalize="none" editable={!isLoading} returnKeyType="next"
                    onSubmitEditing={() => focusNext(youtubeRef)}
                  />

                  <LineInput {...s}
                    inputRef={youtubeRef}
                    placeholder="YouTube (@handle)"
                    value={form.youtube} onChangeText={(t) => setField('youtube', t)}
                    autoCapitalize="none" editable={!isLoading} returnKeyType="done"
                    onSubmitEditing={() => { Keyboard.dismiss(); handleRegister(); }}
                  />
                </View>
              )}

              <TouchableOpacity
                activeOpacity={0.85}
                style={{
                  backgroundColor: '#dc2626',
                  borderRadius: 50,
                  paddingVertical: 16,
                  alignItems: 'center',
                  marginBottom: 12,
                  opacity: isLoading ? 0.6 : 1,
                  marginTop: role === 'band' ? 10 : 0,
                }}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={{ fontFamily: 'Poppins_700Bold', color: '#fff', fontSize: 16 }}>CRIAR CONTA</Text>
                }
              </TouchableOpacity>

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
                onPress={() => navigation.goBack()}
                disabled={isLoading}
              >
                <Text style={{ fontFamily: 'Poppins_700Bold', color: '#f87171', fontSize: 16 }}>VOLTAR AO LOGIN</Text>
              </TouchableOpacity>

            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}