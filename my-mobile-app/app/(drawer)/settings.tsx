import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Switch, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { auth, db } from '../../firebaseConfig';
import { useRouter, useNavigation } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { DrawerActions } from '@react-navigation/native';

export default function SettingsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [isNotifyEnabled, setNotifyEnabled] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    if (user) {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      }
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "ยืนยันการออกจากระบบ",
      "คุณต้องการออกจากระบบใช่หรือไม่?",
      [
        { text: "ยกเลิก", style: "cancel" },
        { 
          text: "ออกจากระบบ", 
          style: "destructive",
          onPress: async () => {
            try {
              await auth.signOut();
            } catch (error) {
              Alert.alert("Error", "ไม่สามารถออกจากระบบได้");
            }
          } 
        }
      ]
    );
  };

  const handleToggleNotify = (value: boolean) => {
    setNotifyEnabled(value);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity 
            onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} 
            style={styles.menuButton}
        >
            <Feather name="menu" size={24} color="#2D3436" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ตั้งค่า</Text>
      </View>

      {/* User Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
           <Feather name="user" size={32} color="#FFF" />
        </View>
        <View>
          <Text style={styles.userName}>{userData?.displayName || user?.email?.split('@')[0] || 'ผู้ใช้งาน'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ทั่วไป</Text>
        
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconBox, { backgroundColor: '#E6F4FE' }]}>
               <Feather name="bell" size={20} color="#007AFF" />
            </View>
            <Text style={styles.rowLabel}>การแจ้งเตือน</Text>
          </View>
          <Switch 
            value={isNotifyEnabled} 
            onValueChange={handleToggleNotify} 
            trackColor={{ false: "#E2E8F0", true: "#28C76F" }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>เกี่ยวกับแอปพลิเคชัน</Text>
        
        <TouchableOpacity style={styles.row}>
           <View style={styles.rowLeft}>
            <View style={[styles.iconBox, { backgroundColor: '#F0F2F5' }]}>
               <Feather name="info" size={20} color="#636E72" />
            </View>
            <Text style={styles.rowLabel}>เวอร์ชัน 1.0.0 (Beta)</Text>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Feather name="log-out" size={20} color="#FF4D4D" style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>ออกจากระบบ</Text>
      </TouchableOpacity>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D3436',
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2D3436',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  userEmail: {
    fontSize: 14,
    color: '#636E72',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#636E72',
    marginBottom: 12,
    marginLeft: 4,
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 16,
    color: '#2D3436',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 8,
    backgroundColor: '#FFE5E5',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD0D0',
  },
  logoutText: {
    color: '#FF4D4D',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
});
