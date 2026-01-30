import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import { useRouter } from 'expo-router';
import { setDoc, doc } from 'firebase/firestore';
import { Feather } from '@expo/vector-icons';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('แจ้งเตือน', 'รหัสผ่านไม่ตรงกัน');
      return;
    }

    if (password.length < 6) {
      Alert.alert('แจ้งเตือน', 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: email,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      // Auth listener handles navigation
    } catch (error: any) {
      let errorMessage = 'เกิดข้อผิดพลาดในการสมัครสมาชิก';
      if (error.code === 'auth/email-already-in-use') errorMessage = 'อีเมลนี้ถูกใช้งานแล้ว';
      else if (error.code === 'auth/invalid-email') errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
      else if (error.code === 'auth/weak-password') errorMessage = 'รหัสผ่านคาดเดาง่ายเกินไป';
      
      Alert.alert('สมัครสมาชิกไม่สำเร็จ', errorMessage);
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
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                 <Feather name="arrow-left" size={24} color="#2D3436" />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center', paddingRight: 40 }}>
                <Text style={styles.title}>สร้างบัญชีใหม่</Text>
                <Text style={styles.subtitle}>เริ่มวางแผนการเงินกับเราวันนี้</Text>
            </View>
        </View>

        <View style={styles.inputGroup}>
            <Feather name="mail" size={20} color="#636E72" style={styles.inputIcon} />
            <TextInput
            style={styles.input}
            placeholder="อีเมล"
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
            placeholder="รหัสผ่าน (ขั้นต่ำ 6 ตัวอักษร)"
            placeholderTextColor="#B0B0B0"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            />
        </View>

        <View style={styles.inputGroup}>
            <Feather name="check-circle" size={20} color="#636E72" style={styles.inputIcon} />
            <TextInput
            style={styles.input}
            placeholder="ยืนยันรหัสผ่านอีกครั้ง"
            placeholderTextColor="#B0B0B0"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            />
        </View>

        <TouchableOpacity 
            style={styles.button} 
            onPress={handleRegister}
            disabled={loading}
        >
            {loading ? (
                <ActivityIndicator color="#FFF" />
            ) : (
                <Text style={styles.buttonText}>ยืนยันการสมัคร</Text>
            )}
        </TouchableOpacity>

        <View style={styles.footer}>
            <Text style={styles.footerText}>มีบัญชีอยู่แล้ว? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={styles.linkText}>เข้าสู่ระบบ</Text>
            </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  formContainer: {
    paddingHorizontal: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F5F7FA',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  subtitle: {
    fontSize: 14,
    color: '#636E72',
    textAlign: 'center',
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
    backgroundColor: '#28C76F', // Green for registration
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#28C76F',
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
