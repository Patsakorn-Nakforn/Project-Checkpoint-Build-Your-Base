(function () {
  "use strict";

  const API_PORTFOLIOS = "api/portfolios.php";
  const API_ITEMS = "api/items.php";
  const REF_FIELDS = ["whatIDid", "whatILearned", "challenge", "nextStep"];

  const jsonBox = document.querySelector("#item-json");
  const fileInput = document.querySelector("#item-file");
  const checkBtn = document.querySelector("#check-btn");
  const messageBox = document.querySelector("#message");
  const saveForm = document.querySelector("#save-form");
  const emptyHint = document.querySelector("#preview-empty");
  const previewBox = document.querySelector("#preview");
  const select = document.querySelector("#portfolio-select");

  let currentItem = null; // item ที่ผ่านการตรวจแล้ว
  let portfolios = []; // รายการ Portfolio จาก server

  // ---------- แสดงข้อความ (ใช้ textContent ทุกที่) ----------
  function showMessage(type, lines) {
    
    messageBox.replaceChildren();
    const box = document.createElement("div");
    box.className = "alert alert-" + type;
    box.setAttribute("role", "alert");
    if (lines.length === 1) {
      box.textContent = lines[0];
    } else {
      const ul = document.createElement("ul");
      ul.className = "mb-0";
      lines.forEach(function (text) {
        const li = document.createElement("li");
        li.textContent = text;
        ul.appendChild(li);
      });
      box.appendChild(ul);
    }
    messageBox.appendChild(box);
    messageBox.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function clearMessage() {
    messageBox.replaceChildren();
  }

  // ---------- ตัวตรวจข้อมูล ----------
  function isNonEmptyString(value) {
    return typeof value === "string" && value.trim() !== "";
  }

  function isValidDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parts = value.split("-").map(Number);
    const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    return (
      date.getUTCFullYear() === parts[0] &&
      date.getUTCMonth() === parts[1] - 1 &&
      date.getUTCDate() === parts[2]
    );
  }

  function isValidUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (e) {
      return false;
    }
  }

  function validateImportedItem(data) {
    const errors = [];

    if (data === null || typeof data !== "object" || Array.isArray(data)) {
      return ["JSON ต้องเป็น Portfolio Item 1 รายการ (ขึ้นต้นด้วย { )"];
    }

    ["title", "type", "date", "role", "description"].forEach(function (key) {
      if (!isNonEmptyString(data[key])) {
        errors.push('ต้องมี "' + key + '" เป็นข้อความที่ไม่ว่าง');
      }
    });
    if (isNonEmptyString(data.title) && data.title.trim().length > 60) {
      errors.push('"title" ต้องมีความยาวไม่เกิน 60 ตัวอักษร');
      }

    if (isNonEmptyString(data.date) && !isValidDate(data.date.trim())) {
      errors.push('"date" ต้องเป็นรูปแบบ YYYY-MM-DD และเป็นวันที่จริง เช่น 2026-11-24');
    }

    if (!Array.isArray(data.skills) || data.skills.length === 0 || !data.skills.every(isNonEmptyString)) {
      errors.push('"skills" ต้องเป็น array ของข้อความ อย่างน้อย 1 รายการ เช่น ["HTML", "CSS"]');
    }

    if (data.reflection === null || typeof data.reflection !== "object" || Array.isArray(data.reflection)) {
      errors.push('"reflection" ต้องเป็น object ที่มี whatIDid, whatILearned, challenge, nextStep');
    } else {
      REF_FIELDS.forEach(function (key) {
        if (typeof data.reflection[key] !== "string") {
          errors.push('"reflection.' + key + '" ต้องเป็นข้อความ');
        }
      });
    }

    if (
      !Array.isArray(data.evidence) ||
      data.evidence.length === 0 ||
      !data.evidence.every(function (url) {
        return typeof url === "string" && isValidUrl(url.trim());
      })
    ) {
      errors.push('"evidence" ต้องเป็น array ของลิงก์ http/https อย่างน้อย 1 รายการ');
    }

    return errors;
  }

  // ตัดช่องว่างและเก็บเฉพาะ field ที่ใช้ (id จาก JSON ถูกทิ้ง เพราะ server สร้าง id ใหม่ให้)
  function normalize(data) {
    const reflection = {};
    REF_FIELDS.forEach(function (key) {
      reflection[key] = data.reflection[key].trim();
    });
    return {
      title: data.title.trim(),
      type: data.type.trim(),
      date: data.date.trim(),
      role: data.role.trim(),
      description: data.description.trim(),
      skills: data.skills.map(function (s) { return s.trim(); }),
      reflection: reflection,
      evidence: data.evidence.map(function (u) { return u.trim(); }),
    };
  }

  // ---------- โหลดรายการ Portfolio จาก server ----------
  async function loadPortfolios() {
    try {
      const res = await fetch(API_PORTFOLIOS);
      if (!res.ok) throw new Error("HTTP " + res.status);
      portfolios = await res.json();
    } catch (e) {
      portfolios = [];
      showMessage("danger", [
        "เชื่อมต่อ Server ไม่ได้ กรุณาเปิดเว็บผ่าน http://localhost:8000 (php -S localhost:8000) ไม่ใช่ Live Server",
      ]);
      return;
    }

    const keep = select.value;
    select.replaceChildren(new Option("-- เลือกสมาชิก / Portfolio --", ""));

    // สมาชิกในกลุ่มมี id รูปแบบ m001, m002 ... ส่วน Portfolio ที่สร้างเองเป็น p001, ...
    const memberGroup = document.createElement("optgroup");
    memberGroup.label = "สมาชิกในกลุ่ม";
    const otherGroup = document.createElement("optgroup");
    otherGroup.label = "Portfolio อื่น ๆ";
    portfolios.forEach(function (p) {
      const option = new Option(p.displayName || p.name || p.id, p.id);
      (/^m\d+$/.test(p.id) ? memberGroup : otherGroup).appendChild(option);
    });
    if (memberGroup.children.length > 0) select.appendChild(memberGroup);
    if (otherGroup.children.length > 0) select.appendChild(otherGroup);
    if (keep) select.value = keep;

    if (portfolios.length === 0) {
      showMessage("warning", ["ยังไม่มี Portfolio กรุณาสร้าง Portfolio ก่อน"]);
    }
  }

  // ---------- ตัวอย่างก่อนบันทึก ----------
  function addRow(label, value) {
    const row = document.createElement("div");
    row.className = "mb-2";
    const strong = document.createElement("strong");
    strong.textContent = label + ": ";
    row.appendChild(strong);
    row.appendChild(document.createTextNode(value));
    previewBox.appendChild(row);
  }

  function showPreview(item) {
    previewBox.replaceChildren();
    addRow("ชื่อผลงาน", item.title);
    addRow("ประเภท", item.type);
    addRow("วันที่", item.date);
    addRow("บทบาท", item.role);
    addRow("รายละเอียด", item.description);
    addRow("ทักษะ", item.skills.join(", "));
    addRow("หลักฐาน", item.evidence.join(", "));

    REF_FIELDS.forEach(function (key) {
      document.querySelector("#ref-" + key).value = item.reflection[key];
    });

    emptyHint.classList.add("d-none");
    saveForm.classList.remove("d-none");
  }

  function resetPreview() {
    currentItem = null;
    saveForm.classList.add("d-none");
    emptyHint.classList.remove("d-none");
  }

  // ---------- ตรวจรายการซ้ำใน Portfolio เดียวกัน ----------
  function findDuplicate(portfolioId, item) {
    const portfolio = portfolios.find(function (p) { return p.id === portfolioId; });
    if (!portfolio || !Array.isArray(portfolio.items)) return null;
    const key = function (s) { return String(s).trim().toLowerCase(); };
    return (
      portfolio.items.find(function (it) {
        return (
          key(it.title) === key(item.title) &&
          key(it.date) === key(item.date) &&
          key(it.role) === key(item.role)
        );
      }) || null
    );
  }

  // ---------- เลือกไฟล์ .json ----------
  fileInput.addEventListener("change", function () {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      jsonBox.value = String(reader.result);
      clearMessage();
      resetPreview();
    };
    reader.onerror = function () {
      showMessage("danger", ["อ่านไฟล์ไม่สำเร็จ"]);
    };
    reader.readAsText(file);
  });

  // ---------- ปุ่มตรวจสอบ JSON ----------
  checkBtn.addEventListener("click", function () {
    clearMessage();
    resetPreview();

    const text = jsonBox.value.trim();
    if (text === "") {
      showMessage("danger", ["กรุณาวาง JSON หรือเลือกไฟล์ก่อน"]);
      return;
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      showMessage("danger", ["JSON ผิดรูปแบบ ตรวจเครื่องหมาย { } [ ] , และเครื่องหมายคำพูด แล้วลองใหม่"]);
      return;
    }

    const errors = validateImportedItem(data);
    if (errors.length > 0) {
      showMessage("danger", errors);
      return;
    }

    currentItem = normalize(data);
    showPreview(currentItem);

    const notes = ["JSON ถูกต้อง กรุณาเลือก Portfolio ตรวจและแก้ Reflection แล้วกดบันทึก"];
    if (currentItem.evidence.length > 3) {
      notes.push("หมายเหตุ: Server เก็บหลักฐานได้สูงสุด 3 ลิงก์ จะบันทึกเฉพาะ 3 ลิงก์แรก");
    }
    showMessage(currentItem.evidence.length > 3 ? "warning" : "success", notes);
  });

  // ---------- บันทึกลง server ----------
  saveForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    clearMessage();

    if (!currentItem) {
      showMessage("danger", ["กรุณาตรวจสอบ JSON ก่อน"]);
      return;
    }

    const portfolioId = select.value;
    if (portfolioId === "") {
      showMessage("danger", ["กรุณาเลือก Portfolio ปลายทาง"]);
      return;
    }

    const reflection = {};
    const empties = [];
    REF_FIELDS.forEach(function (key) {
      reflection[key] = document.querySelector("#ref-" + key).value.trim();
      if (reflection[key] === "") empties.push("กรุณากรอก Reflection ช่อง " + key);
    });
    if (empties.length > 0) {
      showMessage("danger", empties);
      return;
    }

    const submitBtn = saveForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
      // ดึงข้อมูลล่าสุดก่อนตรวจรายการซ้ำ
      await loadPortfolios();
      const dup = findDuplicate(portfolioId, currentItem);
      if (dup && !confirm('พบผลงานที่คล้ายกันใน Portfolio นี้แล้ว ("' + dup.title + '") ต้องการบันทึกซ้ำหรือไม่?')) {
        showMessage("warning", ["ยกเลิกการบันทึก เพื่อไม่ให้เกิดรายการซ้ำ"]);
        return;
      }

      const payload = {
        portfolioId: portfolioId,
        title: currentItem.title,
        type: currentItem.type,
        date: currentItem.date,
        role: currentItem.role,
        description: currentItem.description,
        skills: currentItem.skills,
        reflection: reflection,
        evidence: currentItem.evidence.slice(0, 3),
      };

      const res = await fetch(API_ITEMS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok) {
        const lines = result.errors
          ? Object.values(result.errors).map(String)
          : [result.error || "HTTP " + res.status];
        showMessage("danger", ["บันทึกไม่สำเร็จ:"].concat(lines));
        return;
      }

      showMessage("success", ['บันทึกสำเร็จ: "' + result.title + '" ถูกเพิ่มใน Portfolio แล้ว']);
      jsonBox.value = "";
      fileInput.value = "";
      resetPreview();
      await loadPortfolios();
    } catch (e) {
      showMessage("danger", ["เชื่อมต่อ Server ไม่ได้ ลองใหม่อีกครั้ง"]);
    } finally {
      submitBtn.disabled = false;
    }
  });

  loadPortfolios();
})();