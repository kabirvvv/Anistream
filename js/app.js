// ============================================================
// APP — wires everything together
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  // ── Navigation search ────────────────────────────────────────
  const navSearch = document.getElementById("nav-search");
  const navSearchInput = document.getElementById("nav-search-input");
  const navSearchBtn = document.getElementById("nav-search-btn");
  const suggestBox = document.getElementById("search-suggestions");

  let suggestTimer = null;
  navSearchInput?.addEventListener("input", () => {
    clearTimeout(suggestTimer);
    const q = navSearchInput.value.trim();
    if (q.length < 2) { hideSuggestions(); return; }
    suggestTimer = setTimeout(() => fetchSuggestions(q), 350);
  });
  navSearchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      hideSuggestions();
      const q = navSearchInput.value.trim();
      if (q) Router.navigate(`search?q=${encodeURIComponent(q)}`);
    }
    if (e.key === "Escape") hideSuggestions();
  });
  navSearchBtn?.addEventListener("click", () => {
    const q = navSearchInput.value.trim();
    if (q) Router.navigate(`search?q=${encodeURIComponent(q)}`);
  });
  document.addEventListener("click", (e) => {
    if (!navSearch?.contains(e.target)) hideSuggestions();
  });

  const fetchSuggestions = async (q) => {
    try {
      const data = await API.searchSuggest(q);
      const items = Array.isArray(data) ? data : [];
      if (!items.length) { hideSuggestions(); return; }
      suggestBox.innerHTML = items.slice(0, 8).map((s) => `
        <div class="suggest-item" onclick="Router.navigate('watch?id=${encodeURIComponent(s.id)}');hideSuggestions()">
          <img src="${s.poster}" alt="${s.title}" onerror="this.src='assets/placeholder.svg'">
          <div class="suggest-meta">
            <span class="suggest-title">${s.title}</span>
            <span class="suggest-sub">${s.showType || ""} ${s.releaseDate ? "· " + s.releaseDate : ""}</span>
          </div>
        </div>`).join("");
      suggestBox.classList.add("suggest-box--open");
    } catch { hideSuggestions(); }
  };

  window.hideSuggestions = () => {
    suggestBox?.classList.remove("suggest-box--open");
  };

  // ── Mobile nav toggle ────────────────────────────────────────
  const burger = document.getElementById("burger");
  const navLinks = document.getElementById("nav-links");
  burger?.addEventListener("click", () => {
    navLinks.classList.toggle("nav-links--open");
    burger.classList.toggle("burger--open");
  });

  // Close mobile nav on link click
  document.querySelectorAll(".nav-link").forEach((l) => {
    l.addEventListener("click", () => {
      navLinks.classList.remove("nav-links--open");
      burger?.classList.remove("burger--open");
    });
  });

  // ── Active nav highlighting ──────────────────────────────────
  const highlightNav = (path) => {
    document.querySelectorAll(".nav-link").forEach((l) => {
      l.classList.toggle(
        "nav-link--active",
        l.dataset.route === path || (path === "home" && l.dataset.route === "home")
      );
    });
  };

  // ── Routes ───────────────────────────────────────────────────
  Router.on("home", (p) => { highlightNav("home"); HomePage.render(p); });
  Router.on("anime", (p) => { highlightNav("anime"); AnimePage.render(p); });
  Router.on("watch", (p) => { highlightNav("watch"); WatchPage.render(p); });
  Router.on("search", (p) => { highlightNav("search"); SearchPage.render(p); });
  Router.on("category", (p) => { highlightNav("category"); CategoryPage.render(p); });
  Router.on("schedule", (p) => { highlightNav("schedule"); SchedulePage.render(p); });
  Router.on("browse", (p) => { highlightNav("browse"); FilterPage.render(p); });
  Router.on("404", () => {
    UI.render(`<div class="error-state">
      <div class="error-icon">404</div>
      <h2>Page Not Found</h2>
      <button class="btn btn--primary" onclick="Router.navigate('home')">Go Home</button>
    </div>`);
  });

  // Dispatch initial route
  Router.dispatch();
});
