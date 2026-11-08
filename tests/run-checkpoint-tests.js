#!/usr/bin/env node
// run-checkpoint-tests.js (#25)
// รันเทสต์ T1-T12 บนเว็บจริงด้วยเบราว์เซอร์ (Playwright) เก็บภาพลง docs/evidence/ และสร้าง docs/TEST_PLAN.md
// ใช้: node run-checkpoint-tests.js <base-url> <commit-sha> [evidence-dir] [plan-file]
const fs = require("fs");
const os = require("os");
const path = require("path");
const { chromium, firefox, devices } = require("playwright");

const base = (process.argv[2] || "").replace(/\/$/, "");
const sha = process.argv[3] || "____";
const outDir = process.argv[4] || path.join("docs", "evidence");
const planPath = process.argv[5] || path.join("docs", "TEST_PLAN.md");
if (!base) {
  console.log("ใช้: node run-checkpoint-tests.js <base-url> <commit-sha> [evidence-dir] [plan-file]");
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(path.dirname(planPath), { recursive: true });

const KEY = "powerup.portfolios";
const results = [];
const rec = (id, title, expected, pass, note, files) =>
  results.push({ id, title, expected, pass, note, files });

const store = (p) =>
  p.evaluate((k) => {
    try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch (e) { return null; }
  }, KEY);
const clear = (p) => p.evaluate(() => localStorage.clear());
const wait = (p, ms = 350) => p.waitForTimeout(ms);

async function shot(page, name) {
  await page.addStyleTag({ content: ".sticky-top{position:static!important}" }).catch(() => {});
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(outDir, name), fullPage: true });
  return name;
}

// เรนเดอร์ข้อมูลใน localStorage จริงเป็นภาพ (แทนการแคปแผง Application)
async function shotStorage(ctx, page, name) {
  const data = await page.evaluate((k) => ({
    url: location.href,
    portfolios: localStorage.getItem(k),
    currentId: localStorage.getItem("powerup.currentId"),
  }), KEY);
  let pretty = data.portfolios;
  try { pretty = JSON.stringify(JSON.parse(data.portfolios), null, 2); } catch (e) { /* ไม่ใช่ JSON */ }
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const view = await ctx.newPage();
  await view.setViewportSize({ width: 1000, height: 600 });
  await view.setContent(
    `<body style="font:13px monospace;padding:16px"><b>localStorage ของ ${esc(data.url)}</b><br>` +
    `powerup.currentId = ${esc(data.currentId)}<br><b>powerup.portfolios =</b><pre>${esc(pretty)}</pre></body>`
  );
  await view.screenshot({ path: path.join(outDir, name), fullPage: true });
  await view.close();
  return name;
}

async function createPortfolio(page, name) {
  await page.goto(`${base}/create-portfolio.html`);
  await page.fill("#pf-name", name);
  await page.fill("#pf-enjoy", `enjoy ${name}`);
  await page.fill("#pf-tried", `tried ${name}`);
  await page.fill("#pf-curious", `curious ${name}`);
  await Promise.all([page.waitForURL(/portfolio\.html/), page.click("#portfolio-form [type=submit]")]);
}

async function fillItem(page, pid, o = {}) {
  await page.goto(`${base}/add-item.html`);
  await page.selectOption("#portfolio-select", pid);
  const type = await page.evaluate(() => [...document.querySelectorAll("#type option")].map((x) => x.value).filter(Boolean)[0]);
  await page.selectOption("#type", type);
  await page.fill("#title", o.title || "Test item");
  await page.fill("#date", o.date || "2026-10-18");
  await page.fill("#role", "Developer");
  await page.fill("#description", `desc ${o.title || "Test item"}`);
  await page.fill("#skills", o.skills || "HTML, CSS ,");
  for (const k of ["whatIDid", "whatILearned", "challenge", "nextStep"]) await page.fill(`#${k}`, `${k} ${o.title || ""}`);
  await page.fill("#evidence1", o.ev1 ?? "https://github.com/a/b");
  await page.fill("#evidence2", o.ev2 ?? "");
  await page.fill("#evidence3", "");
}
const submitItem = (page) => page.click("#item-form [type=submit]");
const addItem = async (page, pid, o) => {
  await fillItem(page, pid, o);
  await Promise.all([page.waitForURL(/portfolio\.html/), submitItem(page)]);
};

(async () => {
  const browser = await chromium.launch();
  const browserInfo = `Chromium ${browser.version()} (Playwright)`;
  const errors = [];
  const dialogs = [];
  const watch = (p) => {
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("dialog", (d) => { dialogs.push(d.message()); d.accept(); });
  };

  // ---------- T1-T5, T8, T9 (หน้าต่างเดียวกัน) ----------
  let ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  let page = await ctx.newPage();
  watch(page);

  // T1
  await page.goto(`${base}/create-portfolio.html`);
  await clear(page);
  await page.reload();
  await page.click("#portfolio-form [type=submit]");
  await wait(page);
  let invalid = await page.locator("#portfolio-form .is-invalid").count();
  let n = (await store(page)).length;
  rec("T1", "สร้าง Portfolio ตอนฟอร์มว่าง", "แจ้งเตือน 4 ช่อง ไม่บันทึก", invalid === 4 && n === 0,
    `ช่องที่แจ้งเตือน ${invalid}/4, จำนวน Portfolio ใน localStorage = ${n}`,
    [await shot(page, "t01-empty-create.png"), await shotStorage(ctx, page, "t01-storage.png")]);

  // T2
  await page.fill("#pf-name", "a".repeat(61));
  const typed = await page.inputValue("#pf-name");
  for (const id of ["enjoy", "tried", "curious"]) await page.fill(`#pf-${id}`, "test");
  await Promise.all([page.waitForURL(/portfolio\.html/), page.click("#portfolio-form [type=submit]")]);
  const s2 = await store(page);
  const len = s2 && s2[0] ? s2[0].name.length : -1;
  rec("T2", "ชื่อยาวเกิน 60 ตัวอักษร", "ชื่อที่บันทึกยาวไม่เกิน 60", len > 0 && len <= 60,
    `พิมพ์ 61 ตัว ช่องรับ ${typed.length} ตัว (maxlength=60) ชื่อที่บันทึกยาว ${len} ตัว`,
    [await shot(page, "t02-name-60.png"), await shotStorage(ctx, page, "t02-storage.png")]);
  await clear(page);

  // T3
  await createPortfolio(page, "test-T3");
  await page.goto(`${base}/add-item.html`);
  await submitItem(page);
  await wait(page);
  invalid = await page.locator("#item-form .is-invalid").count();
  const summary = await page.locator("#error-summary:not(.d-none)").count();
  let items = (await store(page))[0].items.length;
  rec("T3", "เพิ่ม Item ตอนฟอร์มว่าง", "error ทุกช่องบังคับ มีกล่องสรุป ไม่บันทึก", invalid >= 10 && summary === 1 && items === 0,
    `ช่องที่แจ้งเตือน ${invalid} ช่อง, กล่องสรุป error ${summary ? "แสดง" : "ไม่แสดง"}, จำนวน item = ${items}`,
    [await shot(page, "t03-empty-item.png"), await shotStorage(ctx, page, "t03-storage-no-item.png")]);

  // T4
  const t4 = []; const f4 = [];
  let ok4 = true;
  for (const [u, file] of [["abc", "t04-url-abc.png"], ["www.x.com", "t04-url-www.png"], ["ftp://x.com", "t04-url-ftp.png"]]) {
    await fillItem(page, "p001", { title: "U", ev1: u });
    await submitItem(page); await wait(page);
    const red = await page.locator("#evidence1.is-invalid").count();
    items = (await store(page))[0].items.length;
    const good = red === 1 && items === 0 && /add-item/.test(page.url());
    ok4 = ok4 && good; t4.push(`${u} → ${good ? "ไม่ผ่าน (ถูกต้อง)" : "ผ่าน (ผิด)"}`);
    f4.push(await shot(page, file));
  }
  await fillItem(page, "p001", { title: "U", ev1: "https://github.com/a/b", ev2: "abc" });
  await submitItem(page); await wait(page);
  const r1 = await page.locator("#evidence1.is-invalid").count();
  const r2 = await page.locator("#evidence2.is-invalid").count();
  items = (await store(page))[0].items.length;
  const good2 = r1 === 0 && r2 === 1 && items === 0;
  ok4 = ok4 && good2; t4.push(`ช่อง1 ถูก + ช่อง2 = abc → ${good2 ? "ไม่ผ่าน กรอบแดงเฉพาะช่อง 2 (ถูกต้อง)" : "ผิดปกติ"}`);
  f4.push(await shot(page, "t04-url-second-invalid.png"));
  const dBefore = dialogs.length;
  await addItem(page, "p001", { title: "Valid", ev1: "https://github.com/a/b" });
  items = (await store(page))[0].items.length;
  const good3 = items === 1 && dialogs.length === dBefore;
  ok4 = ok4 && good3; t4.push(`https://github.com/a/b → ${good3 ? "ผ่าน บันทึกได้ ไม่มี alert แทรก (ถูกต้อง)" : "ผิดปกติ"}`);
  f4.push(await shot(page, "t04-url-valid.png"));
  rec("T4", "ตรวจ URL ของ Evidence", "ลิงก์ผิดรูปแบบไม่บันทึก ลิงก์ถูกบันทึกได้", ok4, t4.join("; "), f4);

  // T5
  await clear(page);
  await createPortfolio(page, "test-T5");
  await fillItem(page, "p001", { title: "Future", date: "2099-01-01" });
  await submitItem(page); await wait(page);
  items = (await store(page))[0].items.length;
  const dateRed = await page.locator("#date.is-invalid").count();
  const fn = await page.evaluate(() => typeof isValidDate === "function"
    ? [isValidDate("2026-02-30"), isValidDate("2026-10-18"), isValidUrl("abc"), isValidUrl("https://github.com/a/b")] : null);
  rec("T5", "ตรวจวันที่", "วันที่ไม่มีจริง/อนาคตไม่ผ่าน วันที่ถูกผ่าน",
    items === 0 && dateRed === 1 && JSON.stringify(fn) === "[false,true,false,true]",
    `วันอนาคต 2099-01-01 ${dateRed ? "ถูกปฏิเสธ" : "ไม่ถูกปฏิเสธ"}; Console: isValidDate('2026-02-30')=${fn && fn[0]}, isValidDate('2026-10-18')=${fn && fn[1]}, isValidUrl('abc')=${fn && fn[2]}`,
    [await shot(page, "t05-future-date.png")]);

  // T8
  await page.evaluate((k) => localStorage.setItem(k, "{bad"), KEY);
  const e0 = errors.length;
  await page.goto(`${base}/index.html`); await wait(page, 600);
  const t8shot = await shot(page, "t08-corrupt-index.png");
  await page.goto(`${base}/portfolio.html`); await wait(page);
  await page.goto(`${base}/add-item.html`); await wait(page);
  rec("T8", "localStorage มีค่าเสีย", "หน้าไม่พัง ไม่มี JS error",
    errors.length === e0, `JS error ใหม่ ${errors.length - e0} รายการ (ระบบรีเซ็ตข้อมูลเสียและโหลดข้อมูลตัวอย่างให้เอง)`, [t8shot]);

  // T9
  await clear(page);
  await createPortfolio(page, "<b>x</b>");
  await fillItem(page, "p001", { title: '<img src=x onerror="window.__xss=1">' });
  await wait(page);
  const prevXss = await page.evaluate(() => window.__xss === undefined);
  await Promise.all([page.waitForURL(/portfolio\.html/), submitItem(page)]);
  await wait(page, 500);
  const chk = () => page.evaluate(() => ({
    bold: [...document.querySelectorAll("b")].filter((e) => e.textContent === "x").length,
    xss: window.__xss !== undefined,
  }));
  const cp = await chk();
  const f9 = [await shot(page, "t09-xss-portfolio.png")];
  await page.goto(`${base}/index.html`); await wait(page, 500);
  const ci = await chk();
  f9.push(await shot(page, "t09-xss-home.png"));
  rec("T9", "ข้อความที่เป็น HTML ถูก escape", "แสดงเป็นตัวอักษร ไม่เป็นตัวหนา ไม่รันสคริปต์",
    cp.bold === 0 && !cp.xss && ci.bold === 0 && !ci.xss && prevXss,
    `หน้า Portfolio: ตัวหนา ${cp.bold}, สคริปต์รัน ${cp.xss}; หน้าแรก: ตัวหนา ${ci.bold}, สคริปต์รัน ${ci.xss}; Live Preview สคริปต์รัน ${!prevXss}`, f9);
  await ctx.close();

  // ---------- T6-T7 (อัดวิดีโอคลิป) ----------
  const slow = await chromium.launch({ slowMo: 150 });
  const vdir = fs.mkdtempSync(path.join(os.tmpdir(), "vid-"));
  ctx = await slow.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: vdir, size: { width: 1280, height: 800 } } });
  page = await ctx.newPage(); watch(page);
  await page.goto(`${base}/create-portfolio.html`);
  await clear(page);
  await createPortfolio(page, "Mint");
  await createPortfolio(page, "Bee");
  // Live Preview (#23)
  await page.goto(`${base}/add-item.html`);
  await page.selectOption("#portfolio-select", "p001");
  await page.fill("#title", "Preview title");
  await page.fill("#skills", "HTML, CSS");
  await page.fill("#evidence1", "abc");
  await wait(page, 500);
  const pv = await page.locator("#item-preview").innerText();
  const pvRed = await page.locator("#item-preview .text-danger").count();
  const previewOk = pv.includes("Preview title") && pv.includes("HTML") && pvRed >= 1;
  const previewShot = await shot(page, "t06-preview.png");
  const rows = [["p001", "A1", "https://a1.example.com"], ["p001", "A2", "https://a2.example.com"],
    ["p002", "B1", "https://b1.example.com"], ["p002", "B2", "https://b2.example.com"]];
  const dBefore6 = dialogs.length;
  for (const [pid, t, ev] of rows) await addItem(page, pid, { title: t, ev1: ev });
  const noAlert = dialogs.length === dBefore6;
  let s6 = await store(page);
  const f6 = [previewShot, await shotStorage(ctx, page, "t06-storage.png")];
  const it = s6[0].items[0];
  const contract = ["id", "title", "type", "date", "role", "description", "skills", "reflection", "evidence"].every((k) => k in it) &&
    JSON.stringify(it.skills) === '["HTML","CSS"]' && ["whatIDid", "whatILearned", "challenge", "nextStep"].every((k) => k in it.reflection) && Array.isArray(it.evidence);
  const sep = s6[0].items.every((i) => i.evidence[0].includes("//a")) && s6[1].items.every((i) => i.evidence[0].includes("//b"));
  await page.goto(`${base}/index.html`); await wait(page, 500);
  const cards = await page.locator("#portfolio-list .card").count();
  f6.push(await shot(page, "t06-home-2cards.png"));
  await page.goto(`${base}/portfolio.html?id=p001`); await wait(page, 500);
  const tA = await page.locator("body").innerText();
  f6.push(await shot(page, "t06-portfolio-p001.png"));
  await page.goto(`${base}/portfolio.html?id=p002`); await wait(page, 500);
  const tB = await page.locator("body").innerText();
  f6.push(await shot(page, "t06-portfolio-p002.png"));
  const split = tA.includes("A1") && tA.includes("A2") && !tA.includes("B1") && tB.includes("B1") && tB.includes("B2") && !tB.includes("A1");
  rec("T6", "2 Portfolios × 2 Items ไม่ปนกัน", "แต่ละหน้าแสดงเฉพาะของตัวเอง id ถูกต้อง JSON ตามสเปก",
    s6.length === 2 && s6.every((p) => p.items.length === 2) && s6[0].id === "p001" && s6[1].id === "p002" &&
    s6[0].items[0].id === "item001" && s6[1].items[1].id === "item002" && contract && sep && split && cards === 2 && noAlert,
    `Portfolio ${s6.length} (${s6.map((p) => p.id).join(",")}), items ต่อ Portfolio ${s6.map((p) => p.items.map((i) => i.id).join("/")).join(" | ")}, การ์ดหน้าแรก ${cards}, JSON ตามสเปก ${contract}, evidence ไม่ปน ${sep}, หน้าแสดงไม่ปน ${split}, ไม่มี alert แทรก ${noAlert}`, f6);
  rec("T6b", "Live Preview ระหว่างกรอก (#23)", "Preview เปลี่ยนตามที่พิมพ์ ลิงก์ผิดเป็นสีแดง", previewOk,
    `Preview แสดง title/skills ที่พิมพ์ ${pv.includes("Preview title") && pv.includes("HTML")}, ลิงก์ 'abc' แดง ${pvRed >= 1}`, [previewShot]);

  // T7
  await page.goto(`${base}/portfolio.html?id=p002`);
  await page.reload(); await wait(page, 500);
  const afterReload = await page.locator("body").innerText();
  const f7 = [await shot(page, "t07-after-refresh.png")];
  const state = await ctx.storageState();
  const video = page.video();
  await ctx.close();
  await video.saveAs(path.join(outDir, "t06-t07-flow.webm"));
  const ctx2 = await slow.newContext({ viewport: { width: 1280, height: 800 }, storageState: state });
  const p2 = await ctx2.newPage(); watch(p2);
  await p2.goto(`${base}/index.html`); await wait(p2, 500);
  const cards2 = await p2.locator("#portfolio-list .card").count();
  f7.push(await shot(p2, "t07-after-reopen-home.png"));
  await p2.goto(`${base}/portfolio.html?id=p001`); await wait(p2, 500);
  const reopen = await p2.locator("body").innerText();
  f7.push(await shot(p2, "t07-after-reopen-p001.png"));
  rec("T7", "Save → Refresh → Load", "ข้อมูล 2×2 ครบหลัง Refresh และหลังปิด-เปิดเบราว์เซอร์ใหม่",
    afterReload.includes("B1") && afterReload.includes("B2") && cards2 === 2 && reopen.includes("A1") && reopen.includes("A2"),
    `Refresh แล้วหน้า p002 ยังมี B1,B2; เปิดเบราว์เซอร์ใหม่ (จำลองด้วย storageState) การ์ดหน้าแรก ${cards2}, p001 ยังมี A1,A2; คลิป: t06-t07-flow.webm`, f7);
  await ctx2.close(); await slow.close();

  // ---------- T10 ----------
  ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  page = await ctx.newPage(); watch(page);
  const e10 = errors.length;
  await page.goto(`${base}/index.html`); await wait(page, 600);
  const t10Cards = await page.locator("#portfolio-list .card").count();
  const f10 = [await shot(page, "t10-new-browser-home.png")];
  let ffNote = "";
  try {
    const ff = await firefox.launch(); const fp = await (await ff.newContext()).newPage();
    await fp.goto(`${base}/index.html`); await wait(fp, 600);
    await fp.screenshot({ path: path.join(outDir, "t10-firefox-home.png"), fullPage: true });
    f10.push("t10-firefox-home.png"); ffNote = " และ Firefox"; await ff.close();
  } catch (e) { ffNote = " (ไม่ได้ติดตั้ง Firefox: ทดสอบเฉพาะ Chromium ที่ไม่มีข้อมูลเดิม)"; }
  rec("T10", "เปิดจากเบราว์เซอร์/เครื่องใหม่", "ไม่มีข้อมูลเดิม (ข้อจำกัดของ localStorage) แต่แอปไม่พัง", errors.length === e10,
    `เปิดในเบราว์เซอร์ใหม่${ffNote} ได้หน้าแรกปกติ การ์ด ${t10Cards} (ข้อมูลตัวอย่างโหลดอัตโนมัติ) ไม่มี JS error`, f10);
  await ctx.close();

  // ---------- T11 (จำลองมือถือ) ----------
  ctx = await browser.newContext({ ...devices["iPhone 13"] });
  page = await ctx.newPage(); watch(page);
  await page.goto(`${base}/create-portfolio.html`); await clear(page);
  await createPortfolio(page, "Mobile");
  await addItem(page, "p001", { title: "Mobile item" });
  const f11 = []; let overflow = [];
  for (const name of ["index", "create-portfolio", "add-item", "portfolio"]) {
    await page.goto(`${base}/${name}.html`); await wait(page, 500);
    const o = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (o) overflow.push(name);
    f11.push(await shot(page, `t11-mobile-${name}.png`));
  }
  const mItems = (await store(page))[0].items.length;
  rec("T11", "ดูบนมือถือ (จำลอง iPhone 13)", "ใช้งานได้ ไม่มี scroll แนวนอน", overflow.length === 0 && mItems === 1,
    `สร้าง Portfolio และเพิ่ม Item บนจอ 390px ได้ (items = ${mItems}); หน้าที่มี scroll แนวนอน: ${overflow.join(", ") || "ไม่มี"}; ยังต้องทดสอบมือถือจริงเพิ่มเอง`, f11);

  // ---------- T12 ----------
  await ctx.close();
  ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  page = await ctx.newPage(); watch(page);
  await page.goto(`${base}/create-portfolio.html`); await clear(page);
  await createPortfolio(page, "ExportMe");
  await addItem(page, "p001", { title: "Export item" });
  await page.goto(`${base}/portfolio.html?id=p001`); await wait(page, 500);
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#btn-export")]);
  const exportPath = path.join(outDir, "t12-export.json");
  await dl.saveAs(exportPath);
  const f12 = [await shot(page, "t12-export.png")];
  await page.click("#btn-clear"); await wait(page, 600);
  const afterClear = (await store(page)).length;
  f12.push(await shot(page, "t12-after-clear.png"));
  await page.setInputFiles("#file-import", exportPath); await wait(page, 800);
  const restored = await store(page);
  const okMsg = await page.locator("#data-msg.alert-success").count();
  f12.push(await shot(page, "t12-after-import.png"));
  const badFile = path.join(os.tmpdir(), "bad.json"); fs.writeFileSync(badFile, "{}");
  await page.setInputFiles("#file-import", badFile); await wait(page, 600);
  const errMsg = await page.locator("#data-msg.alert-danger").count();
  f12.push(await shot(page, "t12-import-bad.png"));
  rec("T12", "Export → ลบทั้งหมด → Import", "ข้อมูลกลับมาครบ ไฟล์ {} ขึ้นข้อความ error",
    afterClear === 0 && restored && restored.some((p) => p.name === "ExportMe" && p.items.length === 1) && okMsg === 1 && errMsg === 1,
    `หลังลบ Portfolio = ${afterClear}; หลัง Import พบ ExportMe พร้อม 1 item ${!!(restored && restored.some((p) => p.name === "ExportMe"))}; Import {} ขึ้น error ${errMsg === 1}; ไฟล์ export: t12-export.json`, f12);
  await ctx.close(); await browser.close();

  // ---------- เขียน TEST_PLAN.md ----------
  const mark = (p) => (p ? "☒ ผ่าน ☐ ไม่ผ่าน" : "☐ ผ่าน ☒ ไม่ผ่าน");
  const lines = [
    "# Test Plan — Project Checkpoint (Issue #25, owner: M7)", "",
    `- ทดสอบบน: ${base}/`,
    `- Commit SHA ที่ทดสอบ: \`${sha}\``,
    `- เบราว์เซอร์: ${browserInfo} · มือถือจริง: \`____________\` (ทดสอบเอง)`,
    "- วิธีทดสอบ: รันสคริปต์ run-checkpoint-tests.js ที่เปิดเบราว์เซอร์จริงทำตามขั้นตอนของแต่ละข้อ แล้วเก็บภาพ/คลิปใน docs/evidence/",
    "- ผู้ทดสอบ: M7 · ผู้ตรวจซ้ำ (Incognito): `____________`", "",
    "ใช้ข้อมูลสมมติเท่านั้น ไม่มีข้อมูลส่วนตัว", "", "---", "",
  ];
  for (const r of results) {
    lines.push(`## ${r.id} ${r.title}`, `**ผลที่ต้องเห็น:** ${r.expected}`, `**ผลที่พบ:** ${r.note}`,
      `**ผล:** ${mark(r.pass)}${r.pass ? "" : " → Bug #___"} · ภาพ: ${r.files.join(", ")}`, "");
  }
  lines.push("---", "", "## สรุปผล", "| ข้อ | หัวข้อ | ผล | Bug issue |", "|---|---|---|---|");
  for (const r of results) lines.push(`| ${r.id} | ${r.title} | ${r.pass ? "ผ่าน" : "ไม่ผ่าน"} | ${r.pass ? "-" : ""} |`);
  lines.push("", "## สิ่งที่ต้องทำเอง", "- ทดสอบมือถือจริง 1 เครื่อง แล้วใส่ภาพ mobile-real-*.png",
    "- คลิป: docs/evidence/t06-t07-flow.webm (อัปโหลดแล้วใส่ลิงก์ที่เปิดได้โดยไม่ต้องขอสิทธิ์): `____________`",
    "- ให้เพื่อนเปิดลิงก์หลักฐานใน Incognito แล้วกรอกชื่อผู้ตรวจซ้ำ");
  fs.writeFileSync(planPath, lines.join("\n") + "\n", "utf8");

  console.table(results.map((r) => ({ id: r.id, title: r.title, result: r.pass ? "PASS" : "FAIL" })));
  console.log(`JS error ที่พบระหว่างทดสอบ: ${errors.length}${errors.length ? "\n- " + [...new Set(errors)].join("\n- ") : ""}`);
  console.log(`ภาพ/คลิป: ${outDir}/  แผนทดสอบ: ${planPath}`);
})().catch((e) => { console.error("สคริปต์หยุดกลางทาง:", e.message); process.exit(1); });
