document.addEventListener('DOMContentLoaded', () => {
  const msgEl = document.getElementById('data-msg');
  const on = (id, evt, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(evt, fn);
  };

  function showMsg(text, isError) {
    if (!msgEl) return;
    msgEl.className = 'mt-3 alert ' + (isError ? 'alert-danger' : 'alert-success');
    msgEl.textContent = text;
  }

  // TODO(M6): เปลี่ยนเป็นชื่อฟังก์ชัน render จริงใน render.js
  const refresh = () => {
    if (typeof renderPortfolio === 'function') renderPortfolio();
    else location.reload();
  };

  // สร้าง id รูปแบบเดียวกับ Storage: p001, item001
  function nextId(prefix, ids) {
    let max = 0;
    ids.forEach(id => {
      const m = String(id).match(new RegExp('^' + prefix + '(\\d+)$'));
      if (m) max = Math.max(max, Number(m[1]));
    });
    return prefix + String(max + 1).padStart(3, '0');
  }

  // 1) โหลดข้อมูลตัวอย่าง (แทนที่ข้อมูลเดิมทั้งหมด)
  on('btn-load-sample', 'click', () => {
    if (!Array.isArray(window.SAMPLE_DATA) || !window.SAMPLE_DATA.length) {
      return showMsg('ไม่พบข้อมูลตัวอย่าง (js/sample-data.js)', true);
    }
    if (Storage.loadAll().length &&
        !confirm('การโหลดข้อมูลตัวอย่างจะแทนที่ข้อมูลเดิมทั้งหมด ต้องการทำต่อ?')) return;

    const sample = JSON.parse(JSON.stringify(window.SAMPLE_DATA));
    if (!Storage.saveAll(sample)) return showMsg('บันทึกไม่สำเร็จ', true);
    Storage.setCurrentId(sample[0].id);
    showMsg('โหลดข้อมูลตัวอย่าง ' + sample.length + ' portfolio แล้ว');
    refresh();
  });

  // 2) Export portfolio ที่ดูอยู่
  on('btn-export', 'click', () => {
    const list = Storage.loadAll();
    const portfolio = list.find(p => p.id === Storage.getCurrentId()) || list[0];
    if (!portfolio) return showMsg('ไม่มีข้อมูลให้ Export', true);

    const payload = { version: 1, exportedAt: new Date().toISOString(), portfolio };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portfolio-' + portfolio.id + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showMsg('Export สำเร็จ: ' + a.download);
  });

  // 3) Import
  const isStr = v => typeof v === 'string';
  const isHttps = v => isStr(v) && /^https:\/\/.+/.test(v);

  function validateItem(i) {
    return !!i && typeof i === 'object' &&
      isStr(i.id) && isStr(i.title) &&
      Array.isArray(i.skills) && i.skills.every(isStr) &&
      !!i.reflection && typeof i.reflection === 'object' &&
      Array.isArray(i.evidence) && i.evidence.every(isHttps);
  }

  function validate(p) {
    return !!p && typeof p === 'object' &&
      isStr(p.id) && isStr(p.name) &&
      Array.isArray(p.items) && p.items.every(validateItem);
  }

  on('file-import', 'change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const p = data && data.portfolio ? data.portfolio : data;
        if (!validate(p)) throw new Error('โครงสร้างไฟล์ไม่ถูกต้อง');

        const list = Storage.loadAll();

        // portfolio id ซ้ำ -> ออก id ใหม่
        if (list.some(x => x.id === p.id)) {
          p.id = nextId('p', list.map(x => x.id));
        }

        // item id ซ้ำกันเองภายในไฟล์ที่ import -> ออก id ใหม่
        const seen = new Set();
        p.items.forEach(i => {
          if (seen.has(i.id)) {
            i.id = nextId('item', [...seen, ...p.items.map(x => x.id)]);
          }
          seen.add(i.id);
        });

        list.push(p);
        if (!Storage.saveAll(list)) throw new Error('บันทึกไม่สำเร็จ');
        Storage.setCurrentId(p.id);
        showMsg('Import สำเร็จ: ' + p.name);
        refresh();
      } catch (err) {
        showMsg('Import ไม่สำเร็จ: ' +
          (err instanceof SyntaxError ? 'ไฟล์ไม่ใช่ JSON' : err.message), true);
      }
    };
    reader.onerror = () => showMsg('อ่านไฟล์ไม่ได้', true);
    reader.readAsText(file);
    e.target.value = '';
  });

  // 4) ลบข้อมูลทั้งหมด
  on('btn-clear', 'click', () => {
    if (!confirm('ลบข้อมูลทั้งหมด? ย้อนกลับไม่ได้')) return;
    if (!Storage.clearAll()) return showMsg('ลบไม่สำเร็จ', true);
    showMsg('ลบข้อมูลทั้งหมดแล้ว');
    refresh();
  });
});