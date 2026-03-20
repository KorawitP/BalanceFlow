import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getCategoryInfo } from '../constants/categories';

// =============================================
// ตั้งค่า Notification Handler (แสดงแม้ app อยู่ foreground)
// =============================================
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// =============================================
// 1) ขอ Permission + ตั้งค่า Channel (Android)
// =============================================
export async function registerForNotifications(): Promise<boolean> {
  // ตั้ง channel สำหรับ Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('budget-alerts', {
      name: 'การแจ้งเตือนงบประมาณ',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#28C76F',
    });
  }

  // ขอ permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

// =============================================
// 2) ส่ง Notification เตือนถึง 80%
// =============================================
export async function sendBudgetWarning(categoryLabel: string, percentage: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⚠️ ใกล้ถึงงบประมาณ',
      body: `หมวด "${categoryLabel}" ใช้ไปแล้ว ${percentage}% ของงบที่ตั้งไว้`,
      sound: true,
    },
    trigger: null, // ส่งทันที
  });
}

// =============================================
// 3) ส่ง Notification เตือนเกิน 100%
// =============================================
export async function sendBudgetExceeded(categoryLabel: string, percentage: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🚨 เกินงบประมาณแล้ว!',
      body: `หมวด "${categoryLabel}" ใช้ไปแล้ว ${percentage}% เกินงบที่กำหนด`,
      sound: true,
    },
    trigger: null, // ส่งทันที
  });
}

// =============================================
// 4) ตรวจสอบงบหลังบันทึกรายจ่าย (เรียกจาก add.tsx)
// =============================================


export async function checkBudgetAfterExpense(
  userId: string,
  category: string,
  newAmount: number,
  expenseDate: Date
): Promise<void> {
  try {
    const month = expenseDate.getMonth();
    const year = expenseDate.getFullYear();

    // 1. ดึง budget ของหมวดนี้ในเดือนนี้
    const budgetRef = collection(db, 'users', userId, 'budgets');
    const budgetQuery = query(
      budgetRef,
      where('category', '==', category),
      where('month', '==', month),
      where('year', '==', year)
    );
    const budgetSnap = await getDocs(budgetQuery);

    if (budgetSnap.empty) return; // ไม่ได้ตั้งงบ → ไม่ต้องเตือน

    const budget = budgetSnap.docs[0].data();
    const limitAmount = budget.limitAmount as number;

    // 2. ดึงยอดจ่ายจริงทั้งเดือน (รวมรายการที่เพิ่งบันทึก)
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

    const txRef = collection(db, 'users', userId, 'transactions');
    const txQuery = query(
      txRef,
      where('type', '==', 'expense'),
      where('category', '==', category),
      where('date', '>=', Timestamp.fromDate(startOfMonth)),
      where('date', '<=', Timestamp.fromDate(endOfMonth))
    );
    const txSnap = await getDocs(txQuery);

    let totalSpent = 0;
    txSnap.docs.forEach((doc) => {
      totalSpent += doc.data().amount as number;
    });

    // 3. คำนวณ % และส่ง notification
    const percentage = Math.round((totalSpent / limitAmount) * 100);
    const categoryLabel = getCategoryInfo(category).label;

    if (percentage >= 100) {
      await sendBudgetExceeded(categoryLabel, percentage);
    } else if (percentage >= 80) {
      await sendBudgetWarning(categoryLabel, percentage);
    }
  } catch (error) {
    console.warn('Budget check notification error:', error);
    // ไม่ throw error เพื่อไม่ให้กระทบการบันทึกรายจ่าย
  }
}
