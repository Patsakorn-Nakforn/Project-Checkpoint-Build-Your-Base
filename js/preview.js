(function () {
  document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("item-form");
    const box = document.getElementById("item-preview");
    if (!form || !box) return;

    
    function readItem() {
      const value = function (id) {
        const el = document.getElementById(id);
        return el ? el.value.trim() : "";
      };
      return {
        title: value("title"),
        type: value("type"),
        date: value("date"),
        role: value("role"),
        description: value("description"),
        skills: value("skills")
          .split(",")
          .map(function (s) { return s.trim(); })
          .filter(function (s) { return s !== ""; }),
        reflection: {
          whatIDid: value("whatIDid"),
          whatILearned: value("whatILearned"),
          challenge: value("challenge"),
          nextStep: value("nextStep")
        },
        evidence: [value("evidence1"), value("evidence2"), value("evidence3")]
          .filter(function (u) { return u !== ""; })
      };
    }

    
    function esc(text) {
      return String(text)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

   
    function urlOk(url) {
      if (typeof isValidUrl === "function") return isValidUrl(url);
      return /^https?:\/\/[^\s.]+\.[^\s]+$/.test(url);
    }

    
    function orHint(text, hint) {
      return text ? esc(text) : '<span class="text-muted fst-italic">' + hint + "</span>";
    }

    function render() {
      const item = readItem();
      const r = item.reflection;

      const skills = item.skills.length
        ? item.skills.map(function (s) {
            return '<span class="badge bg-primary me-1">' + esc(s) + "</span>";
          }).join("")
        : '<span class="text-muted fst-italic small">No skills yet</span>';

      const evidence = item.evidence.length
        ? item.evidence.map(function (u) {
            return urlOk(u)
              ? '<li><a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + esc(u) + "</a></li>"
              : '<li class="text-danger">' + esc(u) + " (invalid link)</li>";
          }).join("")
        : '<li class="text-muted fst-italic">No evidence yet</li>';

      box.innerHTML =
        '<div class="card shadow-sm">' +
          '<div class="card-body p-4">' +
            '<span class="badge bg-primary mb-2">' + (item.type ? esc(item.type) : "Type") + "</span>" +
            '<h3 class="h5 fw-bold">' + orHint(item.title, "Title") + "</h3>" +
            '<p class="text-muted small">Date: ' + orHint(item.date, "YYYY-MM-DD") + "</p>" +
            "<p><strong>Role:</strong> " + orHint(item.role, "Role") + "</p>" +
            "<p>" + orHint(item.description, "Description") + "</p>" +
            '<p class="fw-bold mb-2">Skills</p>' + skills +
            "<hr>" +
            "<details>" +
              '<summary class="fw-bold">Reflection</summary>' +
              '<div class="mt-3 small">' +
                "<p><strong>What I did:</strong> " + orHint(r.whatIDid, "-") + "</p>" +
                "<p><strong>What I learned:</strong> " + orHint(r.whatILearned, "-") + "</p>" +
                "<p><strong>Challenge:</strong> " + orHint(r.challenge, "-") + "</p>" +
                '<p class="mb-0"><strong>Next Step:</strong> ' + orHint(r.nextStep, "-") + "</p>" +
              "</div>" +
            "</details>" +
            "<hr>" +
            '<p class="fw-bold mb-1">Evidence</p>' +
            '<ul class="small mb-0 text-break">' + evidence + "</ul>" +
          "</div>" +
        "</div>";
    }

    form.addEventListener("input", render);   
    form.addEventListener("change", render);  
    form.addEventListener("reset", function () {
      setTimeout(render, 0);                  
    });

    render(); 
  });
})();