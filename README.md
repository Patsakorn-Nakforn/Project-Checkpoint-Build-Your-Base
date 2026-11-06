## วิธีเปิดเว็บ
- ออนไลน์: [https://patsakorn-nakforn.github.io/Project-Checkpoint-Build-Your-Base/portfolio.html]
- ในเครื่อง: clone repo แล้วดับเบิลคลิก `index.html`

## โครงสร้างไฟล์
```
├── index.html
├── create-portfolio.html
├── add-item.html
├── portfolio.html
├── css/style.css
├── js/
├── data/
├── docs/
├── images/
└── scripts/
```

## สมาชิก
| รหัส | ชื่อ | หน้าที่ | เลขทะเบียน |
| M1 | นายธเนศพล คงประเวช | Team Lead / Layout กลาง / data-tools.js / ส่งงาน | 6909617729 |
| M2 | นายกฤตภาส อ่องมี | หน้าแรก (index) + storage.js + Retrospective | 6909617562 |
| M3 | นายประภวิษณุ์ ทิพย์อักษรเดชา| Create Portfolio + Live Preview | 6909617778 |
| M4 | นายธิติพัฒน์ สุขขัง | Add Item (ข้อมูลผลงาน + add-item.js) + Sprint Plan | 6909617745 |
| M5 | นายพรรษกร นักฟ้อน | Add Item (Reflection + Evidence) + validation.js | 6909686229 |
| M6 | นายณัฐดนัย กลมกลาง| View Portfolio + render.js | 6909617620 |
| M7 | นายเตชิต อยู่คุ้ม | CSS / Responsive / QA + Checkpoint Tests | 6909617687 |

## Mapping: ชื่อ input ในฟอร์ม ↔ field ใน JSON

อ้างอิงจาก `add-item.html` และโครงสร้าง Portfolio Item ตาม `portfolio-example.json`

| ช่องในฟอร์ม (`name`) | field ใน JSON | ชนิดข้อมูล | หมายเหตุ |
|---|---|---|---|
| portfolioId | (ไม่เก็บใน item) | string | ใช้เลือกว่าจะเพิ่ม item ให้ Portfolio ไหน |
| title | `title` | string | |
| type | `type` | string | เลือกจาก Course Assignment, Project, Activity, Competition, Other |
| date | `date` | string | รูปแบบ YYYY-MM-DD เช่น `2026-10-18` |
| role | `role` | string | |
| description | `description` | string | |
| skills | `skills` | array ของ string | พิมพ์คั่นด้วย `,` เช่น `HTML, CSS` → `["HTML", "CSS"]` |
| whatIDid | `reflection.whatIDid` | string | อยู่ใน object `reflection` |
| whatILearned | `reflection.whatILearned` | string | อยู่ใน object `reflection` |
| challenge | `reflection.challenge` | string | อยู่ใน object `reflection` |
| nextStep | `reflection.nextStep` | string | อยู่ใน object `reflection` |
| evidence1, evidence2, evidence3 | `evidence` | array ของ string (URL) | รวมเฉพาะช่องที่กรอก ช่องที่ 1 บังคับกรอก |

ตัวอย่าง `evidence` เมื่อกรอก 2 ช่อง: `["https://example.com/a", "https://example.com/b"]`

**หมายเหตุ:** `id` ของ item (เช่น `item001`) ไม่ได้มาจากฟอร์ม ระบบสร้างให้ตอนบันทึก