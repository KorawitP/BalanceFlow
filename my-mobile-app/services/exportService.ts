import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

interface ExportTransaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: any; // Firestore Timestamp
}

/**
 * แปลง Firestore Timestamp เป็นวันที่ไทย
 */
const formatDate = (date: any): string => {
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

/**
 * แปลง transactions เป็น CSV string พร้อม UTF-8 BOM (รองรับภาษาไทยใน Excel)
 */
export const generateCSV = (transactions: ExportTransaction[]): string => {
  const BOM = '\uFEFF'; // UTF-8 BOM สำหรับ Excel
  const header = 'วันที่,ชื่อรายการ,ประเภท,หมวดหมู่,จำนวนเงิน';
  
  const rows = transactions.map(t => {
    const date = formatDate(t.date);
    const title = `"${t.title.replace(/"/g, '""')}"`;
    const type = t.type === 'income' ? 'รายรับ' : 'รายจ่าย';
    const category = `"${t.category}"`;
    const amount = t.type === 'income' ? t.amount.toFixed(2) : `-${t.amount.toFixed(2)}`;
    return `${date},${title},${type},${category},${amount}`;
  });

  return BOM + header + '\n' + rows.join('\n');
};

/**
 * สร้างไฟล์ CSV และเปิด Share Sheet (Native) หรือ Download (Web)
 */
export const exportAndShareCSV = async (transactions: ExportTransaction[]): Promise<void> => {
  try {
    if (transactions.length === 0) {
      Alert.alert('ไม่มีข้อมูล', 'ไม่มีรายการที่จะส่งออก');
      return;
    }

    const csvContent = generateCSV(transactions);
    const now = new Date();
    const fileName = `BalanceFlow_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}.csv`;

    if (Platform.OS === 'web') {
      // สำหรับ Web: สร้าง Blob และ Download Link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // สำหรับ iOS/Android: ใช้ Expo FileSystem และ Sharing
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;

      // เขียนไฟล์ CSV
      await FileSystem.writeAsStringAsync(filePath, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // ตรวจสอบว่า device รองรับ Sharing หรือไม่
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('ไม่รองรับ', 'อุปกรณ์นี้ไม่รองรับการแชร์ไฟล์');
        return;
      }

      // เปิด Share Sheet
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: 'ส่งออกข้อมูล BalanceFlow',
        UTI: 'public.comma-separated-values-text',
      });
    }
  } catch (error) {
    console.error('Export CSV Error:', error);
    Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถส่งออกไฟล์ CSV ได้');
  }
};
