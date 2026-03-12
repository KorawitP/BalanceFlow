import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import { generateCSV, exportAndShareCSV } from '../exportService';

// Mock dependencies
jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file:///cache/',
  writeAsStringAsync: jest.fn(),
  EncodingType: { UTF8: 'utf8' },
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

jest.spyOn(Alert, 'alert');

describe('exportService', () => {
  const mockTransactions = [
    {
      id: '1',
      title: 'Lunch',
      amount: 100,
      type: 'expense' as const,
      category: 'Food',
      date: new Date('2023-01-01T12:00:00Z'), // Mock date object directly for simplicity or mock Firestore timestamp
    },
    {
      id: '2',
      title: 'Salary',
      amount: 50000,
      type: 'income' as const,
      category: 'Salary',
      date: { toDate: () => new Date('2023-01-25T09:00:00Z') }, // Mock Firestore Timestamp
    },
  ];

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateCSV', () => {
    it('should generate correct CSV string with BOM', () => {
      const csv = generateCSV(mockTransactions as any);
      
      const lines = csv.split('\n');
      expect(lines[0]).toContain('วันที่,ชื่อรายการ,ประเภท,หมวดหมู่,จำนวนเงิน');
      
      // Check BOM
      expect(csv.charCodeAt(0)).toBe(0xFEFF);

      // Check Content Row 1 (Expense)
      expect(lines[1]).toContain('Lunch');
      expect(lines[1]).toContain('รายจ่าย');
      expect(lines[1]).toContain('-100.00');

      // Check Content Row 2 (Income)
      expect(lines[2]).toContain('Salary');
      expect(lines[2]).toContain('รายรับ');
      expect(lines[2]).toContain('50000.00');
    });

    it('should handle special characters in title', () => {
      const specialTx = [{
        ...mockTransactions[0],
        title: 'Lunch "Special"',
      }];
      const csv = generateCSV(specialTx as any);
      expect(csv).toContain('"Lunch ""Special"""');
    });
  });

  describe('exportAndShareCSV', () => {
    it('should alert if no transactions', async () => {
      await exportAndShareCSV([]);
      expect(Alert.alert).toHaveBeenCalledWith('ไม่มีข้อมูล', 'ไม่มีรายการที่จะส่งออก');
      expect(FileSystem.writeAsStringAsync).not.toHaveBeenCalled();
    });

    it('should write file and share if sharing is available (Native)', async () => {
      // Force Platform.OS to 'ios' for this test
      Platform.OS = 'ios';
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);

      await exportAndShareCSV(mockTransactions as any);

      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        expect.stringContaining('BalanceFlow_'),
        expect.any(String),
        expect.objectContaining({ encoding: 'utf8' })
      );
      expect(Sharing.shareAsync).toHaveBeenCalledWith(
        expect.stringContaining('file:///cache/'),
        expect.objectContaining({ mimeType: 'text/csv' })
      );
    });

    it('should alert if sharing is not available (Native)', async () => {
      Platform.OS = 'ios';
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);

      await exportAndShareCSV(mockTransactions as any);

      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith('ไม่รองรับ', 'อุปกรณ์นี้ไม่รองรับการแชร์ไฟล์');
      expect(Sharing.shareAsync).not.toHaveBeenCalled();
    });

    it('should use DOM download on Web', async () => {
      // Mock Platform.OS to 'web'
      Platform.OS = 'web';

      // Mock DOM APIs
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
      };
      const mockCreateElement = jest.fn().mockReturnValue(mockLink);
      const mockAppendChild = jest.fn();
      const mockRemoveChild = jest.fn();
      const mockCreateObjectURL = jest.fn().mockReturnValue('blob:url');
      const mockRevokeObjectURL = jest.fn();

      // @ts-ignore
      global.document = {
        createElement: mockCreateElement,
        body: {
          appendChild: mockAppendChild,
          removeChild: mockRemoveChild,
        },
      };
      // @ts-ignore
      global.URL = {
        createObjectURL: mockCreateObjectURL,
        revokeObjectURL: mockRevokeObjectURL,
      };
      // @ts-ignore
      global.Blob = jest.fn(() => ({}));

      await exportAndShareCSV(mockTransactions as any);

      expect(global.Blob).toHaveBeenCalled();
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.download).toContain('.csv');
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(mockLink.click).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();

      // Ensure native methods are NOT called
      expect(FileSystem.writeAsStringAsync).not.toHaveBeenCalled();
      expect(Sharing.shareAsync).not.toHaveBeenCalled();
    });
  });
});
