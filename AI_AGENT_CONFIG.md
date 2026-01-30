# คู่มือการตั้งค่า AI Agent (Agent Configuration Guide)

เอกสารนี้สรุปวิธีการปรับแต่งและ "สอน" ให้ AI Agent ทำงานเข้ากับโปรเจกต์ของคุณได้ดียิ่งขึ้น ผ่านการใช้ไฟล์ Markdown (`.md`) ในรูปแบบต่างๆ

## 1. Docs (เอกสารทั่วไป)

**ตำแหน่ง:** `docs/*.md`
**หน้าที่:** เปรียบเสมือน "ความรู้พื้นฐาน" ของโปรเจกต์ ที่ Agent ควรูู้

Agent สามารถอ่านไฟล์เหล่านี้เพื่อทำความเข้าใจภาพรวม อาร์กิเทกเจอร์ หรือกฎเกณฑ์ของทีม

- **ตัวอย่าง:**
  - `docs/ARCHITECTURE.md` - อธิบายโครงสร้างระบบ (Next.js + Supabase)
  - `docs/STYLE_GUIDE.md` - กฎการเขียนโค้ด (Naming Convention, CSS Rules)
  - `docs/ROADMAP.md` - แผนงานฟีเจอร์ต่างๆ

## 2. Skills (ทักษะเฉพาะทาง)

**ตำแหน่ง:** `.agent/skills/[skill-name]/SKILL.md`
**หน้าที่:** เปรียบเสมือน "คู่มือ" หรือ "ข้อมูลเฉพาะเจาะจง" ที่ Agent จะเรียกดูเมื่อเจองานที่เกี่ยวข้อง

เหมาะสำหรับข้อมูลที่มีความซับซ้อน หรือต้องใช้ความถูกต้องสูง (เช่น Database Schema, API Docs)

- **โครงสร้าง:** ต้องมีโฟลเดอร์ชื่อ Skill และข้างในต้องมีไฟล์ `SKILL.md`
- **ตัวอย่าง:**
  - `.agent/skills/supabase_project_helper/SKILL.md` - ข้อมูลตารางและคำสั่ง SQL ของ Supabase (ที่เราเพิ่งทำไป)
  - `.agent/skills/deployment_guide/SKILL.md` - วิธีการ Deploy ขึ้น Server แบบละเอียด

## 3. Workflows (กระบวนการทำงาน)

**ตำแหน่ง:** `.agent/workflows/[workflow-name].md`
**หน้าที่:** เปรียบเสมือน "สูตรทำอาหาร" (Recipe) หรือ Checklist ที่ต้องการให้ Agent ทำตามทีละขั้นตอนเป๊ะๆ

เหมาะสำหรับงาน Routine ที่ทำซ้ำบ่อยๆ และไม่อยากพิมพ์สั่งยาวๆ หรือกลัว Agent ลืมขั้นตอน

- **โครงสร้าง:** เป็นไฟล์ .md ธรรมดา ที่ระบุ Frontmatter `description` และรายการขั้นตอน
- **ตัวอย่าง:**
  - `.agent/workflows/new-component.md` - "สร้าง Component ใหม่ > สร้างไฟล์ Test > อัปเดต index.ts"
  - `.agent/workflows/database-migration.md` - "สร้างไฟล์ Migration > ตรวจสอบ SQL > รันคำสั่ง Apply"

---

### ตัวอย่างโครงสร้างไฟล์ (File Structure)

```text
my-project/
├── docs/                   # ความรู้ทั่วไป (Context)
│   ├── ARCHITECTURE.md
│   └── STYLE_GUIDE.md
├── .agent/
│   ├── skills/             # ทักษะเฉพาะด้าน (Specialized Knowledge)
│   │   └── supabase_helper/
│   │       └── SKILL.md
│   └── workflows/          # สูตรการทำงาน (Step-by-Step Recipes)
│       └── create-feature.md
└── ...
```

**สรุป:**

- ใช้ **Docs** บอก "What" (คืออะไร)
- ใช้ **Skills** บอก "How-to (Specific)" (ข้อมูลลึกๆ)
- ใช้ **Workflows** บอก "Steps" (ลำดับขั้นตอน)
