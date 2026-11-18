# Sprint Plan: Final Demo (ส่ง 23 พ.ย. 2569 / Demo 24 พ.ย. 2569)

## Action items จาก Retrospective
- ตกลง "สัญญา" (โครงสร้าง JSON + endpoint) ก่อนเริ่มเขียนโค้ด → ดู `docs/CONTRACT.md`
- แบ่งงานตามฟีเจอร์ 1 คนต่อ 1 issue ใหญ่ ลดการรอกัน
- PR ต้องถูก review ภายใน 24 ชั่วโมง

## งานและผู้รับผิดชอบ
| ผู้รับผิดชอบ | งาน | กำหนดเสร็จ | Acceptance Criteria |
|---|---|---|---|
| นายธเนศพล คงประเวช | จัดทำโครงของ Website Detective Challenge จาก Github Repository เดิม | 20 พ.ย. | navbar ของเว็บไซต์มีเมนู Challenge Page, กด Challenge แล้วไม่ขึ้นerror, เปิดผ่านคอมและมือถือได้ |

| นายกฤตภาส อ่องมี | จัดทำ README วิธีทำ Challenge | 20 พ.ย. | README_CHALLENGE มีเนื้อหาครบ, สามารถเปิดดู README_CHALLENGE ใน Github Repository ได้, มีวิธีติดตั้ง วิธีทำ challenge พร้อมวิธีทดสอบ |

| นายประภวิษณุ์ ทิพย์อักษรเดชา | หน้าแรก: Hero + วิธีการทำ Challenge | 20 พ.ย. | ปุ่มลิงก์ไปหน้า Challenge Page ถูกต้อง, ใช้ heading ตามลำดับ h1 h2 h3, หัวข้อของ Challenges อยู่ด้านล่าง content ของ Example Portfolios ในหน้าเว็บ Home |

| นายธิติพัฒน์ สุขขัง | Challenge_Page: Hero + รายละเอียดและกติการการทำ Challenges | 21 พ.ย. | ชื่อของ Challenge มีขนาด h1 โดยมีหัวข้อขนาด h2 และรายละเอียดของหัวข้ออื่นๆ ขนาด h3, Challenge มีชื่อ รายละเอียด และกติการการทำที่ชัดเจน, มีปุ่ม 'Challenge Website' ลิงก์ไปหน้าโจทย์ได้ถูกต้อง |

|นายพรรษกร นักฟ้อน | Challenge_Website: จัดทำ Website โจทย์เพื่อใช้สำหรับ Challenge | 21 พ.ย. | เว็บไซต์มีจุดผิดพลาดหรือสามารถปรับให้ดีขึ้นได้จำลองอย่างน้อย 5 จุดขึ้นไป, มีไฟล์ Answer.md เฉลยจุดที่ผิดพลาดในเว็บไซต์ตัวอย่าง |

| นายเตชิต อยู่คุ้ม | เพิ่มโฟลเดอร์ api และชุดคำสั่ง php_form | 22 พ.ย. | หน้าเมนู code ของ Github Repository มีโฟลเดอร์ api และ php_form เพิ่มขึ้นครบตาม starter kit |

| นายณัฐดนัย กลมกลาง | Challenge_Page: จัดทำฟอร์มกรอกข้อมูล | 22 พ.ย. | มีช่องกรอกข้อมูลครบตามโครงสร้าง Portfolio Item เดิม , กำหนด Required ให้ข้อมูลที่จำเป็น และฟอร์มแสดงผลบนมือถือโดยไม่ล้นขอบหน้าจอ |

| นายธเนศพล คงประเวช | php_form — ปรับโครงสร้างของไฟล์ในโฟลเดอร์ php_form ให้ทำงานสอดคล้องกับ Form ของ Challenge_Page | 22 พ.ย. | ปรับไฟล์ในโฟลเดอร์ php_form ให้รับข้อมูลจาก Challenge Form ได้, ตรวจสอบความถูกต้องของข้อมูลก่อนบันทึก, สร้าง Portfolio Item JSON และกำหนด ID ไม่ซ้ำกัน |

| นายกฤตภาส อ่องมี | api — ปรับโครงสร้างของไฟล์ในโฟลเดอร์ api ให้ทำงานสอดคล้องกับ Form ของ Challenge_Page | 22 พ.ย. | บันทึก Portfolio Item ลง Portfolio ที่ถูกต้อง, กำหนด ID ตามรูปแบบเดิม และสามารถ Export Portfolio ทั้งหมดเป็น my-portfolio.json ได้ |