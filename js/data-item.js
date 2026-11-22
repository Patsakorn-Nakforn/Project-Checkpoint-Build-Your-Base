const DataItem = (() => {
  function downloadPortfolio(id) {
    const portfolio = Storage.loadAll().find((p) => p.id === id);
    if (!portfolio) return { ok: false, message: "ไม่พบ Portfolio " + id };

    const blob = new Blob([JSON.stringify(portfolio, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "portfolio-" + id + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return { ok: true, filename: a.download };
  }

  return { downloadPortfolio };
})();
