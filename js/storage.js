const Storage = (() => {
  const PORTFOLIOS_KEY = "powerup.portfolios";
  const CURRENT_ID_KEY = "powerup.currentId";

  // Load all portfolios
  function loadAll() {
    try {
      const data = localStorage.getItem(PORTFOLIOS_KEY);
      if (!data) return [];

      const portfolios = JSON.parse(data);

      if (!Array.isArray(portfolios)) {
        throw new Error("Invalid portfolio data");
      }

      return portfolios;
    } catch (error) {
      console.error("Load error:", error);
      localStorage.setItem(PORTFOLIOS_KEY, JSON.stringify([]));
      return [];
    }
  }

  // Save all portfolios
  function saveAll(portfolios) {
    try {
      localStorage.setItem(PORTFOLIOS_KEY, JSON.stringify(portfolios));
      return true;
    } catch (error) {
      console.error("Save error:", error);
      return false;
    }
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

    const portfolios = loadAll();

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

    return saveAll(portfolios) ? portfolio : null;
  }

  // Delete portfolio
  function deletePortfolio(id) {
    const portfolios = loadAll();
    const updated = portfolios.filter((p) => p.id !== id);

    if (updated.length === portfolios.length) return false;
    if (!saveAll(updated)) return false;

    if (getCurrentId() === id) {
      localStorage.removeItem(CURRENT_ID_KEY);
    }

    return true;
  }

  // Add item to a portfolio

  function addItem(portfolioId, itemData) {
    if (!itemData || typeof itemData !== "object") {
      return null;
    }

    const portfolios = loadAll();

    const portfolio = portfolios.find((p) => p.id === portfolioId);

    if (!portfolio) return null;

    if (!Array.isArray(portfolio.items)) {
      portfolio.items = [];
    }

    // Evidence 1 is required
    if (!itemData.evidence1?.trim()) {
      console.error("Evidence 1 is required");
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

    return saveAll(portfolios) ? newItem : null;
  }

  // Delete item from a specific portfolio
  function deleteItem(portfolioId, itemId) {
    const portfolios = loadAll();

    const portfolio = portfolios.find((p) => p.id === portfolioId);

    if (!portfolio || !Array.isArray(portfolio.items)) {
      return false;
    }

    const oldLength = portfolio.items.length;

    portfolio.items = portfolio.items.filter((item) => item.id !== itemId);

    if (oldLength === portfolio.items.length) {
      return false;
    }

    return saveAll(portfolios);
  }

  // Get current portfolio ID
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

      return saveAll(portfolios);
    } catch (error) {
      console.error("Import error:", error);
      return false;
    }
  }

  // Clear all data
  function clearAll() {
    try {
      localStorage.removeItem(PORTFOLIOS_KEY);
      localStorage.removeItem(CURRENT_ID_KEY);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

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
  };
})();

window.Storage = Storage;
