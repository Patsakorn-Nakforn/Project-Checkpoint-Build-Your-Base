/* =========================================================
 * member-data.js — Portfolio of every team member (Group 20)
 * Owner: M3
 *
 * DO NOT EDIT BY HAND: edit data/member-portfolio.json, then run
 *   node scripts/build-member-data.js
 *
 * Every time a page loads, any member portfolio that is missing from
 * localStorage is added (matched by id m001–m007). Portfolios that
 * already exist are never overwritten, so items a member adds stay
 * in that member's own portfolio.
 * Member ids start with "m" so they never clash with portfolios made
 * on the Create Portfolio page (p001, p002, ...).
 * Needs js/storage.js to be loaded first.
 * ========================================================= */
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
    Storage.saveAll(missing.concat(portfolios)); // members first on the Home page
  }
})();
