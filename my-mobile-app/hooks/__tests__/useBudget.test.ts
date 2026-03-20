import { renderHook, waitFor } from '@testing-library/react-native';
import { useBudget } from '../useBudget';
import { useAuth } from '../useAuth';
import { 
  collection, query, where, onSnapshot, getDocs, Timestamp 
} from 'firebase/firestore';

// Mock Dependencies
jest.mock('../useAuth');
jest.mock('../../firebaseConfig', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  Timestamp: {
    fromDate: jest.fn(),
    now: jest.fn(),
  },
}));

describe('useBudget', () => {
  const mockUser = { uid: 'user123' };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (collection as jest.Mock).mockReturnValue('mockCollection');
    (query as jest.Mock).mockReturnValue('mockQuery');
  });

  it('should return empty list if user is null', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null });
    const { result } = renderHook(() => useBudget());
    expect(result.current.budgets).toEqual([]);
    // user=null → setLoading(false) is called → loading should be false
    expect(result.current.loading).toBe(false);
  });

  it('should fetch budgets and calculate spent correctly', async () => {
    // 1. Mock onSnapshot for budgets
    // ใช้เดือน/ปีปัจจุบันเพื่อให้ผ่าน filter ใน useBudget hook
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const mockBudgets = [
      { id: 'b1', category: 'Food', limitAmount: 1000, month: currentMonth, year: currentYear },
      { id: 'b2', category: 'Transport', limitAmount: 500, month: currentMonth, year: currentYear },
    ];

    (onSnapshot as jest.Mock).mockImplementation((q, callback) => {
      callback({
        docs: mockBudgets.map(b => ({
          id: b.id,
          data: () => b,
        })),
      });
      return jest.fn(); // unsubscribe
    });

    // 2. Mock getDocs for transactions (calculateSpent)
    const mockTransactions = [
      { type: 'expense', category: 'Food', amount: 200 },
      { type: 'expense', category: 'Food', amount: 50 },
      { type: 'expense', category: 'Transport', amount: 100 },
    ];

    (getDocs as jest.Mock).mockResolvedValue({
      docs: mockTransactions.map(t => ({
        data: () => t,
      })),
    });

    const { result } = renderHook(() => useBudget());

    // Wait for async updates
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.budgets).toHaveLength(2);
    });

    // Verify calculated spent
    await waitFor(() => {
      expect(result.current.budgetsWithSpent).toHaveLength(2);
    });

    const foodBudget = result.current.budgetsWithSpent.find(b => b.category === 'Food');
    expect(foodBudget?.spentAmount).toBe(250); // 200 + 50
    expect(foodBudget?.percentage).toBe(25);   // (250/1000)*100

    const transportBudget = result.current.budgetsWithSpent.find(b => b.category === 'Transport');
    expect(transportBudget?.spentAmount).toBe(100);
    expect(transportBudget?.percentage).toBe(20);  // (100/500)*100
  });
});
