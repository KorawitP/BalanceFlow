import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from './useAuth';

export interface Budget {
  id: string;
  category: string;
  limitAmount: number;
  month: number;
  year: number;
  createdAt: Timestamp;
}

export interface BudgetWithSpent extends Budget {
  spentAmount: number;
  percentage: number;
}

export function useBudget() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetsWithSpent, setBudgetsWithSpent] = useState<BudgetWithSpent[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // ============================
  // 1) Realtime listener: budgets ของเดือนปัจจุบัน
  // ============================
  useEffect(() => {
    if (!user) return;

    const budgetRef = collection(db, 'users', user.uid, 'budgets');
    const q = query(
      budgetRef,
      where('month', '==', currentMonth),
      where('year', '==', currentYear)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Budget[];
      setBudgets(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, currentMonth, currentYear]);

  // ============================
  // 2) คำนวณยอดใช้ไปจริงของแต่ละหมวดหมู่
  // ============================
  const calculateSpent = useCallback(async () => {
    if (!user || budgets.length === 0) {
      setBudgetsWithSpent([]);
      return;
    }

    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    const txRef = collection(db, 'users', user.uid, 'transactions');
    const txQuery = query(
      txRef,
      where('type', '==', 'expense'),
      where('date', '>=', Timestamp.fromDate(startOfMonth)),
      where('date', '<=', Timestamp.fromDate(endOfMonth))
    );

    const txSnapshot = await getDocs(txQuery);

    // รวมยอดตามหมวดหมู่
    const spentMap: Record<string, number> = {};
    txSnapshot.docs.forEach((d) => {
      const data = d.data();
      const cat = data.category as string;
      spentMap[cat] = (spentMap[cat] || 0) + (data.amount as number);
    });

    // ผูกกับ budget
    const result: BudgetWithSpent[] = budgets.map((b) => {
      const spent = spentMap[b.category] || 0;
      const pct = b.limitAmount > 0 ? Math.round((spent / b.limitAmount) * 100) : 0;
      return { ...b, spentAmount: spent, percentage: pct };
    });

    setBudgetsWithSpent(result);
  }, [user, budgets, currentMonth, currentYear]);

  useEffect(() => {
    calculateSpent();
  }, [calculateSpent]);

  // ============================
  // 3) บันทึก / อัพเดต budget (upsert by category)
  // ============================
  const saveBudget = async (category: string, limitAmount: number) => {
    if (!user) return;

    const budgetRef = collection(db, 'users', user.uid, 'budgets');

    // ตรวจว่ามี budget ของหมวดนี้ในเดือนนี้อยู่แล้วหรือไม่
    const existing = budgets.find(
      (b) => b.category === category && b.month === currentMonth && b.year === currentYear
    );

    if (existing) {
      // อัพเดตวงเงิน
      const docRef = doc(db, 'users', user.uid, 'budgets', existing.id);
      await updateDoc(docRef, { limitAmount });
    } else {
      // สร้างใหม่
      await addDoc(budgetRef, {
        category,
        limitAmount,
        month: currentMonth,
        year: currentYear,
        createdAt: Timestamp.now(),
      });
    }
  };

  // ============================
  // 4) ลบ budget
  // ============================
  const removeBudget = async (budgetId: string) => {
    if (!user) return;
    const docRef = doc(db, 'users', user.uid, 'budgets', budgetId);
    await deleteDoc(docRef);
  };

  return {
    budgets,
    budgetsWithSpent,
    loading,
    saveBudget,
    removeBudget,
    refreshSpent: calculateSpent,
  };
}
