import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Auth listener in _layout.tsx will handle redirection
    } catch (error: any) {
      let errorMessage = 'Something went wrong';
      if (error.code === 'auth/invalid-email') errorMessage = 'Invalid email address';
      else if (error.code === 'auth/user-not-found') errorMessage = 'User not found';
      else if (error.code === 'auth/wrong-password') errorMessage = 'Incorrect password';
      else if (error.code === 'auth/invalid-credential') errorMessage = 'Invalid credentials';
      
      Alert.alert('Login Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.formContainer}>
        <View style={styles.header}>
            <View style={styles.iconBox}>
                <Feather name="activity" size={40} color="#28C76F" />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to manage your expenses</Text>
        </View>

        <View style={styles.inputGroup}>
            <Feather name="mail" size={20} color="#636E72" style={styles.inputIcon} />
            <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#B0B0B0"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            />
        </View>

        <View style={styles.inputGroup}>
            <Feather name="lock" size={20} color="#636E72" style={styles.inputIcon} />
            <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#B0B0B0"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            />
        </View>

        <TouchableOpacity 
            style={styles.button} 
            onPress={handleLogin}
            disabled={loading}
        >
            {loading ? (
                <ActivityIndicator color="#FFF" />
            ) : (
                <Text style={styles.buttonText}>Sign In</Text>
            )}
        </TouchableOpacity>

        <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={styles.linkText}>Sign Up</Text>
            </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Clean White
    justifyContent: 'center',
  },
  formContainer: {
    paddingHorizontal: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconBox: {
    width: 72,
    height: 72,
    backgroundColor: '#E6F9EF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#636E72',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2D3436',
  },
  button: {
    backgroundColor: '#2D3436', // Dark elegant button
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#2D3436',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#636E72',
  },
  linkText: {
    fontSize: 14,
    color: '#28C76F',
    fontWeight: '600',
  },
});
