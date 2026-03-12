import * as Notifications from 'expo-notifications';
import { checkBudgetAfterExpense, sendBudgetWarning, sendBudgetExceeded } from '../notificationService';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

// Mock Dependencies
jest.mock('expo-notifications');
jest.mock('../../firebaseConfig', () => ({
  db: {},
}));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  Timestamp: {
    fromDate: jest.fn(),
  },
}));

describe('notificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (collection as jest.Mock).mockReturnValue('mockCollection');
    (query as jest.Mock).mockReturnValue('mockQuery');
  });

  describe('checkBudgetAfterExpense', () => {
    const mockUserId = 'user123';
    const mockCategory = 'Food';
    const mockExpenseDate = new Date('2023-01-15');

    it('should not notify if no budget set', async () => {
      // Mock no budget
      (getDocs as jest.Mock).mockResolvedValueOnce({ empty: true, docs: [] });

      await checkBudgetAfterExpense(mockUserId, mockCategory, 100, mockExpenseDate);

      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it('should notify warning if spent >= 80% but < 100%', async () => {
      // Mock Budget = 1000
      (getDocs as jest.Mock)
        .mockResolvedValueOnce({ // Budget Query Result
          empty: false,
          docs: [{ data: () => ({ limitAmount: 1000 }) }],
        })
        .mockResolvedValueOnce({ // Transactions Query Result
          docs: [
            { data: () => ({ amount: 800 }) }, // Total 800 (80%)
          ],
        });

      await checkBudgetAfterExpense(mockUserId, mockCategory, 0, mockExpenseDate);

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: '⚠️ ใกล้ถึงงบประมาณ',
            body: expect.stringContaining('80%'),
          }),
        })
      );
    });

    it('should notify exceeded if spent >= 100%', async () => {
      // Mock Budget = 1000
      (getDocs as jest.Mock)
        .mockResolvedValueOnce({ // Budget Query Result
          empty: false,
          docs: [{ data: () => ({ limitAmount: 1000 }) }],
        })
        .mockResolvedValueOnce({ // Transactions Query Result
          docs: [
            { data: () => ({ amount: 1050 }) }, // Total 1050 (105%)
          ],
        });

      await checkBudgetAfterExpense(mockUserId, mockCategory, 0, mockExpenseDate);

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: '🚨 เกินงบประมาณแล้ว!',
            body: expect.stringContaining('105%'),
          }),
        })
      );
    });

    it('should not notify if spent < 80%', async () => {
      // Mock Budget = 1000
      (getDocs as jest.Mock)
        .mockResolvedValueOnce({ // Budget Query Result
          empty: false,
          docs: [{ data: () => ({ limitAmount: 1000 }) }],
        })
        .mockResolvedValueOnce({ // Transactions Query Result
          docs: [
            { data: () => ({ amount: 500 }) }, // Total 500 (50%)
          ],
        });

      await checkBudgetAfterExpense(mockUserId, mockCategory, 0, mockExpenseDate);

      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });
  });
});
