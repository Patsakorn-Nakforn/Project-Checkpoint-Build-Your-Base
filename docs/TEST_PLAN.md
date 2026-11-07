# Test Plan — Project Checkpoint (Issue #25, owner: M7)

- ทดสอบบน: https://patsakorn-nakforn.github.io/Project-Checkpoint-Build-Your-Base/
- Commit SHA ที่ทดสอบ: `f60d597`
- เบราว์เซอร์: Chromium 158.0.8127.18 (Playwright) · มือถือจริง: `iPhone 17` (ทดสอบเอง)
- วิธีทดสอบ: รันสคริปต์ run-checkpoint-tests.js ที่เปิดเบราว์เซอร์จริงทำตามขั้นตอนของแต่ละข้อ แล้วเก็บภาพ/คลิปใน docs/evidence/
- ผู้ทดสอบ: M7 · ผู้ตรวจซ้ำ (Incognito): `____________`

ใช้ข้อมูลสมมติเท่านั้น ไม่มีข้อมูลส่วนตัว

---

## T1 สร้าง Portfolio ตอนฟอร์มว่าง
**ผลที่ต้องเห็น:** แจ้งเตือน 4 ช่อง ไม่บันทึก
**ผลที่พบ:** ช่องที่แจ้งเตือน 4/4, จำนวน Portfolio ใน localStorage = 0
**ผล:** ☒ ผ่าน ☐ ไม่ผ่าน · ภาพ: t01-empty-create.png, t01-storage.png

## T2 ชื่อยาวเกิน 60 ตัวอักษร
**ผลที่ต้องเห็น:** ชื่อที่บันทึกยาวไม่เกิน 60
**ผลที่พบ:** พิมพ์ 61 ตัว ช่องรับ 60 ตัว (maxlength=60) ชื่อที่บันทึกยาว 60 ตัว
**ผล:** ☒ ผ่าน ☐ ไม่ผ่าน · ภาพ: t02-name-60.png, t02-storage.png

## T3 เพิ่ม Item ตอนฟอร์มว่าง
**ผลที่ต้องเห็น:** error ทุกช่องบังคับ มีกล่องสรุป ไม่บันทึก
**ผลที่พบ:** ช่องที่แจ้งเตือน 11 ช่อง, กล่องสรุป error แสดง, จำนวน item = 0
**ผล:** ☒ ผ่าน ☐ ไม่ผ่าน · ภาพ: t03-empty-item.png, t03-storage-no-item.png

## T4 ตรวจ URL ของ Evidence
**ผลที่ต้องเห็น:** ลิงก์ผิดรูปแบบไม่บันทึก ลิงก์ถูกบันทึกได้
**ผลที่พบ:** abc → ไม่ผ่าน (ถูกต้อง); www.x.com → ไม่ผ่าน (ถูกต้อง); ftp://x.com → ไม่ผ่าน (ถูกต้อง); ช่อง1 ถูก + ช่อง2 = abc → ไม่ผ่าน กรอบแดงเฉพาะช่อง 2 (ถูกต้อง); https://github.com/a/b → ผ่าน บันทึกได้ ไม่มี alert แทรก (ถูกต้อง)
**ผล:** ☒ ผ่าน ☐ ไม่ผ่าน · ภาพ: t04-url-abc.png, t04-url-www.png, t04-url-ftp.png, t04-url-second-invalid.png, t04-url-valid.png

## T5 ตรวจวันที่
**ผลที่ต้องเห็น:** วันที่ไม่มีจริง/อนาคตไม่ผ่าน วันที่ถูกผ่าน
**ผลที่พบ:** วันอนาคต 2099-01-01 ถูกปฏิเสธ; Console: isValidDate('2026-02-30')=false, isValidDate('2026-10-18')=true, isValidUrl('abc')=false
**ผล:** ☒ ผ่าน ☐ ไม่ผ่าน · ภาพ: t05-future-date.png

## T8 localStorage มีค่าเสีย
**ผลที่ต้องเห็น:** หน้าไม่พัง ไม่มี JS error
**ผลที่พบ:** JS error ใหม่ 0 รายการ (ระบบรีเซ็ตข้อมูลเสียและโหลดข้อมูลตัวอย่างให้เอง)
**ผล:** ☒ ผ่าน ☐ ไม่ผ่าน · ภาพ: t08-corrupt-index.png

## T9 ข้อความที่เป็น HTML ถูก escape
**ผลที่ต้องเห็น:** แสดงเป็นตัวอักษร ไม่เป็นตัวหนา ไม่รันสคริปต์
**ผลที่พบ:** หน้า Portfolio: ตัวหนา 0, สคริปต์รัน false; หน้าแรก: ตัวหนา 0, สคริปต์รัน false; Live Preview สคริปต์รัน false
**ผล:** ☒ ผ่าน ☐ ไม่ผ่าน · ภาพ: t09-xss-portfolio.png, t09-xss-home.png

## T6 2 Portfolios × 2 Items ไม่ปนกัน
**ผลที่ต้องเห็น:** แต่ละหน้าแสดงเฉพาะของตัวเอง id ถูกต้อง JSON ตามสเปก
**ผลที่พบ:** Portfolio 2 (p001,p002), items ต่อ Portfolio item001/item002 | item001/item002, การ์ดหน้าแรก 2, JSON ตามสเปก true, evidence ไม่ปน true, หน้าแสดงไม่ปน true, ไม่มี alert แทรก true
**ผล:** ☒ ผ่าน ☐ ไม่ผ่าน · ภาพ: t06-preview.png, t06-storage.png, t06-home-2cards.png, t06-portfolio-p001.png, t06-portfolio-p002.png

## T6b Live Preview ระหว่างกรอก (#23)
**ผลที่ต้องเห็น:** Preview เปลี่ยนตามที่พิมพ์ ลิงก์ผิดเป็นสีแดง
**ผลที่พบ:** Preview แสดง title/skills ที่พิมพ์ true, ลิงก์ 'abc' แดง true
**ผล:** ☒ ผ่าน ☐ ไม่ผ่าน · ภาพ: t06-preview.png

## T7 Save → Refresh → Load
**ผลที่ต้องเห็น:** ข้อมูล 2×2 ครบหลัง Refresh และหลังปิด-เปิดเบราว์เซอร์ใหม่
**ผลที่พบ:** Refresh แล้วหน้า p002 ยังมี B1,B2; เปิดเบราว์เซอร์ใหม่ (จำลองด้วย storageState) การ์ดหน้าแรก 2, p001 ยังมี A1,A2; คลิป: t06-t07-flow.webm
**ผล:** ☒ ผ่าน ☐ ไม่ผ่าน · ภาพ: t07-after-refresh.png, t07-after-reopen-home.png, t07-after-reopen-p001.png

## T10 เปิดจากเบราว์เซอร์/เครื่องใหม่
**ผลที่ต้องเห็น:** ไม่มีข้อมูลเดิม (ข้อจำกัดของ localStorage) แต่แอปไม่พัง
**ผลที่พบ:** เปิดในเบราว์เซอร์ใหม่ (ไม่ได้ติดตั้ง Firefox: ทดสอบเฉพาะ Chromium ที่ไม่มีข้อมูลเดิม) ได้หน้าแรกปกติ การ์ด 2 (ข้อมูลตัวอย่างโหลดอัตโนมัติ) ไม่มี JS error
**ผล:** ☒ ผ่าน ☐ ไม่ผ่าน · ภาพ: t10-new-browser-home.png

## T11 ดูบนมือถือ (จำลอง iPhone 13)
**ผลที่ต้องเห็น:** ใช้งานได้ ไม่มี scroll แนวนอน
**ผลที่พบ:** สร้าง Portfolio และเพิ่ม Item บนจอ 390px ได้ (items = 1); หน้าที่มี scroll แนวนอน: ไม่มี; ยังต้องทดสอบมือถือจริงเพิ่มเอง
**ผล:** ☒ ผ่าน ☐ ไม่ผ่าน · ภาพ: t11-mobile-index.png, t11-mobile-create-portfolio.png, t11-mobile-add-item.png, t11-mobile-portfolio.png

## T12 Export → ลบทั้งหมด → Import
**ผลที่ต้องเห็น:** ข้อมูลกลับมาครบ ไฟล์ {} ขึ้นข้อความ error
**ผลที่พบ:** หลังลบ Portfolio = 0; หลัง Import พบ ExportMe พร้อม 1 item true; Import {} ขึ้น error true; ไฟล์ export: t12-export.json
**ผล:** ☒ ผ่าน ☐ ไม่ผ่าน · ภาพ: t12-export.png, t12-after-clear.png, t12-after-import.png, t12-import-bad.png

---

## สรุปผล
| ข้อ | หัวข้อ | ผล | Bug issue |
|---|---|---|---|
| T1 | สร้าง Portfolio ตอนฟอร์มว่าง | ผ่าน | - |
| T2 | ชื่อยาวเกิน 60 ตัวอักษร | ผ่าน | - |
| T3 | เพิ่ม Item ตอนฟอร์มว่าง | ผ่าน | - |
| T4 | ตรวจ URL ของ Evidence | ผ่าน | - |
| T5 | ตรวจวันที่ | ผ่าน | - |
| T8 | localStorage มีค่าเสีย | ผ่าน | - |
| T9 | ข้อความที่เป็น HTML ถูก escape | ผ่าน | - |
| T6 | 2 Portfolios × 2 Items ไม่ปนกัน | ผ่าน | - |
| T6b | Live Preview ระหว่างกรอก (#23) | ผ่าน | - |
| T7 | Save → Refresh → Load | ผ่าน | - |
| T10 | เปิดจากเบราว์เซอร์/เครื่องใหม่ | ผ่าน | - |
| T11 | ดูบนมือถือ (จำลอง iPhone 13) | ผ่าน | - |
| T12 | Export → ลบทั้งหมด → Import | ผ่าน | - |


## หมายเหตุ
- คลิป: docs/evidence/t06-t07-flow.webm : https://drive.google.com/file/d/1sxPmpoDkF0QRI6P12oeqqrz_mRFUhWzS/view?usp=sharing
- ให้เพื่อนเปิดลิงก์หลักฐานใน Incognito แล้วกรอกชื่อผู้ตรวจซ้ำ
