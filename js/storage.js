const Storage = (() => {
  const PORTFOLIOS_KEY = "powerup.portfolios";
  const CURRENT_ID_KEY = "powerup.currentId";

  // ที่เก็บข้อมูลกลางบน server (api/sync.php) ทำให้ทุกเครื่องเห็นข้อมูลชุดเดียวกัน
  // ถ้าเปิดเว็บโดยไม่มี PHP (เช่น GitHub Pages หรือเปิดไฟล์ตรง ๆ) จะใช้ localStorage ในเครื่องเหมือนเดิม
  const SYNC_URL = "api/sync.php";
  const REFRESH_MS = 3000; // อ่านจาก server ใหม่ถ้าข้อมูลในเครื่องเก่ากว่านี้
  const MAX_TRIES = 3; // จำนวนครั้งที่ลองใหม่เมื่อมีคนอื่นบันทึกพร้อมกัน

  let online = false; // true = หน้านี้ต่อ server ได้
  let version = null; // เวอร์ชันของข้อมูลบน server ที่อ่านมาล่าสุด
  let lastPull = 0;

  // เรียก server แบบรอผล (synchronous) เพื่อให้ฟังก์ชันของ Storage คืนค่าทันทีเหมือนเดิม
  // คืน { status, json } หรือ null ถ้าเชื่อมต่อไม่ได้
  function http(method, body) {
    try {
      const xhr = new XMLHttpRequest();
      const url = method === "GET" ? SYNC_URL + "?t=" + Date.now() : SYNC_URL;

      xhr.open(method, url, false);

      if (body !== undefined) {
        xhr.setRequestHeader("Content-Type", "application/json");
      }

      xhr.send(body === undefined ? null : JSON.stringify(body));

      let json = null;

      try {
        json = JSON.parse(xhr.responseText);
      } catch (error) {
        json = null;
      }

      return { status: xhr.status, json: json };
    } catch (error) {
      return null;
    }
  }

  function isSyncReply(res) {
    return (
      res &&
      res.json &&
      typeof res.json.version === "string" &&
      Array.isArray(res.json.portfolios)
    );
  }

  // อ่านข้อมูลล่าสุดจาก server มาเก็บในเครื่อง
  function pull() {
    const res = http("GET");

    if (res && res.status === 200 && isSyncReply(res)) {
      online = true;
      version = res.json.version;
      lastPull = Date.now();
      writeLocal(res.json.portfolios);
      return true;
    }

    return false;
  }

  // อ่าน/เขียน localStorage (ใช้เป็นที่พักข้อมูลที่อ่านจาก server มา)
  function readLocal() {
    try {
      const data = localStorage.getItem(PORTFOLIOS_KEY);
      if (!data) return [];

      const portfolios = JSON.parse(data);

      if (!Array.isArray(portfolios)) {
        throw new Error("Invalid portfolio data");
      }

      return portfolios;
    } catch (error) {
      console.warn("Load warning: Invalid portfolio data. Resetting storage.");

      localStorage.setItem(PORTFOLIOS_KEY, JSON.stringify([]));

      return [];
    }
  }

  function writeLocal(portfolios) {
    try {
      localStorage.setItem(PORTFOLIOS_KEY, JSON.stringify(portfolios));
      return true;
    } catch (error) {
      console.error("Save error:", error);
      return false;
    }
  }

  // Load all portfolios
  function loadAll() {
    if (online && Date.now() - lastPull > REFRESH_MS) {
      pull();
    }

    return readLocal();
  }

  // Save all portfolios
  function saveAll(portfolios) {
    if (!online) return writeLocal(portfolios);

    const res = http("POST", { baseVersion: version, portfolios: portfolios });

    if (res && res.status === 200 && isSyncReply(res)) {
      version = res.json.version;
      lastPull = Date.now();
      return writeLocal(res.json.portfolios);
    }

    if (res && res.status === 409 && isSyncReply(res)) {
      // มีคนอื่นบันทึกไปก่อน: เก็บข้อมูลล่าสุดไว้ แล้วให้ผู้เรียกลองใหม่
      version = res.json.version;
      lastPull = Date.now();
      writeLocal(res.json.portfolios);
    } else {
      console.error("Save to server failed:", res);
    }

    return false;
  }

  // อ่านข้อมูลล่าสุด -> แก้ -> บันทึก ถ้ามีคนอื่นบันทึกพร้อมกันจะอ่านใหม่แล้วแก้ซ้ำให้เอง
  // fn(portfolios) แก้ข้อมูลแล้วคืนผลลัพธ์ (คืน null หรือ false = ยกเลิก ไม่บันทึก)
  function mutate(fn, failValue) {
    for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
      if (online) pull();

      const portfolios = readLocal();
      const result = fn(portfolios);

      if (result === null || result === false) return result;
      if (saveAll(portfolios)) return result;
      if (!online) break;
    }

    return failValue;
  }

  // Generate ID
  function generateId(prefix, ids) {
    let max = 0;

    ids.forEach((id) => {
      const match = String(id).match(new RegExp("^" + prefix + "(\\d+)$"));

      if (match) {
        max = Math.max(max, Number(match[1]));
      }
    });

    return prefix + String(max + 1).padStart(3, "0");
  }

  // Add portfolio
  function addPortfolio(data) {
    if (!data || typeof data !== "object") return null;

    return mutate((portfolios) => {
      const portfolio = {
        id: generateId(
          "p",
          portfolios.map((p) => p.id),
        ),
        name: data.name ?? "",
        enjoy: data.enjoy ?? "",
        tried: data.tried ?? "",
        curious: data.curious ?? "",
        items: [],
      };

      portfolios.push(portfolio);

      return portfolio;
    }, null);
  }

  // Delete portfolio
  function deletePortfolio(id) {
    const deleted = mutate((portfolios) => {
      const updated = portfolios.filter((p) => p.id !== id);

      if (updated.length === portfolios.length) return false;

      portfolios.length = 0;
      portfolios.push(...updated);

      return true;
    }, false);

    if (deleted && getCurrentId() === id) {
      localStorage.removeItem(CURRENT_ID_KEY);
    }

    return deleted;
  }

  // Add item to a portfolio

  function addItem(portfolioId, itemData) {
    if (!itemData || typeof itemData !== "object") {
      return null;
    }

    // At least one evidence is required
    const hasEvidence = [
      itemData.evidence1,
      itemData.evidence2,
      itemData.evidence3,
    ].some((url) => typeof url === "string" && url.trim() !== "");

    if (!hasEvidence) {
      console.error("At least one evidence is required");
      return null;
    }

    const skills = Array.isArray(itemData.skills)
      ? itemData.skills
      : (itemData.skills || "")
          .split(",")
          .map((skill) => skill.trim())
          .filter((skill) => skill !== "");

    const evidence = [
      itemData.evidence1,
      itemData.evidence2,
      itemData.evidence3,
    ]
      .filter((url) => typeof url === "string" && url.trim() !== "")
      .map((url) => url.trim());

    return mutate((portfolios) => {
      const portfolio = portfolios.find((p) => p.id === portfolioId);

      if (!portfolio) return null;

      if (!Array.isArray(portfolio.items)) {
        portfolio.items = [];
      }

      const newItem = {
        id: generateId(
          "item",
          portfolio.items.map((item) => item.id),
        ),

        title: itemData.title ?? "",
        type: itemData.type ?? "",
        date: itemData.date ?? "",
        role: itemData.role ?? "",
        description: itemData.description ?? "",

        skills: skills,

        reflection: {
          whatIDid: itemData.whatIDid ?? "",
          whatILearned: itemData.whatILearned ?? "",
          challenge: itemData.challenge ?? "",
          nextStep: itemData.nextStep ?? "",
        },

        evidence: evidence,
      };

      portfolio.items.push(newItem);

      return newItem;
    }, null);
  }

  // Delete item from a specific portfolio
  function deleteItem(portfolioId, itemId) {
    return mutate((portfolios) => {
      const portfolio = portfolios.find((p) => p.id === portfolioId);

      if (!portfolio || !Array.isArray(portfolio.items)) {
        return false;
      }

      const oldLength = portfolio.items.length;

      portfolio.items = portfolio.items.filter((item) => item.id !== itemId);

      if (oldLength === portfolio.items.length) {
        return false;
      }

      return true;
    }, false);
  }

  // Get current portfolio ID (จำแยกตามเบราว์เซอร์ ว่ากำลังเปิด portfolio ไหน)
  function getCurrentId() {
    return localStorage.getItem(CURRENT_ID_KEY);
  }

  // Set current portfolio ID
  function setCurrentId(id) {
    try {
      if (id == null) {
        localStorage.removeItem(CURRENT_ID_KEY);
      } else {
        localStorage.setItem(CURRENT_ID_KEY, id);
      }
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  // Import portfolios
  function importPortfolios(data) {
    try {
      const imported = Array.isArray(data) ? data : data?.portfolios;

      if (!Array.isArray(imported)) return false;

      const portfolios = imported.map((p) => ({
        ...p,
        items: Array.isArray(p.items) ? p.items : [],
      }));

      return mutate((current) => {
        current.length = 0;
        current.push(...portfolios);
        return true;
      }, false);
    } catch (error) {
      console.error("Import error:", error);
      return false;
    }
  }

  // Clear all data (ถ้าต่อ server อยู่ จะลบข้อมูลกลางของทุกเครื่อง)
  function clearAll() {
    try {
      const cleared = mutate((portfolios) => {
        portfolios.length = 0;
        return true;
      }, false);

      localStorage.removeItem(PORTFOLIOS_KEY);
      localStorage.removeItem(CURRENT_ID_KEY);

      if (online) pull();

      return cleared;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  // เชื่อมต่อ server ตอนโหลดหน้า (ถ้าไม่ได้ ใช้ localStorage ในเครื่อง)
  pull();

  return {
    loadAll,
    saveAll,
    addPortfolio,
    deletePortfolio,
    addItem,
    deleteItem,
    getCurrentId,
    setCurrentId,
    importPortfolios,
    clearAll,
    isOnline: () => online,
  };
})();

window.Storage = Storage;