import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AddTransactionScreen from '../add';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { checkBudgetAfterExpense } from '../../../services/notificationService';
import { useRouter } from 'expo-router';

// Mock Dependencies
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
  }),
  useLocalSearchParams: () => ({ type: 'expense' }),
}));

jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn(() => 'mockCollectionRef'),
  Timestamp: {
    fromDate: jest.fn(() => 'mockTimestamp'),
    now: jest.fn(() => 'mockTimestamp'),
  },
}));

jest.mock('../../../firebaseConfig', () => ({
  db: {},
}));

jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'user123' } }),
}));

jest.mock('../../../services/notificationService', () => ({
  checkBudgetAfterExpense: jest.fn(),
}));

jest.mock('../../../constants/categories', () => ({
  EXPENSE_CATEGORIES: [
    { id: 'Food', label: 'อาหาร', icon: 'coffee' },
    { id: 'Transport', label: 'เดินทาง', icon: 'map' },
  ],
  INCOME_CATEGORIES: [
    { id: 'Salary', label: 'เงินเดือน', icon: 'dollar-sign' },
  ],
}));

jest.mock('@expo/vector-icons', () => ({
  Feather: 'Feather',
}));

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('AddTransactionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly for expense', () => {
    const { getByText, getByPlaceholderText } = render(<AddTransactionScreen />);
    
    expect(getByText('รายจ่ายใหม่')).toBeTruthy();
    expect(getByPlaceholderText('0.00')).toBeTruthy();
    expect(getByPlaceholderText('บันทึกรายละเอียด...')).toBeTruthy();
    expect(getByText('บันทึกรายการ')).toBeTruthy();
  });

  it('validates input before saving', () => {
    const { getByText } = render(<AddTransactionScreen />);
    
    fireEvent.press(getByText('บันทึกรายการ'));
    
    expect(Alert.alert).toHaveBeenCalledWith('ผิดพลาด', 'กรุณาระบุจำนวนเงินที่ถูกต้อง');
  });

  it('saves transaction and checks budget', async () => {
    const { getByText, getByPlaceholderText } = render(<AddTransactionScreen />);
    
    // Fill Amount
    fireEvent.changeText(getByPlaceholderText('0.00'), '100');
    
    // Fill Title
    fireEvent.changeText(getByPlaceholderText('บันทึกรายละเอียด...'), 'Lunch');
    
    // Select Category (Food)
    fireEvent.press(getByText('อาหาร'));
    
    // Save
    fireEvent.press(getByText('บันทึกรายการ'));

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          amount: 100,
          title: 'Lunch',
          category: 'Food',
          type: 'expense',
        })
      );
      
      expect(checkBudgetAfterExpense).toHaveBeenCalledWith(
        'user123',
        'Food',
        100,
        expect.any(Date)
      );
      
      expect(mockBack).toHaveBeenCalled();
    });
  });
});
