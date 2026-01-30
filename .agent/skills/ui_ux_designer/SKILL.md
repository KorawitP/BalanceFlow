---
name: ui_ux_designer
description: คู่มือแนวทางการออกแบบ UI/UX สำหรับแอพพลิเคชันมือถือ (Mobile App) เน้นความเรียบง่าย ทันสมัย (Clean & Modern)
---

# UI/UX Design Guidelines: Modern Minimalist

เอกสารนี้รวบรวมหลักการและระบบการออกแบบ (Design System) สำหรับใช้ในโปรเจกต์นี้ โดยเน้นสไตล์ที่ "เรียบง่าย แต่สวยงาม" (Minimalist & Clean) ให้ความรู้สึกทันสมัย สบายตา และใช้งานง่าย (User-Friendly)

---

## 1. Design Philosophy (ปรัชญาการออกแบบ)

- **Less is More:** ตัดสิ่งที่ไม่จำเป็นออก ให้เหลือแต่สิ่งที่ผู้ใช้ต้องใช้จริงๆ เพื่อลดความสับสน (Cognitive Load)
- **Whitespace is King:** ใช้พื้นที่ว่าง (Whitespace) เพื่อแบ่งสัดส่วนเนื้อหา ให้แอพดู "หายใจได้" ไม่แออัด
- **Clarity:** ตัวอักษรต้องอ่านง่าย ไอคอนต้องสื่อความหมายชัดเจน ปุ่มต้องกดง่าย
- **Consistency:** ใช้สี ฟอนต์ และขนาด ให้เป็นมาตรฐานเดียวกันทั้งแอพ

---

## 2. Color Palette (ชุดสี)

ใช้โทนสีที่นุ่มนวล แต่มีความคมชัดในจุดที่สำคัญ (Soft & Contrast)

### Primary Colors (สีหลัก)

- **Primary Blue/Ocean:** `#2D82B5` หรือ `#007AFF` (สำหรับปุ่มหลัก, Header, Highlight)
- **Clean White:** `#FFFFFF` (พื้นหลังหลัก)
- **Off-White/Light Gray:** `#F5F7FA` (พื้นหลังรอง, พื้นหลัง List Item)

### Status Colors (สีสถานะ)

- **Success (Income):** `#28C76F` หรือ `#4CD964` (เขียวพาสเทล หรือเขียวสดใสที่ไม่แสบตา)
- **Danger (Expense):** `#FF4D4D` หรือ `#FF3B30` (แดงที่ไม่เข้มจนดูน่ากลัว)
- **Warning:** `#FFC107` (เหลืองอำพัน)
- **Text (Dark):** `#2D3436` หรือ `#1A1A1A` (ดำเทา ไม่ใช่ดำสนิท `#000` เพื่อความสบายตา)
- **Text (Muted):** `#636E72` หรือ `#8E8E93` (เทากลาง สำหรับคำอธิบายรอง)

---

## 3. Typography (ตัวอักษร)

ใช้ฟอนต์ Sans-Serif ที่ไม่มีหัว ทันสมัย และอ่านง่ายบนหน้าจอมือถือ

- **Font Family:**
  - System Font (San Francisco on iOS / Roboto on Android) หรือ
  - Google Fonts: `Inter`, `Prompt` (ถ้าต้องการรองรับภาษาไทยสวยๆ), `Kanit` (ถ้าอยากได้ความ modern แบบขี้เล่นนิดๆ)
- **Scale:**
  - **H1 (Page Title):** Size 24px - 28px, Bold
  - **H2 (Section Header):** Size 20px, Semi-Bold
  - **Body (Content):** Size 16px, Regular
  - **Caption (Date/Label):** Size 12px - 14px, Medium, Color: Muted Gray

---

## 4. Components Style (สไตล์ของคอมโพเนนต์)

### 4.1 Cards & Containers

- **Shape:** มุมมน (Rounded Corners) รัศมี 12px - 16px
- **Shadow:** เงาบางมากๆ (Soft Shadow) เพื่อให้ดูลอยขึ้นมาเล็กน้อย หรือใช้ Border บางๆ สีเทาอ่อน
  - _Example Shadow:_ `0px 4px 12px rgba(0, 0, 0, 0.05)`
- **Background:** สีขาวบนพื้นหลังสีเทาอ่อน (`#F5F7FA`)

### 4.2 Buttons (ปุ่ม)

- **Primary Button:**
  - Background: Primary Blue
  - Text: White, Bold
  - Shape: Rounded Pill (วงรี) หรือ Rounded Rect (10px)
  - Height: 48px - 56px (ขนาดนิ้วโป้งกดง่าย)
- **Secondary Button / Outline Button:**
  - Background: Transparent
  - Border: 1px Solid Primary Blue
  - Text: Primary Blue

### 4.3 Input Fields (ช่องกรอกข้อมูล)

- **Normal State:** พื้นหลังสีเทาจางๆ (`#F0F2F5`) หรือขอบสีเทาอ่อน ไม่มีเงา
- **Focus State:** ขอบสี Primary Blue
- **Type:** ยิ่งเรียบยิ่งดี ไม่ต้องมีเส้นขีดเยอะ

---

## 5. Layout & Spacing (การจัดวาง)

- **Padding:** ขอบหน้าจอควรเว้นระยะอย่างน้อย 16px - 20px
- **Gap:** ระยะห่างระหว่างรายการ (Item) ควรอยู่ที่ 12px - 24px อย่าให้ชิดกันเกินไป
- **Vertical Rhythm:** จัดวางเนื้อหาในแนวตั้งเป็นหลัก (Column) เพราะมือถือจอยาว

---

## 6. Iconography (ไอคอน)

- ใช้ชุดไอคอนแบบ **Outline** หรือ **Two-tone** (เช่น Feather Icons, Heroicons)
- เส้นของไอคอน (Stroke Width) ควรมีความหนาใกล้เคียงกับตัวอักษร (ประมาณ 2px)
- ขนาดมาตรฐาน: 24x24 px

---

## Summary Checklist for Developers

1.  [ ] หน้าจอสะอาดตา ไม่รก (Clean UI)
2.  [ ] ใช้โทนสีตาม Palette ที่กำหนด (เขียวรับ/แดงจ่าย)
3.  [ ] ปุ่มใหญ่กดง่าย (Hardware Tap Area > 44px)
4.  [ ] ใช้ Padding/Margin สม่ำเสมอ (Systematic Spacing e.g., 4, 8, 16, 24)
5.  [ ] ฟอนต์อ่านง่าย ตัวเลขชัดเจน

---

_Created by Antigravity Agent_
