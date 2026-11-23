// php_form/challenge-form.js
// ส่งข้อมูลจาก Challenge Form ไปที่ php_form/challenge-item.php ด้วย fetch()
const form = document.querySelector('#challenge-form');
const result = document.querySelector('#challenge-result');
const downloadBtn = document.querySelector('#btn-download-item');
let lastItem = null;

if (form && result) {
    form.addEventListener('submit', async (event) => {
        event.preventDefault();                                   // ไม่ให้หน้ารีโหลด
        lastItem = null;
        if (downloadBtn) downloadBtn.disabled = true;

        try {
            const response = await fetch('php_form/challenge-item.php', {
                method: 'POST',
                body: new FormData(form)                          // เก็บทุกช่องที่มี name
            });
            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                result.className = 'mt-3 alert alert-danger';
                result.textContent = 'เซิร์ฟเวอร์ตอบกลับไม่ใช่ JSON:\n' + text.slice(0, 500);
                return;
            }

            if (!data.ok) {                                       // ตรวจไม่ผ่าน
                result.className = 'mt-3 alert alert-danger';
                result.textContent = Object.values(data.errors).join('\n');
                return;
            }

            lastItem = data.item;                                 // ผ่าน: เก็บไว้ให้ปุ่มดาวน์โหลด
            result.className = 'mt-3 alert alert-success';
            result.textContent = JSON.stringify(data.item, null, 2);
            if (downloadBtn) downloadBtn.disabled = false;
        } catch (err) {
            result.className = 'mt-3 alert alert-danger';
            result.textContent = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ (ต้องรันผ่าน php -S localhost:8000 ไม่ใช่เปิดไฟล์ตรง ๆ)';
        }
    });
}

// ดาวน์โหลดเฉพาะ item (ไม่เอา {ok, item}) เพื่อให้ Import กลับใน portfolio.html ได้
if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
        if (!lastItem) return;
        const blob = new Blob([JSON.stringify(lastItem, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'challenge-item.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
    });
}