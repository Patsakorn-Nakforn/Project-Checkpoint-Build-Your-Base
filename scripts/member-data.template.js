(function () {
  const MEMBER_DATA = /*__MEMBER_DATA__*/[];

  window.MEMBER_DATA = MEMBER_DATA;

  if (typeof Storage === "undefined" || typeof Storage.loadAll !== "function") {
    console.warn("member-data.js: load js/storage.js before this file");
    return;
  }

  const portfolios = Storage.loadAll();
  const existing = new Set(portfolios.map((p) => p.id));
  const missing = MEMBER_DATA
    .filter((m) => !existing.has(m.id))
    .map((m) => JSON.parse(JSON.stringify(m)));

  if (missing.length > 0) {
    Storage.saveAll(missing.concat(portfolios)); 
  }
})();