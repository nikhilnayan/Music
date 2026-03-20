import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { colors, spacing } from '../theme';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');

  const handleLogin = () => {
    if (email && pass) {
       navigation.replace('MainTabs');
    } else {
       Alert.alert('Error', 'Please fill in details');
    }
  };

  return (
    <View style={styles.container}>
      <BlurView style={StyleSheet.absoluteFill} blurType="light" blurAmount={30} />
      <SafeAreaView style={styles.form}>
        <Text style={styles.logo}>Music App</Text>
        <Text style={styles.tag}>Log in to your liquid glass experience</Text>
        
        <TextInput 
           placeholder="Email" 
           style={styles.input} 
           placeholderTextColor="rgba(0,0,0,0.4)"
           value={email}
           onChangeText={setEmail}
        />
        <TextInput 
           placeholder="Password" 
           style={styles.input} 
           secureTextEntry 
           placeholderTextColor="rgba(0,0,0,0.4)"
           value={pass}
           onChangeText={setPass}
        />

        <TouchableOpacity style={styles.btn} onPress={handleLogin}>
           <Text style={styles.btnText}>Login</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center' },
  form: { padding: 30 },
  logo: { fontSize: 40, fontWeight: '900', color: '#000', marginBottom: 10 },
  tag: { fontSize: 16, color: '#666', marginBottom: 40 },
  input: { backgroundColor: 'rgba(0,0,0,0.05)', height: 60, borderRadius: 15, paddingHorizontal: 20, marginBottom: 20, fontSize: 16 },
  btn: { backgroundColor: '#000', height: 60, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
