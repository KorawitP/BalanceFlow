# แผนการพัฒนา App รายรับ-รายจ่าย (Money Tracker) พร้อมฟีเจอร์เสริม

เอกสารนี้จะอธิบายขั้นตอนการสร้างแอพพลิเคชันบันทึกรายรับ-รายจ่าย โดยเน้นฟังก์ชัน **CRUD** และ **ฟีเจอร์สำคัญ** (Date Picker, Categories, Formatting)

## 1. ฟีเจอร์หลัก (Features)

1.  **ระบบสมาชิก (Authentication):**
    - เข้าสู่ระบบ (Login)
    - ลงทะเบียน (Register)
    - ข้อมูลรายการรับ-จ่าย จะแยกเก็บตาม User ID ของใครของมัน

2.  **ระบบจัดการรายการ (Transaction CRUD):**
    - **C - Create:** สร้างบันทึก รายรับ/รายจ่าย ใหม่
    - **R - Read:** ดูรายการย้อนหลัง (History List)
    - **U - Update:** แก้ไขรายการที่บันทึกไปแล้ว
    - **D - Delete:** ลบรายการทิ้ง

3.  **ฟีเจอร์เสริม (Enhancements):**
    - **📅 เลือกวันที่ย้อนหลัง (Date Picker):** สามารถบันทึกรายการของเมื่อวาน หรือวันที่ผ่านมาได้
    - **💰 จัดรูปแบบตัวเลข (Currency Formatting):** แสดงผลมีลูกน้ำ (1,000.00) ให้อ่านง่าย
    - **🏷️ หมวดหมู่ (Categories):** ระบุประเภทค่าใช้จ่าย (อาหาร, เดินทาง, ช้อปปิ้ง, ฯลฯ)

---

## 2. โครงสร้างข้อมูล (Database Schema)

ใช้ **Cloud Firestore** เก็บข้อมูล `users/{userId}/transactions`

**Document Structure Update:**

```json
{
  "id": "auto-generated-id",
  "title": "ค่าข้าวกลางวัน",
  "amount": 50,
  "type": "expense", // 'income' | 'expense'
  "category": "Food", // NEW: หมวดหมู่ (Food, Transport, Salary, Other)
  "date": "Timestamp", // NEW: วันที่ของรายการ (ที่ผู้ใช้เลือก)
  "createdAt": "Timestamp", // System timestamp (วันที่กดบันทึกจริง)
  "updatedAt": "Timestamp" // เวลาที่แก้ไขล่าสุด
}
```

---

## 3. ขั้นตอนการพัฒนา (Step-by-Step)

### Phase 1: Authentication (ระบบล็อกอิน)

1.  สร้าง `hooks/useAuth.ts` เพื่อดึงสถานะ User ปัจจุบัน
2.  สร้างหน้า `app/auth/login.tsx` (Login)
3.  สร้างหน้า `app/auth/register.tsx` (Register)
4.  ตั้งค่า `app/_layout.tsx` (Protected Routes)

### Phase 2: Main App (หน้าหลัก & CRUD)

1.  **หน้าแสดงผลรวมและลิสต์ (Index)**
    - แสดงยอดเงินคงเหลือ (Total Balance) แบบมีลูกน้ำ (Comma)
    - List รายการ: แสดงชื่อ, จำนวนเงิน, **หมวดหมู่**, และ **วันที่**

2.  **การสร้าง/แก้ไข รายการ (Create/Update)**
    - **Category Input:** ปุ่มเลือกหมวดหมู่แบบ Chips (เช่น [อาหาร], [เดินทาง]) แทนการพิมพ์
    - **Date Input:** ใช้ `DateTimePicker` ให้ผู้ใช้เลือกวันได้ (Default = วันนี้)
    - **Amount Input:** ช่องกรอกตัวเลข

3.  **Logic & Formatting**
    - ใช้ `num.toLocaleString()` สำหรับแสดงผลตัวเลข
    - Query Firestore โดยเรียงตาม field `date` แทน `createdAt` เพื่อให้เรียงตามปฏิทินจริง

---

## 4. ตัวอย่าง Code Snippets

### 4.1 การจัดรูปแบบเงิน

```typescript
const formatMoney = (amount: number) => {
  return amount.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
// ผลลัพธ์: "1,500.00"
```

### 4.2 การบันทึกพร้อมวันที่และหมวดหมู่

```typescript
await addDoc(collection(db, "users", uid, "transactions"), {
  title: text,
  amount: parseFloat(amount),
  type: "expense",
  category: selectedCategory, // "Food"
  date: selectedDate, // Date Object จาก Picker
  createdAt: new Date(),
});
```
