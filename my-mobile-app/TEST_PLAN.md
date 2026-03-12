# Test Plan & Cases (แผนการทดสอบ)

เอกสารนี้รวบรวมกรณีการทดสอบ (Test Cases) ทั้งหมดสำหรับแอปพลิเคชัน BalanceFlow ครอบคลุม Unit Test, Component Test และ System/Integration Test

## 1. Unit Tests (Business Logic & Services)

### 1.1 Services
#### `exportService.ts`
- [ ] **generateCSV**:
  - **Case 1**: สร้าง CSV จากรายการธุรกรรมที่มีข้อมูลครบถ้วน (ภาษาไทย) ต้องได้ไฟล์ที่มี BOM และ Encoding ถูกต้อง
  - **Case 2**: สร้าง CSV จากรายการว่าง ต้องได้ Header อย่างเดียว
  - **Case 3**: ตรวจสอบ Format วันที่และตัวเลขใน CSV

#### `notificationService.ts`
- [ ] **checkBudgetAfterExpense**:
  - **Case 1**: รายจ่ายรวม < 80% ของงบประมาณ -> ไม่ส่งแจ้งเตือน
  - **Case 2**: รายจ่ายรวม >= 80% แต่ < 100% -> ส่งแจ้งเตือนระดับ "Warning"
  - **Case 3**: รายจ่ายรวม >= 100% -> ส่งแจ้งเตือนระดับ "Danger" (Over Budget)
  - **Case 4**: ไม่มีงบประมาณตั้งไว้ -> ไม่ส่งแจ้งเตือน

### 1.2 Hooks
#### `useAuth`
- [ ] **Initial State**: ค่าเริ่มต้น user เป็น null, isLoading เป็น true
- [ ] **Login Success**: เมื่อ login สำเร็จ user ต้องมีค่า, isLoading เป็น false
- [ ] **Login Failure**: เมื่อ login พลาด user เป็น null, มี error message
- [ ] **Logout**: เมื่อ logout user ต้องเป็น null

#### `useBudget`
- [ ] **calculateSpent**: คำนวณยอดใช้จ่ายรวมแยกตามหมวดหมู่ได้ถูกต้อง
- [ ] **getBudgetStatus**: คืนค่าสถานะ (Normal, Warning, Over) ได้ถูกต้องตาม % การใช้จ่าย

## 2. Component Tests (UI & Interaction)

### 2.1 Authentication
#### `LoginScreen` (`app/auth/login.tsx`)
- [ ] **Render**: แสดง Form (Email, Password) และปุ่ม Login
- [ ] **Validation**: กด Login โดยไม่กรอกข้อมูล ต้องแสดง Error
- [ ] **Interaction**: กรอกข้อมูลและกด Login ต้องเรียกฟังก์ชัน login จาก AuthContext

#### `RegisterScreen` (`app/auth/register.tsx`)
- [ ] **Render**: แสดง Form ครบถ้วน (Email, Password, Confirm Password)
- [ ] **Validation**: Password ไม่ตรงกับ Confirm Password ต้องแจ้งเตือน

### 2.2 Transaction
#### `TransactionItem` (`components/TransactionItem.tsx`)
- [ ] **Render**: แสดงข้อมูลรายการ (ชื่อ, จำนวนเงิน, วันที่) ถูกต้อง
- [ ] **Styling**: รายรับแสดงสีเขียว รายจ่ายแสดงสีแดง
- [ ] **Action**: กดที่รายการต้องเปิด Modal/Navigate ไปหน้าแก้ไข

## 3. System / Integration Tests (End-to-End Flows)

### 3.1 User Journey: New User
1. ผู้ใช้เปิดแอปครั้งแรก -> เห็นหน้า Login
2. กดไปหน้า Register -> สมัครสมาชิกสำเร็จ
3. ระบบ Auto Login -> เข้าสู่หน้า Home
4. หน้า Home แสดงข้อมูลว่างเปล่า (No Transactions)

### 3.2 User Journey: Manage Transaction
1. ผู้ใช้กดปุ่ม Add (+)
2. เลือกประเภท (Expense), กรอกจำนวนเงิน, เลือกหมวดหมู่ (Food), บันทึก
3. กลับมาหน้า Home -> ยอด Balance ลดลง, รายการใหม่ปรากฏใน list
4. กดที่รายการเดิม -> แก้ไขจำนวนเงิน -> บันทึก
5. ยอด Balance อัปเดตตามที่แก้ไข

### 3.3 User Journey: Budget Alert
1. ผู้ใช้ตั้งงบหมวด Food = 1000 บาท
2. บันทึกรายจ่ายหมวด Food = 850 บาท (85%)
3. ระบบต้องแสดง/ส่ง Notification เตือนว่าใช้งบเกิน 80%

### 3.4 User Journey: Export Data
1. ผู้ใช้เข้าเมนู Settings/Reports
2. กด Export CSV
3. ระบบสร้างไฟล์และเรียก System Share Sheet
