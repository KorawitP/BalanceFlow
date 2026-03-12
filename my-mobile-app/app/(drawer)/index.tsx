import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, SafeAreaView, Platform, RefreshControl, Animated } from 'react-native';
import { collection, query, onSnapshot, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'expo-router';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import TransactionItem from '../../components/TransactionItem';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

// Types
interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: any; // Firestore Timestamp
  createdAt: any;
}

export default function HomeScreen() {
  const { user, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const navigation = useNavigation();

  // Filter State
  const [showFilter, setShowFilter] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Filtered transactions + summary (useMemo)
  const filteredTransactions = useMemo(() => {
    if (!startDate && !endDate) return transactions;
    return transactions.filter(t => {
      const txDate = t.date?.toDate ? t.date.toDate() : new Date(t.date);
      if (startDate && txDate < new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())) return false;
      if (endDate && txDate > new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59)) return false;
      return true;
    });
  }, [transactions, startDate, endDate]);

  const { income, expense, totalBalance } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    filteredTransactions.forEach(item => {
      if (item.type === 'income') inc += item.amount;
      else if (item.type === 'expense') exp += item.amount;
    });
    return { income: inc, expense: exp, totalBalance: inc - exp };
  }, [filteredTransactions]);

  const isFiltering = startDate !== null || endDate !== null;

  const subscribeToTransactions = useCallback(() => {
    if (!user) return () => {};

    const q = query(
      collection(db, 'users', user.uid, 'transactions'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      
      setTransactions(list);
      setLoading(false);
      setRefreshing(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถดึงข้อมูลรายการได้");
      setLoading(false);
      setRefreshing(false);
    });

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    const unsubscribe = subscribeToTransactions();
    return () => unsubscribe();
  }, [subscribeToTransactions]);

  // Date picker handlers
  const onStartDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) setStartDate(selectedDate);
  };

  const onEndDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) setEndDate(selectedDate);
  };

  const resetFilter = () => {
    setStartDate(null);
    setEndDate(null);
    setShowFilter(false);
  };

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
  };

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('th-TH', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  // Pull-to-Refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // The subscription will automatically update
  }, []);

  // Delete Action - Memoized with useCallback
  const handleDelete = useCallback((id: string) => {
    Alert.alert(
      "ยืนยันการลบ",
      "คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?",
      [
        { text: "ยกเลิก", style: "cancel" },
        { 
          text: "ลบรายการ", 
          style: "destructive", 
          onPress: async () => {
            try {
              if (user?.uid) {
                await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
              }
            } catch (err) {
              Alert.alert("ผิดพลาด", "ไม่สามารถลบรายการได้");
            }
          }
        }
      ]
    );
  }, [user?.uid]);

  // Navigate to Edit screen - Memoized with useCallback
  const handleItemPress = useCallback((item: Transaction) => {
    router.push({
      pathname: '/transaction/edit' as any,
      params: { id: item.id, type: item.type }
    });
  }, [router]);

  // Optimized renderItem using the memoized component
  const renderItem = useCallback(({ item }: { item: Transaction }) => (
    <TransactionItem 
      item={item} 
      onPress={handleItemPress}
      onLongPress={handleDelete}
    />
  ), [handleItemPress, handleDelete]);

  if (authLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
             <TouchableOpacity 
                onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} 
                style={styles.menuButton}
             >
                <Feather name="menu" size={24} color="#2D3436" />
             </TouchableOpacity>
             <View>
                <Text style={styles.greeting}>เริ่มต้นวันใหม่,</Text>
                <Text style={styles.username}>ยอดเงินคงเหลือ</Text>
             </View>
          </View>
          <TouchableOpacity 
            onPress={() => setShowFilter(!showFilter)} 
            style={[styles.menuButton, isFiltering && styles.filterActiveButton]}
          >
            <Feather name="search" size={22} color={isFiltering ? '#FFF' : '#2D3436'} />
          </TouchableOpacity>
        </View>
        <Text style={styles.totalBalance}>฿{formatMoney(totalBalance)}</Text>
        
        <View style={styles.summaryRow}>
          <View style={[styles.summaryBox, styles.incomeBox]}>
            <View style={styles.summaryIconIncome}>
               <Feather name="arrow-up" size={16} color="#28C76F" />
            </View>
            <View>
              <Text style={styles.summaryLabel}>รายรับ</Text>
              <Text style={styles.summaryValue}>฿{formatMoney(income)}</Text>
            </View>
          </View>

          <View style={[styles.summaryBox, styles.expenseBox]}>
            <View style={styles.summaryIconExpense}>
              <Feather name="arrow-down" size={16} color="#FF4D4D" />
            </View>
            <View>
              <Text style={styles.summaryLabel}>รายจ่าย</Text>
              <Text style={styles.summaryValue}>฿{formatMoney(expense)}</Text>
            </View>
          </View>
        </View>

        {/* Filter Panel */}
        {showFilter && (
          <View style={styles.filterPanel}>
            <View style={styles.filterRow}>
              <TouchableOpacity 
                style={styles.dateButton} 
                onPress={() => setShowStartPicker(true)}
              >
                <Feather name="calendar" size={14} color="#636E72" />
                <Text style={styles.dateButtonText}>
                  {startDate ? formatDateShort(startDate) : 'วันเริ่มต้น'}
                </Text>
              </TouchableOpacity>

              <Feather name="arrow-right" size={16} color="#B2BEC3" />

              <TouchableOpacity 
                style={styles.dateButton} 
                onPress={() => setShowEndPicker(true)}
              >
                <Feather name="calendar" size={14} color="#636E72" />
                <Text style={styles.dateButtonText}>
                  {endDate ? formatDateShort(endDate) : 'วันสิ้นสุด'}
                </Text>
              </TouchableOpacity>

              {isFiltering && (
                <TouchableOpacity style={styles.resetButton} onPress={resetFilter}>
                  <Feather name="x" size={16} color="#FF4D4D" />
                </TouchableOpacity>
              )}
            </View>

            {isFiltering && (
              <Text style={styles.filterResultText}>
                แสดง {filteredTransactions.length} รายการ
              </Text>
            )}

            {showStartPicker && (
              <DateTimePicker
                value={startDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onStartDateChange}
                maximumDate={endDate || new Date()}
              />
            )}
            {showEndPicker && (
              <DateTimePicker
                value={endDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onEndDateChange}
                minimumDate={startDate || undefined}
                maximumDate={new Date()}
              />
            )}
          </View>
        )}
      </View>

      {/* Transactions List */}
      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {isFiltering ? 'ผลการค้นหา' : 'รายการล่าสุด'}
          </Text>
          <Text style={styles.sectionHint}>แตะเพื่อแก้ไข • กดค้างเพื่อลบ</Text>
        </View>

        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name={isFiltering ? 'search' : 'list'} size={48} color="#E2E8F0" />
            <Text style={styles.emptyText}>
              {isFiltering ? 'ไม่พบรายการ' : 'ยังไม่มีรายการ'}
            </Text>
            <Text style={styles.emptySubText}>
              {isFiltering 
                ? 'ลองเปลี่ยนช่วงวันที่แล้วค้นหาอีกครั้ง' 
                : 'เริ่มต้นบันทึกรายรับ-รายจ่ายของคุณได้เลย'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredTransactions}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#28C76F']}
                tintColor="#28C76F"
              />
            }
          />
        )}
      </View>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
         <TouchableOpacity 
            style={[styles.fab, styles.fabExpense]} 
            onPress={() => router.push({ pathname: '/transaction/add' as any, params: { type: 'expense' } })}
        >
            <Feather name="minus" size={24} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity 
            style={[styles.fab, styles.fabIncome]} 
            onPress={() => router.push({ pathname: '/transaction/add' as any, params: { type: 'income' } })}
        >
            <Feather name="plus" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 40 : 20,
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
    marginRight: 4,
  },
  greeting: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  totalBalance: {
    fontSize: 36,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  summaryBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  incomeBox: {
    backgroundColor: '#E6F9EF',
  },
  expenseBox: {
    backgroundColor: '#FFF0F0',
  },
  summaryIconIncome: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
  },
  summaryIconExpense: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#636E72',
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3436',
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  sectionHint: {
    fontSize: 11,
    color: '#8E8E93',
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  listContent: {
    paddingBottom: 100,
  },
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
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
    marginTop: 16,
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  emptySubText: {
    fontSize: 14,
    color: '#636E72',
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 80,
    right: 24,
    flexDirection: 'row',
    gap: 16,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  fabIncome: {
    backgroundColor: '#28C76F',
  },
  fabExpense: {
    backgroundColor: '#FF4D4D',
  },
  filterActiveButton: {
    backgroundColor: '#007AFF',
  },
  filterPanel: {
    marginTop: 16,
    backgroundColor: '#F5F7FA',
    borderRadius: 16,
    padding: 16,
  },
  filterRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateButtonText: {
    fontSize: 13,
    color: '#2D3436',
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  resetButton: {
    padding: 8,
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
  },
  filterResultText: {
    fontSize: 12,
    color: '#636E72',
    marginTop: 8,
    textAlign: 'center' as const,
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
});
