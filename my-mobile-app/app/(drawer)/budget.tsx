import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Platform,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useBudget, BudgetWithSpent } from '../../hooks/useBudget';

// ใช้ชุดหมวดหมู่เดียวกับ add.tsx
const EXPENSE_CATEGORIES = [
  { id: 'Food', label: 'อาหาร', icon: 'coffee' },
  { id: 'Transport', label: 'เดินทาง', icon: 'truck' },
  { id: 'Shopping', label: 'ช้อปปิ้ง', icon: 'shopping-bag' },
  { id: 'Entertainment', label: 'บันเทิง', icon: 'film' },
  { id: 'Bills', label: 'บิล/ค่าน้ำไฟ', icon: 'file-text' },
  { id: 'Health', label: 'สุขภาพ', icon: 'activity' },
  { id: 'Other', label: 'อื่นๆ', icon: 'grid' },
];

const MONTHS_TH = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const getCategoryInfo = (categoryId: string) => {
  return EXPENSE_CATEGORIES.find((c) => c.id === categoryId) || { id: categoryId, label: categoryId, icon: 'grid' };
};

const getProgressColor = (percentage: number) => {
  if (percentage >= 100) return '#FF4D4D';
  if (percentage >= 80) return '#FF9F43';
  return '#28C76F';
};

const formatMoney = (amount: number) => {
  return amount.toLocaleString('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

export default function BudgetScreen() {
  const navigation = useNavigation();
  const { budgetsWithSpent, loading, saveBudget, removeBudget } = useBudget();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithSpent | null>(null);

  const now = new Date();

  // สรุปยอดรวม
  const totalBudget = budgetsWithSpent.reduce((s, b) => s + b.limitAmount, 0);
  const totalSpent = budgetsWithSpent.reduce((s, b) => s + b.spentAmount, 0);
  const overallPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // หมวดหมู่ที่ยังไม่ได้ตั้งงบ
  const usedCategories = budgetsWithSpent.map((b) => b.category);
  const availableCategories = EXPENSE_CATEGORIES.filter((c) => !usedCategories.includes(c.id));

  const openAddModal = () => {
    setEditingBudget(null);
    setSelectedCategory('');
    setAmountInput('');
    setModalVisible(true);
  };

  const openEditModal = (budget: BudgetWithSpent) => {
    setEditingBudget(budget);
    setSelectedCategory(budget.category);
    setAmountInput(budget.limitAmount.toString());
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!selectedCategory) {
      Alert.alert('ผิดพลาด', 'กรุณาเลือกหมวดหมู่');
      return;
    }
    const amount = parseFloat(amountInput);
    if (!amountInput || isNaN(amount) || amount <= 0) {
      Alert.alert('ผิดพลาด', 'กรุณาระบุวงเงินที่ถูกต้อง');
      return;
    }

    setSaving(true);
    try {
      await saveBudget(selectedCategory, amount);
      setModalVisible(false);
    } catch (err) {
      Alert.alert('ผิดพลาด', 'บันทึกงบประมาณไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (budget: BudgetWithSpent) => {
    const catInfo = getCategoryInfo(budget.category);
    Alert.alert(
      'ลบงบประมาณ',
      `ต้องการลบงบประมาณ "${catInfo.label}" หรือไม่?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: () => removeBudget(budget.id),
        },
      ]
    );
  };

  const renderBudgetItem = useCallback(({ item }: { item: BudgetWithSpent }) => {
    const catInfo = getCategoryInfo(item.category);
    const progressColor = getProgressColor(item.percentage);
    const progressWidth = Math.min(item.percentage, 100);

    return (
      <TouchableOpacity style={styles.budgetCard} onPress={() => openEditModal(item)} onLongPress={() => handleDelete(item)}>
        <View style={styles.budgetHeader}>
          <View style={styles.budgetLeft}>
            <View style={[styles.categoryIcon, { backgroundColor: `${progressColor}15` }]}>
              <Feather name={catInfo.icon as any} size={20} color={progressColor} />
            </View>
            <View>
              <Text style={styles.categoryLabel}>{catInfo.label}</Text>
              <Text style={styles.budgetMeta}>
                ฿{formatMoney(item.spentAmount)} / ฿{formatMoney(item.limitAmount)}
              </Text>
            </View>
          </View>
          <View style={styles.budgetRight}>
            <Text style={[styles.percentageText, { color: progressColor }]}>
              {item.percentage}%
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progressWidth}%`, backgroundColor: progressColor },
            ]}
          />
        </View>

        {item.percentage >= 80 && (
          <View style={[styles.warningBadge, { backgroundColor: `${progressColor}15` }]}>
            <Feather name={item.percentage >= 100 ? 'alert-circle' : 'alert-triangle'} size={14} color={progressColor} />
            <Text style={[styles.warningText, { color: progressColor }]}>
              {item.percentage >= 100 ? 'เกินงบประมาณแล้ว!' : 'ใกล้ถึงงบประมาณ'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#28C76F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
            style={styles.menuButton}
          >
            <Feather name="menu" size={24} color="#2D3436" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>งบประมาณ</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {MONTHS_TH[now.getMonth()]} {now.getFullYear() + 543}
        </Text>
      </View>

      {/* Overall Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>งบรวม</Text>
            <Text style={styles.summaryValue}>฿{formatMoney(totalBudget)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>ใช้ไปแล้ว</Text>
            <Text style={[styles.summaryValue, { color: getProgressColor(overallPercentage) }]}>
              ฿{formatMoney(totalSpent)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>คงเหลือ</Text>
            <Text style={[styles.summaryValue, { color: totalBudget - totalSpent >= 0 ? '#28C76F' : '#FF4D4D' }]}>
              ฿{formatMoney(totalBudget - totalSpent)}
            </Text>
          </View>
        </View>

        {/* Overall Progress */}
        <View style={styles.overallProgress}>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(overallPercentage, 100)}%`, backgroundColor: getProgressColor(overallPercentage) },
              ]}
            />
          </View>
          <Text style={[styles.overallPercentText, { color: getProgressColor(overallPercentage) }]}>
            {overallPercentage}%
          </Text>
        </View>
      </View>

      {/* Budget List */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>รายหมวดหมู่</Text>
        <Text style={styles.sectionHint}>แตะเพื่อแก้ไข • กดค้างเพื่อลบ</Text>
      </View>

      {budgetsWithSpent.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="target" size={48} color="#E2E8F0" />
          <Text style={styles.emptyTitle}>ยังไม่ได้ตั้งงบประมาณ</Text>
          <Text style={styles.emptySubtitle}>กดปุ่ม + เพื่อเริ่มตั้งงบประมาณรายหมวดหมู่</Text>
        </View>
      ) : (
        <FlatList
          data={budgetsWithSpent}
          renderItem={renderBudgetItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      {availableCategories.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={openAddModal}>
          <Feather name="plus" size={24} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* ===================== ADD/EDIT MODAL ===================== */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingBudget ? 'แก้ไขงบประมาณ' : 'ตั้งงบประมาณใหม่'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color="#636E72" />
              </TouchableOpacity>
            </View>

            {/* Category Selector (ซ่อนตอน Edit) */}
            {!editingBudget && (
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>เลือกหมวดหมู่</Text>
                <View style={styles.categoryGrid}>
                  {availableCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryChip,
                        selectedCategory === cat.id && styles.categoryChipActive,
                      ]}
                      onPress={() => setSelectedCategory(cat.id)}
                    >
                      <Feather
                        name={cat.icon as any}
                        size={18}
                        color={selectedCategory === cat.id ? '#FFF' : '#636E72'}
                      />
                      <Text
                        style={[
                          styles.categoryChipText,
                          selectedCategory === cat.id && styles.categoryChipTextActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {editingBudget && (
              <View style={styles.editingCategoryInfo}>
                <Feather name={getCategoryInfo(editingBudget.category).icon as any} size={20} color="#28C76F" />
                <Text style={styles.editingCategoryText}>{getCategoryInfo(editingBudget.category).label}</Text>
              </View>
            )}

            {/* Amount Input */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>วงเงินสูงสุด (บาท)</Text>
              <View style={styles.amountInputRow}>
                <Text style={styles.amountPrefix}>฿</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amountInput}
                  onChangeText={setAmountInput}
                  placeholder="0"
                  placeholderTextColor="#B0B0B0"
                  keyboardType="numeric"
                  autoFocus
                />
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {editingBudget ? 'อัพเดตงบประมาณ' : 'บันทึกงบประมาณ'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ===================== STYLES =====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTop: {
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
  headerSubtitle: {
    fontSize: 14,
    color: '#636E72',
    marginTop: 4,
    marginLeft: 52,
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  // Summary Card
  summaryCard: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E2E8F0',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#636E72',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3436',
  },
  overallProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  overallPercentText: {
    fontSize: 14,
    fontWeight: '700',
    width: 45,
    textAlign: 'right',
  },
  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
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
  // Budget Card
  budgetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3436',
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  budgetMeta: {
    fontSize: 12,
    color: '#636E72',
    marginTop: 2,
  },
  budgetRight: {
    alignItems: 'flex-end',
  },
  percentageText: {
    fontSize: 20,
    fontWeight: '700',
  },
  // Progress Bar
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#F0F2F5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  // Warning
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
    marginTop: 16,
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#636E72',
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  listContent: {
    paddingBottom: 100,
  },
  // FAB
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#28C76F',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#28C76F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3436',
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  modalSection: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  // Category Grid in Modal
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipActive: {
    backgroundColor: '#28C76F',
    borderColor: '#28C76F',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#636E72',
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  editingCategoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#E6F9EF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  editingCategoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28C76F',
    fontFamily: Platform.OS === 'ios' ? 'Thonburi' : 'Roboto',
  },
  // Amount Input in Modal
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  amountPrefix: {
    fontSize: 24,
    fontWeight: '600',
    color: '#636E72',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3436',
    paddingVertical: 14,
  },
  // Save Button
  saveButton: {
    backgroundColor: '#28C76F',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#28C76F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
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
