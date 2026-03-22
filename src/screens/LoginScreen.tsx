import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform, Image, Animated } from 'react-native';
import { supabase } from '../services/supabase';
import { colors } from '../theme';
import Icon from 'react-native-vector-icons/Ionicons';
import { BlurView } from '@react-native-community/blur';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const toastAnim = useRef(new Animated.Value(-100)).current;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 60, duration: 300, useNativeDriver: true }),
      Animated.delay(3000),
      Animated.timing(toastAnim, { toValue: -100, duration: 300, useNativeDriver: true })
    ]).start(() => setToastMsg(''));
  };

  async function handleAuth() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      Alert.alert('Invalid Input', 'Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert('Invalid Input', 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    let error;

    if (isSignUp) {
      const resp = await supabase.auth.signUp({ 
        email: trimmedEmail, 
        password,
        options: { data: { full_name: fullName.trim() } }
      });
      error = resp.error;
      if (!error) showToast('Success! Verify your email to complete registration.');
    } else {
      const resp = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
      error = resp.error;
    }

    setLoading(false);
    if (error) showToast(`Auth Error: ${error.message}`);
  }

  return (
    <SafeAreaView style={styles.root}>
      {/* Background aesthetics */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>

        <View style={styles.header}>
          <Icon name={isSignUp ? "person-add" : "log-in"} size={48} color={isSignUp ? colors.accent2 : colors.accent} />
          <Text style={[styles.logoText, { color: isSignUp ? colors.accent2 : colors.accent }]}>{isSignUp ? 'REGISTER' : 'LOG IN'}</Text>
          <Text style={styles.subtitle}>
            {isSignUp ? 'Create a premium account to sync your MUSIC.' : 'Welcome back to MUSIC.'}
          </Text>
        </View>

        <View style={styles.formContainer}>
          <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={30} reducedTransparencyFallbackColor="#111" />

          {isSignUp && (
            <>
              <Text style={styles.label}>FULL NAME</Text>
              <View style={styles.inputBox}>
                <Icon name="person-outline" size={20} color="#666" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor="#444"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </>
          )}

          <Text style={styles.label}>EMAIL</Text>
          <View style={styles.inputBox}>
            <Icon name="mail-outline" size={20} color="#666" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="user@example.com"
              placeholderTextColor="#444"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <Text style={styles.label}>PASSWORD</Text>
          <View style={styles.inputBox}>
            <Icon name="lock-closed-outline" size={20} color="#666" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#444"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.actionBtn} onPress={handleAuth} disabled={loading}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.actionText}>{isSignUp ? 'JOIN NOW' : 'LISTEN NOW'}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.switchBtn}>
            <Text style={styles.switchText}>
              {isSignUp ? 'Already a member? Sign in' : 'No account? Join the network'}
            </Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>

      {toastMsg ? (
        <Animated.View style={[styles.toast, { transform: [{ translateY: toastAnim }] }]}>
          <BlurView style={StyleSheet.absoluteFill} blurType="light" blurAmount={20} reducedTransparencyFallbackColor="#000" />
          <Text style={styles.toastText}>{toastMsg}</Text>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060606' },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
  glowTop: { position: 'absolute', top: -100, left: -100, width: 300, height: 300, backgroundColor: colors.accent, borderRadius: 150, opacity: 0.05 },
  glowBottom: { position: 'absolute', bottom: -150, right: -100, width: 400, height: 400, backgroundColor: colors.accent2, borderRadius: 200, opacity: 0.05 },
  header: { alignItems: 'center', marginBottom: 50 },
  logoText: { fontFamily: Platform.OS === 'ios' ? 'Bebas Neue' : 'sans-serif-condensed', fontSize: 48, letterSpacing: 16, color: colors.accent, fontWeight: '900', marginTop: 10 },
  subtitle: { color: '#666', fontSize: 13, marginTop: 10, textAlign: 'center', letterSpacing: 1 },
  formContainer: { borderRadius: 24, padding: 30, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  label: { color: colors.accent, fontSize: 10, letterSpacing: 3, fontWeight: '800', marginBottom: 8, marginLeft: 4 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141414', borderRadius: 16, borderWidth: 1, borderColor: '#1C1C1C', marginBottom: 24, height: 56, paddingHorizontal: 16 },
  icon: { marginRight: 12 },
  input: { flex: 1, color: '#FFF', fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  actionBtn: { backgroundColor: colors.accent, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 10, shadowColor: colors.accent, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10 },
  actionText: { color: '#000', fontSize: 12, letterSpacing: 4, fontWeight: '900' },
  switchBtn: { alignItems: 'center', marginTop: 24, padding: 10 },
  switchText: { color: '#666', fontSize: 13, fontWeight: '600' },
  toast: { position: 'absolute', top: 0, left: 24, right: 24, height: 64, borderRadius: 20, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', zIndex: 1000, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  toastText: { color: '#000', fontSize: 13, fontWeight: '800', textAlign: 'center', paddingHorizontal: 20 }
});
