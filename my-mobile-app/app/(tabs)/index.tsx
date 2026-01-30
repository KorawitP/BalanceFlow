import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, SafeAreaView, Platform } from 'react-native';
import { collection, query, onSnapshot, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons'; // Using Expo vector icons

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
  const router = useRouter();

  // Summary State
  const [totalBalance, setTotalBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Realtime Query: Order by 'date' descending (newest first)
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
      calculateSummary(list);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      Alert.alert("Error", "Could not fetch transactions.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const calculateSummary = (list: Transaction[]) => {
    let inc = 0;
    let exp = 0;
    list.forEach(item => {
      if (item.type === 'income') inc += item.amount;
      else if (item.type === 'expense') exp += item.amount;
    });
    setIncome(inc);
    setExpense(exp);
    setTotalBalance(inc - exp);
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

  // Delete Action
  const handleDelete = (id: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              if (user?.uid) {
                await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
              }
            } catch (err) {
              Alert.alert("Error", "Failed to delete transaction.");
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: Transaction }) => {
    const isIncome = item.type === 'income';
    return (
      <TouchableOpacity 
        style={styles.card} 
        onLongPress={() => handleDelete(item.id)}
        // Future: onPress -> Navigate to Edit
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
            <Text style={styles.cardTitle}>{item.title}</Text>
            <View style={styles.cardMeta}>
              <Text style={styles.cardCategory}>{item.category || 'General'}</Text>
              <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
            </View>
          </View>
        </View>
        <Text style={[styles.cardAmount, { color: isIncome ? '#28C76F' : '#FF4D4D' }]}>
          {isIncome ? '+' : '-'} {formatMoney(item.amount)}
        </Text>
      </TouchableOpacity>
    );
  };

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
          <View>
            <Text style={styles.greeting}>Start your day,</Text>
            <Text style={styles.username}>Total Balance</Text>
          </View>
          <TouchableOpacity onPress={() => auth.signOut()} style={{ padding: 8 }}>
            <Feather name="log-out" size={24} color="#636E72" />
          </TouchableOpacity>
        </View>
        <Text style={styles.totalBalance}>฿{formatMoney(totalBalance)}</Text>
        
        <View style={styles.summaryRow}>
          <View style={[styles.summaryBox, styles.incomeBox]}>
            <View style={styles.summaryIconIncome}>
               <Feather name="arrow-up" size={16} color="#28C76F" />
            </View>
            <View>
              <Text style={styles.summaryLabel}>Income</Text>
              <Text style={styles.summaryValue}>฿{formatMoney(income)}</Text>
            </View>
          </View>

          <View style={[styles.summaryBox, styles.expenseBox]}>
            <View style={styles.summaryIconExpense}>
              <Feather name="arrow-down" size={16} color="#FF4D4D" />
            </View>
            <View>
              <Text style={styles.summaryLabel}>Expense</Text>
              <Text style={styles.summaryValue}>฿{formatMoney(expense)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Transactions List */}
      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {/* <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity> */}
        </View>

        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="list" size={48} color="#E2E8F0" />
            <Text style={styles.emptyText}>No transactions yet.</Text>
            <Text style={styles.emptySubText}>Start by adding your income or expense.</Text>
          </View>
        ) : (
          <FlatList
            data={transactions}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
         <TouchableOpacity 
            style={[styles.fab, styles.fabExpense]} 
            onPress={() => router.push({ pathname: '/transaction/add', params: { type: 'expense' } })}
        >
            <Feather name="minus" size={24} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity 
            style={[styles.fab, styles.fabIncome]} 
            onPress={() => router.push({ pathname: '/transaction/add', params: { type: 'income' } })}
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
    backgroundColor: '#FFFFFF', // Clean White
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
  greeting: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 8,
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
    backgroundColor: '#E6F9EF', // Very light green
  },
  expenseBox: {
    backgroundColor: '#FFF0F0', // Very light red
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
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  // Content Section
  content: {
    flex: 1,
    backgroundColor: '#F5F7FA', // Off-White background for list
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
  },
  seeAll: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  // List Item (Card)
  listContent: {
    paddingBottom: 100, // Space for FAB
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
  },
  cardDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  cardAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  // Empty State
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
  },
  emptySubText: {
    fontSize: 14,
    color: '#636E72',
    marginTop: 8,
  },
  // FAB
  fabContainer: {
    position: 'absolute',
    bottom: 24,
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
    backgroundColor: '#28C76F', // Success Green
  },
  fabExpense: {
    backgroundColor: '#FF4D4D', // Danger Red
  },
});
