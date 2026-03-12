import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { checkBudgetAfterExpense } from '../../services/notificationService';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../constants/categories';

export default function AddTransactionScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: 'income' | 'expense' }>();
  const isIncome = type === 'income';
  const { user } = useAuth();

  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const categories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const themeColor = isIncome ? '#28C76F' : '#FF4D4D';

  const handleSave = async () => {
    if (!amount || isNaN(parseFloat(amount))) {
      Alert.alert('ผิดพลาด', 'กรุณาระบุจำนวนเงินที่ถูกต้อง');
      return;
    }
    if (!title.trim()) {
      Alert.alert('ผิดพลาด', 'กรุณาระบุรายละเอียด');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('ผิดพลาด', 'กรุณาเลือกหมวดหมู่');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'users', user!.uid, 'transactions'), {
        amount: parseFloat(amount),
        title: title.trim(),
        type: type, // 'income' or 'expense'
        category: selectedCategory, // Save Thai category ID/Label directly or map efficiently
        date: Timestamp.fromDate(date),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // ตรวจสอบงบประมาณหลังบันทึกรายจ่าย
      if (type === 'expense') {
        await checkBudgetAfterExpense(user!.uid, selectedCategory, parseFloat(amount), date);
      }

      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('ผิดพลาด', 'บันทึกรายการไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { backgroundColor: themeColor }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isIncome ? 'รายรับใหม่' : 'รายจ่ายใหม่'}</Text>
          <View style={{ width: 24 }} /> 
        </View>

        <View style={styles.amountContainer}>
            <Text style={styles.currencyPrefix}>฿</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="rgba(255,255,255,0.6)"
              keyboardType="numeric"
              autoFocus
            />
        </View>
      </View>

      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        {/* Date Selector */}
        <View style={styles.inputGroup}>
            <Text style={styles.label}>วันที่</Text>
            <TouchableOpacity 
              style={styles.dateButton} 
              onPress={() => setShowDatePicker(true)}
            >
              <Feather name="calendar" size={20} color="#636E72" />
              <Text style={styles.dateText}>
                {date.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </TouchableOpacity>
        </View>
        
        {/* Date Picker Component */}
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            maximumDate={new Date()} // Prevent future dates
          />
        )}

        {/* Note / Title */}
        <View style={styles.inputGroup}>
            <Text style={styles.label}>รายละเอียด</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="บันทึกรายละเอียด..."
              placeholderTextColor="#B0B0B0"
            />
        </View>

        {/* Categories */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>หมวดหมู่</Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryItem,
                  selectedCategory === cat.id && { backgroundColor: themeColor, borderColor: themeColor }
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Feather 
                  name={cat.icon as any} 
                  size={20} 
                  color={selectedCategory === cat.id ? '#FFF' : '#636E72'} 
                />
                <Text style={[
                  styles.categoryText,
                  selectedCategory === cat.id && { color: '#FFF' }
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: themeColor }]} 
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
             <ActivityIndicator color="#FFF" />
          ) : (
             <Text style={styles.saveButtonText}>บันทึกรายการ</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} /> 
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyPrefix: {
    fontSize: 40,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginRight: 8,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
    minWidth: 100,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    padding: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#2D3436',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  dateButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#2D3436',
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryItem: {
    width: '30%', // Approx 3 columns
    aspectRatio: 1.2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#636E72',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  saveButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
});
