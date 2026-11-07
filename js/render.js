(function () {
  // Helper: สร้าง HTML element อย่างปลอดภัย
  function createElement(tag, className, text) {
    const el = document.createElement(tag);

    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;

    return el;
  }

  // แปลงข้อมูล string เป็น array
  function splitValues(value) {
    if (Array.isArray(value)) return value;
    if (typeof value !== "string") return [];

    return value
      .split(",")
      .map(item => item.trim())
      .filter(Boolean);
  }
  // แปลงวันที่เป็นภาษาไทย
  function formatThaiDate(value) {
    if (!value) return "-";

    const date = new Date(value + "T00:00:00");

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(date);
  }
  // แสดงข้อมูลเป็น Bootstrap badges
  function renderBadges(container, values) {
    container.replaceChildren();

    const items = splitValues(values);

    if (items.length === 0) {
      container.append(
        createElement("span", "text-muted", "No information available.")
      );
      return;
    }

    items.forEach(item => {
      const badge = createElement(
        "span",
        "badge bg-primary me-1 mb-1",
        item
      );
      container.append(badge);
    });
  }

  // 1. RENDER HOME PAGE
  function renderHome() {
    const container = document.getElementById("portfolio-list");

    if (!container) return;

    container.replaceChildren();

    let portfolios = Storage.loadAll();

// โหลดข้อมูลตัวอย่างเมื่อ LocalStorage ยังว่าง
if (
  portfolios.length === 0 &&
  Array.isArray(window.SAMPLE_DATA)
) {
  portfolios = window.SAMPLE_DATA;
  Storage.saveAll(portfolios);
}

    if (portfolios.length === 0) {
      container.append(
        createElement(
          "div",
          "col-12 alert alert-info",
          "No portfolios available. Please create a portfolio first."
        )
      );
      return;
    }

    portfolios.forEach(portfolio => {
      const col = createElement("div", "col-12 col-md-6");

      const card = createElement(
        "div",
        "card shadow-sm border-0 h-100 p-4"
      );

      const name = createElement(
        "h3",
        "fw-bold",
        portfolio.name || "Unnamed Portfolio"
      );

      const itemCount = Array.isArray(portfolio.items)
        ? portfolio.items.length
        : 0;

      const count = createElement(
        "p",
        "text-secondary",
        itemCount + " Portfolio Items"
      );

      const enjoyTitle = createElement(
        "div",
        "fw-bold mb-2",
        "What I Enjoy"
      );

      const enjoy = createElement("div", "mb-3");
      renderBadges(enjoy, portfolio.enjoy);

      const triedTitle = createElement(
        "div",
        "fw-bold mb-2",
        "What I've Tried"
      );

      const tried = createElement(
        "p",
        "text-secondary mb-3",
        portfolio.tried || "No information available."
      );

      const curiousTitle = createElement(
        "div",
        "fw-bold mb-2",
        "What I'm Curious About"
      );

      const curious = createElement("div", "mb-4");
      renderBadges(curious, portfolio.curious);

      const buttons = createElement(
        "div",
        "d-flex gap-2 mt-auto"
      );

      const viewLink = createElement(
        "a",
        "btn btn-primary flex-fill",
        "View Portfolio"
      );

      viewLink.href =
        "portfolio.html?id=" + encodeURIComponent(portfolio.id);

      const addLink = createElement(
        "a",
        "btn btn-outline-primary flex-fill",
        "Add Item"
      );

      addLink.href =
        "add-item.html?id=" + encodeURIComponent(portfolio.id);

      buttons.append(viewLink, addLink);

      card.append(
        name,
        count,
        enjoyTitle,
        enjoy,
        triedTitle,
        tried,
        curiousTitle,
        curious,
        buttons
      );

      col.append(card);
      container.append(col);
    });
  }

  // 2. RENDER PORTFOLIO ITEMS
  function renderPortfolioItems(portfolio) {
    const container = document.getElementById("portfolio-items");

    if (!container) return;

    container.replaceChildren();

    const items = Array.isArray(portfolio.items)
      ? portfolio.items
      : [];

    if (items.length === 0) {
      container.append(
        createElement(
          "div",
          "col-12 alert alert-info",
          "No portfolio items available."
        )
      );
      return;
    }

    items.forEach(item => {
      const col = createElement("div", "col-12 col-md-6");

      const card = createElement(
        "div",
        "card h-100 shadow-sm"
      );

      const body = createElement("div", "card-body p-4");

      const type = createElement(
        "span",
        "badge bg-primary mb-2",
        item.type || "Portfolio"
      );

      const title = createElement(
        "h3",
        "h5 fw-bold",
        item.title || "Untitled"
      );

      const date = createElement(
        "p",
        "text-muted small",
        "Date: " + formatThaiDate(item.date)
      );

      const role = createElement("p");
      const roleLabel = createElement("strong", "", "Role: ");
      role.append(roleLabel, document.createTextNode(item.role || "-"));

      const description = createElement(
        "p",
        "",
        item.description || ""
      );

      const skillsTitle = createElement(
        "p",
        "fw-bold mb-2",
        "Skills"
      );

      const skills = createElement("div", "mb-3");
      renderBadges(skills, item.skills);

      const divider = createElement("hr");

      const details = createElement("details");

      const summary = createElement(
        "summary",
        "fw-bold",
        "Reflection"
      );

      const reflection = createElement("div", "mt-3");

      const reflectionData = item.reflection || {};

      [
        ["What I did:", reflectionData.whatIDid],
        ["What I learned:", reflectionData.whatILearned],
        ["Challenge:", reflectionData.challenge],
        ["Next Step:", reflectionData.nextStep]
      ].forEach(([label, value]) => {
        const p = createElement("p");
        p.append(
          createElement("strong", "", label),
          document.createTextNode(" " + (value || "-"))
        );
        reflection.append(p);
      });

      details.append(summary, reflection);

      const evidenceDivider = createElement("hr");

      const evidence = createElement("div", "mb-3");

      const evidenceList = Array.isArray(item.evidence)
        ? item.evidence
        : [];

      if (evidenceList.length === 0) {
        evidence.textContent = "No evidence available.";
      } else {
        evidenceList.forEach((url, index) => {
          try {
            const parsed = new URL(url, location.href);

            if (!["http:", "https:"].includes(parsed.protocol)) {
              return;
            }

            const link = createElement(
              "a",
              "d-block mb-1",
              "View Evidence " + (index + 1)
            );

            link.href = parsed.href;
            link.target = "_blank";
            link.rel = "noopener noreferrer";

            evidence.append(link);
          } catch (error) {
            console.warn("Invalid evidence URL:", url);
          }
        });
      }

      const deleteButton = createElement(
        "button",
        "btn btn-outline-danger btn-sm mt-2",
        "Delete Item"
      );

      deleteButton.type = "button";

      deleteButton.addEventListener("click", () => {
        if (!confirm("Are you sure you want to delete this item?")) {
          return;
        }

        const success = Storage.deleteItem(
          portfolio.id,
          item.id
        );

        if (success) {
          renderPortfolio();
        } else {
          alert("Unable to delete item.");
        }
      });

      body.append(
        type,
        title,
        date,
        role,
        description,
        skillsTitle,
        skills,
        divider,
        details,
        evidenceDivider,
        evidence,
        deleteButton
      );

      card.append(body);
      col.append(card);
      container.append(col);
    });
  }

  // 3. RENDER SELECTED PORTFOLIO
  function renderPortfolio() {
    const nameEl = document.getElementById("profile-name");

    if (!nameEl) return;

    const portfolios = Storage.loadAll();

    const params = new URLSearchParams(location.search);

    const requestedId = params.get("id");

    const portfolioId =
      requestedId ||
      Storage.getCurrentId() ||
      (portfolios[0] && portfolios[0].id);

    const portfolio = portfolios.find(
      p => p.id === portfolioId
    );

    if (!portfolio) {
      nameEl.textContent = "Portfolio Not Found";

      const items = document.getElementById("portfolio-items");

      if (items) {
        items.replaceChildren(
          createElement(
            "div",
            "alert alert-warning",
            "Portfolio not found. Please return to Home."
          )
        );
      }

      return;
    }

    Storage.setCurrentId(portfolio.id);

    const avatar = document.getElementById("profile-avatar");

    if (avatar) {
      avatar.textContent =
        (portfolio.name || "?").trim().charAt(0).toUpperCase() || "?";
    }

    nameEl.textContent = portfolio.name || "Unnamed Portfolio";

    const welcome = document.getElementById("profile-welcome");

    if (welcome) {
      welcome.textContent = "Welcome to my personal portfolio!";
    }

    renderBadges(
      document.getElementById("enjoy-list"),
      portfolio.enjoy
    );

    const tried = document.getElementById("tried-list");

    if (tried) {
      tried.textContent =
        portfolio.tried || "No information available.";
    }

    renderBadges(
      document.getElementById("curious-list"),
      portfolio.curious
    );

    renderPortfolioItems(portfolio);
  }

  // Expose functions for other scripts
  window.renderHome = renderHome;
  window.renderPortfolio = renderPortfolio;

  // Run when page loads
  document.addEventListener("DOMContentLoaded", () => {
    renderHome();
    renderPortfolio();
  });

})();