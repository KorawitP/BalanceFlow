import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';

/**
 * Seed default categories ลง Firestore (เรียกครั้งเดียวตอน user login ถ้ายังไม่มี data)
 */
export const seedDefaultCategories = async (): Promise<void> => {
  try {
    // ตรวจว่ามี category แรกอยู่แล้วหรือยัง
    const firstDoc = await getDoc(doc(db, 'categories', 'Food'));
    if (firstDoc.exists()) return; // มีแล้ว ไม่ต้อง seed ซ้ำ

    // Seed expense categories
    for (let i = 0; i < EXPENSE_CATEGORIES.length; i++) {
      const cat = EXPENSE_CATEGORIES[i];
      await setDoc(doc(db, 'categories', cat.id), {
        label: cat.label,
        icon: cat.icon,
        type: 'expense',
        order: i,
      });
    }

    // Seed income categories
    for (let i = 0; i < INCOME_CATEGORIES.length; i++) {
      const cat = INCOME_CATEGORIES[i];
      // Income 'Other' ซ้ำ id กับ expense — ใช้ prefix
      const docId = cat.id === 'Other' ? 'Other_Income' : cat.id;
      await setDoc(doc(db, 'categories', docId), {
        label: cat.label,
        icon: cat.icon,
        type: 'income',
        order: i,
      });
    }

    console.log('✅ Default categories seeded successfully');
  } catch (error) {
    console.error('Seed categories error:', error);
  }
};
