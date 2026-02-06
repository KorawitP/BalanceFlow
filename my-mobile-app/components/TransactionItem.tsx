import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Types
interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: any;
  createdAt: any;
}

interface TransactionItemProps {
  item: Transaction;
  onPress: (item: Transaction) => void;
  onLongPress: (id: string) => void;
}

// Category translation map
const categoryMap: { [key: string]: string } = {
  'Food': 'อาหาร',
  'Transport': 'เดินทาง',
  'Shopping': 'ช้อปปิ้ง',
  'Entertainment': 'บันเทิง',
  'Bills': 'บิล/ค่าน้ำไฟ',
  'Health': 'สุขภาพ',
  'Other': 'อื่นๆ',
  'Salary': 'เงินเดือน',
  'Freelance': 'ฟรีแลนซ์',
  'Gift': 'ของขวัญ',
  'Investment': 'การลงทุน'
};

const formatMoney = (amount: number) => {
  return amount.toLocaleString('th-TH', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
};

const TransactionItem = memo(({ item, onPress, onLongPress }: TransactionItemProps) => {
  const isIncome = item.type === 'income';
  const displayCategory = categoryMap[item.category] || item.category;

  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  const handleLongPress = useCallback(() => {
    // Haptic feedback on long press
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress(item.id);
  }, [item.id, onLongPress]);

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.iconBox, { backgroundColor: isIncome ? '#E6F9EF' : '#FFF0F0' }]}>
          <Feather 
            name={isIncome ? "arrow-up-circle" : "arrow-down-circle"} 
            size={24} 
            color={isIncome ? '#28C76F' : '#FF4D4D'} 
          />
        </View>
        <View>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.cardMeta}>
            <Text style={styles.cardCategory}>{displayCategory}</Text>
            <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
          </View>
        </View>
      </View>
      <Text style={[styles.cardAmount, { color: isIncome ? '#28C76F' : '#FF4D4D' }]}>
        {isIncome ? '+' : '-'} {formatMoney(item.amount)}
      </Text>
    </Pressable>
  );
});

TransactionItem.displayName = 'TransactionItem';

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    padding: 10,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
    maxWidth: 150,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardCategory: {
    fontSize: 12,
    color: '#636E72',
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  cardDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  cardAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default TransactionItem;
