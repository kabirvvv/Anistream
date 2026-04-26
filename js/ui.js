// ============================================================
// UI UTILITIES — shared components & helpers
// ============================================================
const UI = (() => {
  // ── Anime card ──────────────────────────────────────────────
  const animeCard = (anime) => {
    const id = anime.id || "";
    const title = anime.title || anime.name || "Unknown";
    const poster = anime.poster || anime.season_poster || "";
    const sub = anime.tvInfo?.sub ?? anime.sub ?? "";
    const dub = anime.tvInfo?.dub ?? anime.dub ?? "";
    const type = anime.tvInfo?.showType ?? anime.showType ?? "";
    const eps = anime.tvInfo?.eps ?? "";

    return `
      <a class="card" href="#watch?id=${encodeURIComponent(id)}" onclick="event.preventDefault();Router.navigate('watch?id=${encodeURIComponent(id)}')">
        <div class="card__poster-wrap">
          <img class="card__poster" src="${poster}" alt="${title}" loading="lazy" onerror="this.src='assets/placeholder.svg'">
          <div class="card__overlay">
            <span class="card__play-btn"><svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg></span>
          </div>
          <div class="card__badges">
            ${sub ? `<span class="badge badge--sub">SUB ${sub}</span>` : ""}
            ${dub ? `<span class="badge badge--dub">DUB ${dub}</span>` : ""}
            ${eps ? `<span class="badge badge--eps">${eps} EP</span>` : ""}
          </div>
          ${type ? `<span class="card__type">${type}</span>` : ""}
        </div>
        <div class="card__info">
          <p class="card__title">${title}</p>
        </div>
      </a>`;
  };

  // ── Skeleton card ────────────────────────────────────────────
  const skeletonCard = () => `
    <div class="card card--skeleton">
      <div class="card__poster-wrap skeleton-box"></div>
      <div class="card__info">
        <div class="skeleton-line skeleton-line--80"></div>
        <div class="skeleton-line skeleton-line--50"></div>
      </div>
    </div>`;

  const skeletonCards = (n = 12) =>
    Array(n).fill(0).map(skeletonCard).join("");

  // ── Section header ───────────────────────────────────────────
  const sectionHeader = (title, link = "") => `
    <div class="section-header">
      <h2 class="section-title"><span class="section-accent"></span>${title}</h2>
      ${link ? `<a class="section-more" href="#${link}" onclick="event.preventDefault();Router.navigate('${link}')">View All <svg viewBox="0 0 24 24"><polyline points="9,18 15,12 9,6"/></svg></a>` : ""}
    </div>`;

  // ── Grid ─────────────────────────────────────────────────────
  const grid = (items, renderFn) =>
    `<div class="anime-grid">${items.map(renderFn).join("")}</div>`;

  // ── Pagination ───────────────────────────────────────────────
  const pagination = (current, total, onPage) => {
    if (total <= 1) return "";
    const pages = [];
    const delta = 2;
    const range = [];
    for (
      let i = Math.max(2, current - delta);
      i <= Math.min(total - 1, current + delta);
      i++
    )
      range.push(i);

    if (current - delta > 2) range.unshift("…");
    if (current + delta < total - 1) range.push("…");
    range.unshift(1);
    if (total > 1) range.push(total);

    return `<div class="pagination">
      ${
        current > 1
          ? `<button class="page-btn" onclick="${onPage}(${current - 1})"><svg viewBox="0 0 24 24"><polyline points="15,18 9,12 15,6"/></svg></button>`
          : ""
      }
      ${range
        .map((p) =>
          p === "…"
            ? `<span class="page-ellipsis">…</span>`
            : `<button class="page-btn ${p === current ? "page-btn--active" : ""}" onclick="${onPage}(${p})">${p}</button>`
        )
        .join("")}
      ${
        current < total
          ? `<button class="page-btn" onclick="${onPage}(${current + 1})"><svg viewBox="0 0 24 24"><polyline points="9,18 15,12 9,6"/></svg></button>`
          : ""
      }
    </div>`;
  };

  // ── Toast notifications ──────────────────────────────────────
  const toast = (msg, type = "info") => {
    const t = document.createElement("div");
    t.className = `toast toast--${type}`;
    t.textContent = msg;
    document.getElementById("toast-container").appendChild(t);
    requestAnimationFrame(() => t.classList.add("toast--show"));
    setTimeout(() => {
      t.classList.remove("toast--show");
      t.addEventListener("transitionend", () => t.remove());
    }, 3000);
  };

  // ── Set page title ───────────────────────────────────────────
  const setTitle = (t) => {
    document.title = t
      ? `${t} — ${window.CONFIG.SITE_NAME}`
      : window.CONFIG.SITE_NAME;
  };

  // ── Render into main ─────────────────────────────────────────
  const render = (html) => {
    const main = document.getElementById("main-content");
    main.innerHTML = html;
    main.scrollTo({ top: 0 });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Loading state ─────────────────────────────────────────────
  const loading = (msg = "Loading…") => {
    render(`<div class="loading-state">
      <div class="spinner"></div>
      <p class="loading-msg">${msg}</p>
    </div>`);
  };

  // ── Error state ───────────────────────────────────────────────
  const error = (msg = "Something went wrong.") => {
    render(`<div class="error-state">
      <div class="error-icon">✕</div>
      <h2>Oops!</h2>
      <p>${msg}</p>
      <button class="btn btn--primary" onclick="history.back()">Go Back</button>
    </div>`);
  };

  return {
    animeCard,
    skeletonCards,
    sectionHeader,
    grid,
    pagination,
    toast,
    setTitle,
    render,
    loading,
    error,
  };
})();

window.UI = UI;
