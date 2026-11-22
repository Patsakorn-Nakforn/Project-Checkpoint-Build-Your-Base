(function () {
  const MEMBER_DATA = [
  {
    "id": "m001",
    "name": "Tanatepon Kongprawet",
    "enjoy": "To be updated",
    "tried": "CS100 Power Up! group project, Website Detective challenge",
    "curious": "To be updated",
    "items": []
  },
  {
    "id": "m002",
    "name": "Kittapat Ongmee",
    "enjoy": "To be updated",
    "tried": "CS100 Power Up! group project, Website Detective challenge",
    "curious": "To be updated",
    "items": []
  },
  {
    "id": "m003",
    "name": "Praphawit Tipaksondecha",
    "enjoy": "To be updated",
    "tried": "CS100 Power Up! group project, Website Detective challenge",
    "curious": "To be updated",
    "items": []
  },
  {
    "id": "m004",
    "name": "Thitiphat Sukkhang",
    "enjoy": "To be updated",
    "tried": "CS100 Power Up! group project, Website Detective challenge",
    "curious": "To be updated",
    "items": []
  },
  {
    "id": "m005",
    "name": "Patsakorn Nakforn",
    "enjoy": "To be updated",
    "tried": "CS100 Power Up! group project, Website Detective challenge",
    "curious": "To be updated",
    "items": []
  },
  {
    "id": "m006",
    "name": "Techit Yookoom",
    "enjoy": "To be updated",
    "tried": "CS100 Power Up! group project, Website Detective challenge",
    "curious": "To be updated",
    "items": []
  },
  {
    "id": "m007",
    "name": "Natdanai Kamonklang",
    "enjoy": "To be updated",
    "tried": "CS100 Power Up! group project, Website Detective challenge",
    "curious": "To be updated",
    "items": []
  }
];

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