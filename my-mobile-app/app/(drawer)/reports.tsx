import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { exportAndShareCSV } from '../../services/exportService';

const screenWidth = Dimensions.get('window').width;

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  title: string;
  date: Timestamp;
}

// Category colors for pie chart
const CATEGORY_COLORS: { [key: string]: string } = {
  'อาหาร': '#FF6B6B',
  'เดินทาง': '#4ECDC4',
  'ช้อปปิ้ง': '#FFE66D',
  'บันเทิง': '#95E1D3',
  'สุขภาพ': '#F38181',
  'ค่าบิล': '#AA96DA',
  'การศึกษา': '#6C5CE7',
  'อื่นๆ': '#A8A8A8',
  'เงินเดือน': '#28C76F',
  'โบนัส': '#00CFE8',
  'ลงทุน': '#7367F0',
  'ขายของ': '#FF9F43',
  'ของขวัญ': '#EA5455',
};

const MONTHS_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

export default function ReportsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [viewMode, setViewMode] = useState<'daily' | 'monthly' | 'chart'>('daily');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportAndShareCSV(transactions);
    } finally {
      setExporting(false);
    }
  };

  // Load all transactions
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'transactions'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      setTransactions(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // ================== DAILY SUMMARY ==================
  const dailySummary = useMemo(() => {
    const dailyMap: { [key: string]: { income: number; expense: number; date: Date } } = {};
    
    transactions.forEach(t => {
      const date = t.date.toDate();
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      
      if (!dailyMap[key]) {
        dailyMap[key] = { income: 0, expense: 0, date };
      }
      
      if (t.type === 'income') {
        dailyMap[key].income += t.amount;
      } else {
        dailyMap[key].expense += t.amount;
      }
    });

    return Object.values(dailyMap)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 14); // Last 14 days with data
  }, [transactions]);

  // ================== MONTHLY SUMMARY ==================
  const monthlySummary = useMemo(() => {
    const monthlyMap: { [key: string]: { income: number; expense: number; month: number; year: number } } = {};
    
    transactions.forEach(t => {
      const date = t.date.toDate();
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      
      if (!monthlyMap[key]) {
        monthlyMap[key] = { income: 0, expense: 0, month: date.getMonth(), year: date.getFullYear() };
      }
      
      if (t.type === 'income') {
        monthlyMap[key].income += t.amount;
      } else {
        monthlyMap[key].expense += t.amount;
      }
    });

    return Object.values(monthlyMap)
      .sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month))
      .slice(0, 12); // Last 12 months
  }, [transactions]);

  // ================== CHART DATA ==================
  // Last 7 days bar chart
  const last7DaysData = useMemo(() => {
    const days = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    const labels = last7Days.map(d => days[d.getDay()]);
    const expenseData = last7Days.map(date => {
      return transactions
        .filter(t => {
          const tDate = t.date.toDate();
          return t.type === 'expense' &&
            tDate.getDate() === date.getDate() &&
            tDate.getMonth() === date.getMonth() &&
            tDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, t) => sum + t.amount, 0);
    });
    const incomeData = last7Days.map(date => {
      return transactions
        .filter(t => {
          const tDate = t.date.toDate();
          return t.type === 'income' &&
            tDate.getDate() === date.getDate() &&
            tDate.getMonth() === date.getMonth() &&
            tDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, t) => sum + t.amount, 0);
    });

    return { labels, incomeData, expenseData };
  }, [transactions]);

  // Monthly bar chart (last 6 months)
  const monthlyChartData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return { month: date.getMonth(), year: date.getFullYear() };
    });

    const labels = last6Months.map(m => MONTHS_TH[m.month]);
    const expenseData = last6Months.map(m => {
      return transactions
        .filter(t => {
          const tDate = t.date.toDate();
          return t.type === 'expense' &&
            tDate.getMonth() === m.month &&
            tDate.getFullYear() === m.year;
        })
        .reduce((sum, t) => sum + t.amount, 0);
    });
    const incomeData = last6Months.map(m => {
      return transactions
        .filter(t => {
          const tDate = t.date.toDate();
          return t.type === 'income' &&
            tDate.getMonth() === m.month &&
            tDate.getFullYear() === m.year;
        })
        .reduce((sum, t) => sum + t.amount, 0);
    });

    return { labels, incomeData, expenseData };
  }, [transactions]);

  // Expense by category pie chart
  const expenseByCategory = useMemo(() => {
    const categoryMap: { [key: string]: number } = {};
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    transactions
      .filter(t => t.type === 'expense' && t.date.toDate() >= startOfMonth)
      .forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
      });
    
    return Object.entries(categoryMap)
      .map(([name, amount]) => ({
        name,
        amount,
        color: CATEGORY_COLORS[name] || '#A8A8A8',
        legendFontColor: '#636E72',
        legendFontSize: 11,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions]);

  // Overall stats
  const thisMonthStats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthTransactions = transactions.filter(t => t.date.toDate() >= startOfMonth);
    
    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('th-TH', { minimumFractionDigits: 0 });
  };

  const formatDate = (date: Date) => {
    const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    return `${days[date.getDay()]} ${date.getDate()} ${MONTHS_TH[date.getMonth()]}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#28C76F" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} 
            style={styles.menuButton}
          >
            <Feather name="menu" size={24} color="#2D3436" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>รายงาน</Text>
        </View>
        <TouchableOpacity 
          style={styles.exportButton} 
          onPress={handleExport}
          disabled={exporting || transactions.length === 0}
        >
          {exporting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Feather name="download" size={16} color="#FFF" />
              <Text style={styles.exportButtonText}>CSV</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* View Mode Selector */}
      <View style={styles.modeSelector}>
        {[
          { key: 'daily', label: 'รายวัน', icon: 'calendar' },
          { key: 'monthly', label: 'รายเดือน', icon: 'bar-chart' },
          { key: 'chart', label: 'แผนภูมิ', icon: 'pie-chart' },
        ].map((mode) => (
          <TouchableOpacity
            key={mode.key}
            style={[
              styles.modeButton,
              viewMode === mode.key && styles.modeButtonActive
            ]}
            onPress={() => setViewMode(mode.key as any)}
          >
            <Feather 
              name={mode.icon as any} 
              size={16} 
              color={viewMode === mode.key ? '#FFFFFF' : '#636E72'} 
            />
            <Text style={[
              styles.modeButtonText,
              viewMode === mode.key && styles.modeButtonTextActive
            ]}>
              {mode.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* This Month Summary */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, styles.incomeCard]}>
          <Feather name="trending-up" size={20} color="#28C76F" />
          <Text style={styles.summaryLabel}>รายรับเดือนนี้</Text>
          <Text style={[styles.summaryAmount, { color: '#28C76F' }]}>
            ฿{formatCurrency(thisMonthStats.income)}
          </Text>
        </View>
        
        <View style={[styles.summaryCard, styles.expenseCard]}>
          <Feather name="trending-down" size={20} color="#EA5455" />
          <Text style={styles.summaryLabel}>รายจ่ายเดือนนี้</Text>
          <Text style={[styles.summaryAmount, { color: '#EA5455' }]}>
            ฿{formatCurrency(thisMonthStats.expense)}
          </Text>
        </View>
      </View>

      {/* ================== DAILY VIEW ================== */}
      {viewMode === 'daily' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Feather name="calendar" size={18} /> สรุปรายวัน
          </Text>
          
          {dailySummary.length === 0 ? (
            <View style={styles.emptyCard}>
              <Feather name="inbox" size={40} color="#B0B0B0" />
              <Text style={styles.emptyText}>ยังไม่มีข้อมูลรายการ</Text>
            </View>
          ) : (
            dailySummary.map((day, index) => (
              <View key={index} style={styles.dailyCard}>
                <View style={styles.dailyHeader}>
                  <Text style={styles.dailyDate}>{formatDate(day.date)}</Text>
                  <Text style={[
                    styles.dailyBalance,
                    { color: day.income - day.expense >= 0 ? '#28C76F' : '#EA5455' }
                  ]}>
                    {day.income - day.expense >= 0 ? '+' : ''}฿{formatCurrency(day.income - day.expense)}
                  </Text>
                </View>
                <View style={styles.dailyRow}>
                  <View style={styles.dailyItem}>
                    <View style={[styles.dot, { backgroundColor: '#28C76F' }]} />
                    <Text style={styles.dailyLabel}>รายรับ</Text>
                    <Text style={[styles.dailyValue, { color: '#28C76F' }]}>
                      ฿{formatCurrency(day.income)}
                    </Text>
                  </View>
                  <View style={styles.dailyItem}>
                    <View style={[styles.dot, { backgroundColor: '#EA5455' }]} />
                    <Text style={styles.dailyLabel}>รายจ่าย</Text>
                    <Text style={[styles.dailyValue, { color: '#EA5455' }]}>
                      ฿{formatCurrency(day.expense)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* ================== MONTHLY VIEW ================== */}
      {viewMode === 'monthly' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Feather name="bar-chart" size={18} /> สรุปรายเดือน
          </Text>
          
          {monthlySummary.length === 0 ? (
            <View style={styles.emptyCard}>
              <Feather name="inbox" size={40} color="#B0B0B0" />
              <Text style={styles.emptyText}>ยังไม่มีข้อมูลรายการ</Text>
            </View>
          ) : (
            monthlySummary.map((month, index) => (
              <View key={index} style={styles.monthlyCard}>
                <View style={styles.monthlyHeader}>
                  <Text style={styles.monthlyTitle}>
                    {MONTHS_TH[month.month]} {month.year + 543}
                  </Text>
                  <Text style={[
                    styles.monthlyBalance,
                    { color: month.income - month.expense >= 0 ? '#28C76F' : '#EA5455' }
                  ]}>
                    คงเหลือ: {month.income - month.expense >= 0 ? '+' : ''}฿{formatCurrency(month.income - month.expense)}
                  </Text>
                </View>
                
                <View style={styles.monthlyStats}>
                  <View style={styles.monthlyStatItem}>
                    <Feather name="arrow-up-circle" size={20} color="#28C76F" />
                    <Text style={styles.monthlyStatLabel}>รายรับ</Text>
                    <Text style={[styles.monthlyStatValue, { color: '#28C76F' }]}>
                      ฿{formatCurrency(month.income)}
                    </Text>
                  </View>
                  <View style={styles.monthlyDivider} />
                  <View style={styles.monthlyStatItem}>
                    <Feather name="arrow-down-circle" size={20} color="#EA5455" />
                    <Text style={styles.monthlyStatLabel}>รายจ่าย</Text>
                    <Text style={[styles.monthlyStatValue, { color: '#EA5455' }]}>
                      ฿{formatCurrency(month.expense)}
                    </Text>
                  </View>
                </View>
                
                {/* Progress bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressIncome, 
                        { 
                          flex: month.income || 1,
                        }
                      ]} 
                    />
                    <View 
                      style={[
                        styles.progressExpense, 
                        { 
                          flex: month.expense || 1,
                        }
                      ]} 
                    />
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* ================== CHART VIEW ================== */}
      {viewMode === 'chart' && (
        <>
          {/* 7 Days Chart */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>
              <Feather name="bar-chart-2" size={18} color="#2D3436" /> รายจ่าย 7 วันล่าสุด
            </Text>
            <BarChart
              data={{
                labels: last7DaysData.labels,
                datasets: [{ data: last7DaysData.expenseData.map(d => d || 0) }]
              }}
              width={screenWidth - 64}
              height={180}
              yAxisLabel="฿"
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: '#FFFFFF',
                backgroundGradientFrom: '#FFFFFF',
                backgroundGradientTo: '#FFFFFF',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(234, 84, 85, ${opacity})`,
                labelColor: () => '#636E72',
                barPercentage: 0.6,
              }}
              style={styles.chart}
              fromZero
            />
          </View>

          {/* Monthly Trend Chart */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>
              <Feather name="trending-up" size={18} color="#2D3436" /> แนวโน้ม 6 เดือนล่าสุด
            </Text>
            <LineChart
              data={{
                labels: monthlyChartData.labels,
                datasets: [
                  { data: monthlyChartData.incomeData.map(d => d || 0), color: () => '#28C76F' },
                  { data: monthlyChartData.expenseData.map(d => d || 0), color: () => '#EA5455' },
                ]
              }}
              width={screenWidth - 64}
              height={180}
              chartConfig={{
                backgroundColor: '#FFFFFF',
                backgroundGradientFrom: '#FFFFFF',
                backgroundGradientTo: '#FFFFFF',
                decimalPlaces: 0,
                color: () => '#636E72',
                labelColor: () => '#636E72',
                propsForBackgroundLines: {
                  strokeDasharray: "", // solid line
                  stroke: "#F0F2F5"
                }
              }}
              withInnerLines={true}
              withOuterLines={false}
              withShadow={false}
              withDots={true}
              style={styles.chart}
              bezier
            />
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#28C76F' }]} />
                <Text style={styles.legendText}>รายรับ</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EA5455' }]} />
                <Text style={styles.legendText}>รายจ่าย</Text>
              </View>
            </View>
          </View>

          {/* Category Breakdown (Custom - replaces PieChart) */}
          {expenseByCategory.length > 0 && (
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>
                <Feather name="pie-chart" size={18} color="#2D3436" /> สัดส่วนรายจ่ายเดือนนี้
              </Text>
              {expenseByCategory.map((cat, index) => {
                const total = expenseByCategory.reduce((sum, c) => sum + c.amount, 0);
                const percentage = total > 0 ? Math.round((cat.amount / total) * 100) : 0;
                return (
                  <View key={cat.name} style={styles.categoryRow}>
                    <View style={styles.categoryLeft}>
                      <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                      <Text style={styles.categoryName}>{cat.name}</Text>
                    </View>
                    <View style={styles.categoryRight}>
                      <View style={styles.categoryBarContainer}>
                        <View style={[styles.categoryBar, { width: `${percentage}%`, backgroundColor: cat.color }]} />
                      </View>
                      <Text style={styles.categoryAmount}>฿{cat.amount.toLocaleString()} ({percentage}%)</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  menuButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3436',
    fontFamily: Platform.OS === 'ios' ? 'Thonburi-Bold' : 'Roboto',
  },
  modeSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  modeButtonActive: {
    backgroundColor: '#28C76F',
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#636E72',
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  summaryContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  incomeCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#28C76F',
  },
  expenseCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#EA5455',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#636E72',
    marginTop: 6,
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3436',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Thonburi-Bold' : 'Roboto',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#B0B0B0',
    marginTop: 12,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  // Daily styles
  dailyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  dailyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dailyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3436',
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  dailyBalance: {
    fontSize: 14,
    fontWeight: '700',
  },
  dailyRow: {
    flexDirection: 'row',
    gap: 16,
  },
  dailyItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dailyLabel: {
    fontSize: 12,
    color: '#636E72',
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  dailyValue: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 'auto',
  },
  // Monthly styles
  monthlyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  monthlyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthlyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3436',
    fontFamily: Platform.OS === 'ios' ? 'Thonburi-Bold' : 'Roboto',
  },
  monthlyBalance: {
    fontSize: 13,
    fontWeight: '600',
  },
  monthlyStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthlyStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  monthlyStatLabel: {
    fontSize: 12,
    color: '#636E72',
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  monthlyStatValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  monthlyDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: '#F0F2F5',
  },
  progressIncome: {
    backgroundColor: '#28C76F',
  },
  progressExpense: {
    backgroundColor: '#EA5455',
  },
  // Chart styles
  chartCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  chart: {
    borderRadius: 8,
    marginLeft: -16,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#636E72',
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  // Category breakdown styles
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    fontSize: 14,
    color: '#2D3436',
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  categoryRight: {
    flex: 1.5,
    alignItems: 'flex-end',
    gap: 4,
  },
  categoryBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: '#F0F2F5',
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryBar: {
    height: '100%',
    borderRadius: 3,
  },
  categoryAmount: {
    fontSize: 12,
    color: '#636E72',
    fontWeight: '600',
  },
  headerLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  exportButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: '#28C76F',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  exportButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
});
