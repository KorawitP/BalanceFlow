import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { Feather } from '@expo/vector-icons';
import React from 'react';

export default function DrawerLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        screenOptions={{
          headerShown: false,
          drawerActiveBackgroundColor: '#E6F9EF',
          drawerActiveTintColor: '#28C76F',
          drawerInactiveTintColor: '#636E72',
          drawerLabelStyle: {
            fontSize: 16,
            fontWeight: '600',
            marginLeft: -20,
          },
          drawerStyle: {
            width: 280,
            backgroundColor: '#FFFFFF',
          },
          drawerType: 'front',
        }}>
        <Drawer.Screen
          name="index"
          options={{
            drawerLabel: 'หน้าหลัก',
            title: 'หน้าหลัก',
            drawerIcon: ({ color, size }) => (
              <Feather name="home" size={24} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="settings"
          options={{
            drawerLabel: 'ตั้งค่า',
            title: 'ตั้งค่า',
            drawerIcon: ({ color, size }) => (
              <Feather name="settings" size={24} color={color} />
            ),
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
