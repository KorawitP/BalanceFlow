/**
 * Categories Constants
 * รวม categories ไว้ที่เดียว — ไม่ต้อง hardcode ซ้ำทุกไฟล์
 */

export interface Category {
  id: string;
  label: string;
  icon: string;
}

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'Food', label: 'อาหาร', icon: 'coffee' },
  { id: 'Transport', label: 'เดินทาง', icon: 'truck' },
  { id: 'Shopping', label: 'ช้อปปิ้ง', icon: 'shopping-bag' },
  { id: 'Entertainment', label: 'บันเทิง', icon: 'film' },
  { id: 'Bills', label: 'บิล/ค่าน้ำไฟ', icon: 'file-text' },
  { id: 'Health', label: 'สุขภาพ', icon: 'activity' },
  { id: 'Other', label: 'อื่นๆ', icon: 'grid' },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: 'Salary', label: 'เงินเดือน', icon: 'briefcase' },
  { id: 'Freelance', label: 'ฟรีแลนซ์', icon: 'monitor' },
  { id: 'Gift', label: 'ของขวัญ', icon: 'gift' },
  { id: 'Investment', label: 'การลงทุน', icon: 'trending-up' },
  { id: 'Other', label: 'อื่นๆ', icon: 'grid' },
];

/**
 * หา category info จาก id — ค้นทั้ง expense + income
 */
export const getCategoryInfo = (categoryId: string): Category => {
  const all = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
  return all.find((c) => c.id === categoryId) || { id: categoryId, label: categoryId, icon: 'grid' };
};
