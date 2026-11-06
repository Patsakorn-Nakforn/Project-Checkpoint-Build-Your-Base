(function () {
  const form = document.querySelector("#item-form");
  const select = document.querySelector("#portfolio-select");
  if (!form || !select) return;

  // 1) เติมรายชื่อ Portfolio จาก localStorage
  const portfolios = Storage.loadAll();
  portfolios.forEach(function (p) {
    select.add(new Option(p.name || p.id, p.id));
  });

  // เลือกอัตโนมัติจาก ?id= หรือ Portfolio ที่เปิดอยู่ล่าสุด
  const preselect =
    new URLSearchParams(location.search).get("id") || Storage.getCurrentId();
  if (preselect && portfolios.some(function (p) { return p.id === preselect; })) {
    select.value = preselect;
  }

  // ถ้ายังไม่มี Portfolio ให้แจ้งก่อน
  if (portfolios.length === 0) {
    const warn = document.createElement("div");
    warn.className = "alert alert-warning";
    warn.innerHTML =
      'ยังไม่มี Portfolio กรุณา <a href="create-portfolio.html">สร้าง Portfolio</a> ก่อน';
    form.prepend(warn);
  }

  // 2) ตอนกดบันทึก
  form.addEventListener("submit", function (event) {
    event.preventDefault();

    // ตรวจข้อมูล (validation.js แสดง error ให้เอง)
    if (!validateItem(form)) return;

    // อ่านค่าจากฟอร์ม
    const data = Object.fromEntries(new FormData(form));
    Object.keys(data).forEach(function (key) {
      data[key] = String(data[key]).trim();
    });
    const portfolioId = data.portfolioId;

    // บันทึก (storage.js แปลงเป็นโครงสร้าง JSON และสร้าง id ให้)
    const saved = Storage.addItem(portfolioId, data);
    if (!saved) {
      alert("บันทึกผลงานไม่สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง");
      return;
    }

    // ไปดู Portfolio
    Storage.setCurrentId(portfolioId);
    location.href = "portfolio.html?id=" + encodeURIComponent(portfolioId);
  });
})();