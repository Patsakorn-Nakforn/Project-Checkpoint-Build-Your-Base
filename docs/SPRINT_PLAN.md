# Sprint Plan: Final Demo (ส่ง 23 พ.ย. 2569 / Demo 24 พ.ย. 2569)

## Action items จาก Retrospective (Checkpoint)
- ตกลง "สัญญา" (โครงสร้าง JSON + endpoint) ก่อนเริ่มเขียนโค้ด
- แบ่งงานตามฟีเจอร์ 1 คนต่อ 1 issue ใหญ่ ลดการรอกัน
- PR ต้องถูก review ภายใน 24 ชั่วโมง

## งานและผู้รับผิดชอบ (เลขตาม GitHub Issues)
| Issue | งาน | ผู้รับผิดชอบ | PR | กำหนดเสร็จ | สถานะ |
|---|---|---|---|---|---|
| #58 | เพิ่มโฟลเดอร์ api และ php_form จาก starter kit | M7 นายเตชิต อยู่คุ้ม | #83 | 22 พ.ย. | เสร็จ (merge แล้ว) |
| #59 | ไฟล์ data/challenge-item.json + ปุ่มดาวน์โหลดในหน้า Challenge | M6 นายณัฐดนัย กลมกลาง | #84 | 22 พ.ย. | เสร็จ (merge แล้ว) |
| #60 | php_form: รับข้อมูลจาก Challenge Form ตรวจสอบและสร้าง Item JSON | M1 นายธเนศพล คงประเวช | #87 | 22 พ.ย. | เสร็จ (merge แล้ว) |
| #61 | api: ใช้ฟิลด์/ID ตามแอปเดิม ตรวจข้อมูลฝั่ง Server และ Export | M2 นายกฤตภาส อ่องมี | #85 | 22 พ.ย. | เสร็จ (merge แล้ว) |
| #72 | Import Item (ตรวจ JSON ก่อนบันทึก + เมนู Import Item) | M4 นายธิติพัฒน์ สุขขัง | #86 | 23 พ.ย. | merge แล้ว (พบจุดต้องแก้ ดู Retrospective) |
| #76 | Export portfolio.json (ปุ่ม Download Portfolio ในการ์ดสมาชิก) | M7 นายเตชิต อยู่คุ้ม | #82 | 23 พ.ย. | เสร็จ (merge แล้ว) |
| #77 | ทดสอบบน localhost (php -S) | M5 นายพรรษกร นักฟ้อน | - | 23 พ.ย. | [กรอกสถานะ] |
| #78 | ทดสอบ/ติดตั้งบน AWS EC2 | M5 นายพรรษกร นักฟ้อน | - | 23 พ.ย. | [กรอกสถานะ] |
| #79 | รวบรวมและตรวจสอบงานก่อนส่ง | M7 นายเตชิต อยู่คุ้ม | - | 23 พ.ย. 23:59 | กำลังดำเนินการ |

## Acceptance Criteria ของ #79
- เว็บเปิดได้บน GitHub Pages และบน localhost:8000 (หรือ AWS EC2) โดยไม่มี error
- Export portfolio-item.json ได้ และเพิ่ม challenge-item.json เข้า Portfolio ที่มีอยู่ได้
- SHA ที่ส่งตรงกับ commit ล่าสุดของ `main`

## ลิงก์ที่ใช้ส่ง
- Repo: https://github.com/Patsakorn-Nakforn/Project-Checkpoint-Build-Your-Base
- เว็บ: https://patsakorn-nakforn.github.io/Project-Checkpoint-Build-Your-Base/
- Commit SHA ล่าสุดของ main: [กรอกตอนส่ง]
