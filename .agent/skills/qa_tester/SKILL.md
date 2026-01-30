---
name: qa_tester
description: ทีมตรวจสอบความถูกต้องของระบบ (QA/Testing Team) เพื่อเช็ค Logic, บัค และความลื่นไหลของโปรแกรม
---

# QA/Tester Skill: Quality Assurance Guidelines

เอกสารนี้ทำหน้าที่เป็นคู่มือสำหรับ AI Agent ในการสวมบทบาทเป็น "ทีม Tester" เพื่อตรวจสอบโค้ดและการทำงานของแอพพลิเคชันในโปรเจกต์นี้

---

## 1. Core Testing Objectives (วัตถุประสงค์หลัก)

- **Logic Accuracy:** ตรวจสอบว่าคำนวณรายรับ-รายจ่ายถูกต้อง 100% (ไม่มีบัคเลขทศนิยม)
- **Edge Case Handling:** ตรวจสอบกรณีที่ผู้ใช้กรอกข้อมูลแปลกๆ (เช่น ใส่ตัวอักษรในช่องจำนวนเงิน, ใส่เลขลบ, ไม่ใส่ข้อมูลแล้วกดบันทึก)
- **State Management:** ตรวจสอบว่าหลังจากบันทึก/แก้ไข ข้อมูลในหน้าจอต้องอัปเดตทันที (Realtime)
- **Bug Discovery:** หาจุดบกพร่องที่อาจเกิดจากการหลุด Error ของ Firebase
- **UI/UX Validation:** ตรวจสอบว่าหน้าตาโปรแกรมเป็นไปตามมาตรฐานในสิทธิ `ui_ux_designer`

---

## 2. Test Cases Framework (ชุดการทดสอบ)

### 2.1 Authentication (ระบบสมาชิก)

- [ ] **Empty Field:** ลองล็อกอินโดยไม่ใส่ User/Password ดูว่ามี Alert เตือนไหม?
- [ ] **Invalid Format:** ลองสมัครด้วยอีเมลที่ไม่มี @ ดูว่า Firebase ปฏิเสธไหม?
- [ ] **Password Length:** รหัสผ่านต้องยาวกว่า 6 ตัวอักษรตามมาตรฐาน Firebase
- [ ] **User Persistence:** ล็อกอินแล้วปิดแอพ เปิดใหม่ต้องยังล็อกอินอยู่ (useAuth hook ทำงาน)

### 2.2 Income/Expense Logic (ระบบรายรับ-รายจ่าย)

- [ ] **Positive Numbers Only:** ช่อง Amount ต้องรับเฉพาะตัวเลขบวกเท่านั้น (รายจ่ายควรบันทึกด้วยเลขบวก แล้วค่อยไปหักลบใน Logic แสดงผล)
- [ ] **Currency Format:** ตัวเลขต้องแสดงลูกน้ำ Comma เสมอ (e.g. 10,000.00)
- [ ] **Date Ordering:** รายการในหน้า List ต้องเรียงตามวันที่ (ที่ผู้ใช้เลือก) ไม่ใช่แค่วันที่กดบันทึก

### 2.3 CRUD Operations

- [ ] **Create:** บันทึกแล้วข้อมูลต้องเด้งขึ้นมาใน List ทันที
- [ ] **Update:** แก้ไขตัวเลขแล้ว ยอดรวม (Total Balance) ต้องอัปเดตตาม
- [ ] **Delete:** ลบรายการแล้ว ข้อมูลต้องหายไปจากทั้งหน้าจอและ Firebase

---

## 3. Review Process (ขั้นตอนการรีวิวโค้ด)

เมื่อมีการเขียนโค้ดใหม่ ทีม Tester ต้องถามตัวเองดังนี้:

1.  **Is it Safe?** มีการใช้ `try-catch` ครอบคำสั่ง Firebase หรือไม่? มี `ActivityIndicator` โชว์ตอนโหลดไหม?
2.  **Is it Robust?** มีการแอปพลิเคชัน Validate ข้อมูลก่อนส่งไป Database หรือไม่? (เช่น `parseFloat` แล้วตัวแปรเป็น `NaN` หรือไม่)
3.  **Is it User-Friendly?** เมื่อเกิด Error ข้อความที่แจ้งเตือนผู้ใช้ (Alert) อ่านง่ายและเข้าใจไหม? (ไม่ใช่โชว์ RAW Error จาก Firebase)

---

## 4. Testing Tools (เครื่องมือที่ใช้)

- **Firebase Emulator (ถ้ามี):** สำหรับทดสอบโดยไม่ใช้ข้อมูลจริง
- **Console Logging:** ตรวจสอบค่าตัวแปรผ่าน `console.log` เมื่อเกิดเหตุการณ์ผิดปกติ
- **Manual Trigger:** จำลองพฤติกรรมผู้ใช้ เช่น กดรัวๆ (Double Tap) ว่าป้องกันการส่งข้อมูลซ้ำได้ไหม

---

_Created by Antigravity Agent - QA Team_
