import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  getCategoryInfo as getDefaultCategoryInfo,
  Category,
} from '../constants/categories';

/**
 * Hook ดึง Categories จาก Firestore + Fallback ใช้ constants
 */
export const useCategories = () => {
  const [expenseCategories, setExpenseCategories] = useState<Category[]>(EXPENSE_CATEGORIES);
  const [incomeCategories, setIncomeCategories] = useState<Category[]>(INCOME_CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('order', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const expense: Category[] = [];
          const income: Category[] = [];

          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            const cat: Category = {
              id: doc.id,
              label: data.label,
              icon: data.icon,
            };
            if (data.type === 'expense') expense.push(cat);
            else if (data.type === 'income') income.push(cat);
          });

          if (expense.length > 0) setExpenseCategories(expense);
          if (income.length > 0) setIncomeCategories(income);
        }
        // ถ้า Firestore ว่าง → ใช้ constants (default state)
        setLoading(false);
      },
      (error) => {
        console.error('useCategories error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return {
    expenseCategories,
    incomeCategories,
    loading,
    getCategoryInfo: getDefaultCategoryInfo,
  };
};
