document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("portfolio-form");
  if (!form) return;

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const data = new FormData(form);
    const profile = {
      name: (data.get("name") || "").trim(),
      enjoy: (data.get("enjoy") || "").trim(),
      tried: (data.get("tried") || "").trim(),
      curious: (data.get("curious") || "").trim()
    };

    const result = validatePortfolio(profile);
    if (!result.valid) {
      showErrors(form, result.errors);
      return;
    }
    clearErrors(form);

    const portfolio = addPortfolio(profile);
    location.href = "portfolio.html?id=" + encodeURIComponent(portfolio.id) + "&created=1";
  });

  form.addEventListener("reset", function () { clearErrors(form); });
});

function hasValidation() {
  return typeof Validation !== "undefined" && typeof Validation.validatePortfolio === "function";
}
function hasStorage() {
  return typeof Storage !== "undefined" && typeof Storage.addPortfolio === "function";
}

function validatePortfolio(profile) {
  if (hasValidation()) return Validation.validatePortfolio(profile);
  const errors = {};
  if (!profile.name) errors.name = "Please enter a display name.";
  else if (profile.name.length > 60) errors.name = "The name must be 60 characters or fewer.";
  if (!profile.enjoy) errors.enjoy = "Please tell us what you enjoy.";
  if (!profile.tried) errors.tried = "Please tell us what you have tried.";
  if (!profile.curious) errors.curious = "Please tell us what you are curious about.";
  return { valid: Object.keys(errors).length === 0, errors: errors };
}

function showErrors(form, errors) {
  if (hasValidation()) return Validation.showErrors(form, errors);
  clearErrors(form);
  let first = null;
  Object.keys(errors).forEach(function (field) {
    const input = form.querySelector('[name="' + field + '"]');
    const message = form.querySelector('[data-error-for="' + field + '"]');
    if (input) { input.classList.add("is-invalid"); if (!first) first = input; }
    if (message) message.textContent = errors[field];
  });
  const summary = form.querySelector("[data-error-summary]");
  if (summary) {
    summary.textContent = "Cannot save yet: " + Object.keys(errors).length +
      " field(s) need fixing (see the red messages below each field).";
    summary.classList.remove("d-none");
  }
  if (first) first.focus();
}

function clearErrors(form) {
  if (hasValidation()) return Validation.clearErrors(form);
  form.querySelectorAll(".is-invalid").forEach(function (el) { el.classList.remove("is-invalid"); });
  form.querySelectorAll("[data-error-for]").forEach(function (el) { el.textContent = ""; });
  const summary = form.querySelector("[data-error-summary]");
  if (summary) { summary.textContent = ""; summary.classList.add("d-none"); }
}

function addPortfolio(profile) {
  if (hasStorage()) return Storage.addPortfolio(profile);
  const KEY = "powerup.portfolios";
  let list;
  try {
    list = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(list)) list = [];
  } catch (err) {
    list = [];
  }
  let max = 0;
  list.forEach(function (p) {
    const m = /^p(\d+)$/.exec(p.id || "");
    if (m) max = Math.max(max, Number(m[1]));
  });
  const portfolio = {
    id: "p" + String(max + 1).padStart(3, "0"),
    name: profile.name,
    enjoy: profile.enjoy,
    tried: profile.tried,
    curious: profile.curious,
    items: []
  };
  list.push(portfolio);
  localStorage.setItem(KEY, JSON.stringify(list));
  return portfolio;
}