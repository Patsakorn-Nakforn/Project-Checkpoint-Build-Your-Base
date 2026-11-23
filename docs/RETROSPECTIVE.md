# Team Retrospective

## Checkpoint (รอบก่อนหน้า)

### 1. Went Well
- ทีมแบ่งงานกันอย่างชัดเจน
- สมาชิกช่วยกันแก้ไขปัญหา
- มีการใช้ GitHub Issues และ Pull Requests

### 2. Problems
- บางงานใช้เวลานานกว่าที่คาด
- มีการเข้าใจเนื้อหาต่างกัน
- การสื่อสารระหว่างสมาชิกยังไม่ทั่วถึง

### 3. Lessons Learned
- ได้เรียนรู้การทำงานร่วมกันผ่าน Git
- เข้าใจการใช้ Branch และ Pull Request
- ได้ฝึกการทำงานกลุ่ม

## Final Demo (รอบนี้)

### 1. Went Well
- แบ่งงานตาม issue ชัดเจน ทุกงานมี PR และ merge เข้า `main` ก่อนวันส่ง (#58, #59, #60, #61, #72, #76)
- API ปรับให้ใช้ฟิลด์และ ID ตามแอปเดิม (`name/enjoy/tried/curious`, `p001/item001`) พร้อมตรวจข้อมูลฝั่ง Server
- มีปุ่ม Download Portfolio ในการ์ดสมาชิกทั้ง 7 คน และหน้า Import Item ที่ตรวจ JSON ก่อนบันทึก
- มีสคริปต์ทดสอบอัตโนมัติ (Playwright) ช่วยตรวจเส้นทางหลักของระบบ

### 2. Problems
- เลข issue ในไฟล์ md ที่แจกไม่ตรงกับเลขจริงบน GitHub (เช่น md #37 = GitHub #76) ทำให้เข้าใจผิดว่าใครรับงานไหนและใช้เลขผิดใน PR
- `README_CHALLENGE.md` ถูกลบบางส่วนโดยไม่ตั้งใจตอน merge แล้วต้องใส่คืน
- ตอนรวมงาน พบว่าหน้า Import Item ส่ง evidence เป็นฟิลด์ `evidence` แต่ API รับ `evidence1-3` ทำให้บันทึกไม่ผ่าน และ dropdown แสดงรหัส Portfolio แทนชื่อ (เพราะ API เปลี่ยนจาก displayName เป็น name) เจอเพราะ 2 งานถูกทำแยกกันและไม่ได้ทดสอบร่วมกัน
- หน้า Challenge_Website.html อ้างไฟล์ `js/bootstrap.bundle.min.js` และ `js/darkmodetoggle.js` ที่ไม่มีใน repo (ขึ้น 404)
- หน้าเว็บส่วนใหญ่ (Home, Portfolio, Add Item) ยังเก็บข้อมูลใน localStorage ขณะที่ API และหน้า Import ใช้ Server ทำให้ข้อมูลสองที่ไม่ตรงกัน
- งานรวมระบบและทดสอบมารวมกันช่วงท้ายก่อนส่ง เวลาแก้ไขจึงน้อย

### 3. Lessons Learned
- ตรวจเลข issue จริงบน GitHub ก่อนเริ่มงานเสมอ ไม่เชื่อไฟล์สรุปจากคนอื่น
- ก่อน merge ต้อง `git pull` และดู diff ว่าไม่ลบไฟล์ของคนอื่น
- ฟีเจอร์ที่ต้องทำงานร่วมกัน (Import ↔ API) ต้องตกลง "ชื่อฟิลด์" และทดสอบร่วมกันตั้งแต่ต้น ไม่ใช่ตอนท้าย
- ทดสอบบนเว็บจริงใน Incognito ช่วยเจอปัญหาที่เครื่องตัวเองมองไม่เห็น

### 4. Action Items (หลัง Demo)
| Action Item | Owner |
|---|---|
| แก้ Import Item ให้ส่ง evidence1–3 และแสดงชื่อ Portfolio | M4 |
| เพิ่มหรือลบ script ที่อ้างไฟล์ที่ไม่มีใน Challenge_Website.html | M5 |
| ย้ายหน้า Home/Portfolio/Add Item ให้อ่านเขียนผ่าน API เป็นหลัก | ตกลงในกลุ่ม |
| ตกลงสัญญา JSON/ฟิลด์ก่อนเริ่มเขียนโค้ดและเขียนลง docs | M1 |
| ตรวจ diff ก่อน merge ทุกครั้ง และใช้เลข issue จริงใน PR | ทุกคน |
| ตรวจเอกสารและ Acceptance Criteria ให้ครบก่อนปิด Issue | M7 |
