// ============================================================
// HOME PAGE — Shirayuki Scrapper API V2
// ============================================================
const HomePage = (() => {
  let spotlights  = [];
  let spotIdx     = 0;
  let spotTimer   = null;

  // ── Spotlight helpers ──────────────────────────────────────
  const slideSpotlight = (item) => {
    const el = document.getElementById("spotlight-inner");
    if (!el || !item) return;

    const title = item.title || item.name || "";
    const desc  = item.description || item.overview || "";
    const id    = item.id || item.animeId || "";
    const poster= item.poster || item.banner || item.image || "";
    const type  = item.type || item.showType || "";
    const rank  = item.rank ? `Rank #${item.rank}` : "";
    const epInfo= item.otherInfo?.[0] || item.episodes?.sub ? `SUB ${item.episodes.sub}` : "";

    el.style.backgroundImage = `url('${poster}')`;
    el.querySelector(".spotlight__title").textContent = title;
    el.querySelector(".spotlight__desc").textContent  =
      desc.length > 220 ? desc.slice(0, 220) + "…" : desc;
    el.querySelector(".spotlight__type").textContent = type;
    el.querySelector(".spotlight__dur").textContent  = rank;
    el.querySelector(".spotlight__ep").textContent   = epInfo;
    el.querySelector(".spotlight__watch").onclick = () =>
      Router.navigate(`watch?id=${encodeURIComponent(id)}`);
    el.querySelector(".spotlight__info").onclick = () =>
      Router.navigate(`anime?id=${encodeURIComponent(id)}`);
  };

  const startTimer = () => {
    if (spotTimer) clearInterval(spotTimer);
    spotTimer = setInterval(() => {
      spotIdx = (spotIdx + 1) % spotlights.length;
      slideSpotlight(spotlights[spotIdx]);
      updateDots();
    }, 6000);
  };

  const updateDots = () => {
    document.querySelectorAll(".spotlight__dot").forEach((d, i) =>
      d.classList.toggle("spotlight__dot--active", i === spotIdx)
    );
  };

  // ── Build spotlight HTML ───────────────────────────────────
  const buildSpotlight = (items) => {
    spotlights = items;
    const first = items[0] || {};
    const dots = items.map((_, i) =>
      `<button class="spotlight__dot ${i === 0 ? "spotlight__dot--active" : ""}" data-i="${i}"></button>`
    ).join("");

    return `
      <section class="spotlight">
        <div class="spotlight__inner" id="spotlight-inner"
             style="background-image:url('${first.poster || first.banner || ""}')">
          <div class="spotlight__gradient"></div>
          <div class="spotlight__content">
            <div class="spotlight__meta">
              <span class="spotlight__type">${first.type || ""}</span>
              <span class="spotlight__dur"></span>
              <span class="spotlight__ep">${first.episodes?.sub ? "SUB " + first.episodes.sub : ""}</span>
            </div>
            <h1 class="spotlight__title">${first.title || first.name || ""}</h1>
            <p class="spotlight__desc">${(first.description || first.overview || "").slice(0,220)}…</p>
            <div class="spotlight__actions">
              <button class="btn btn--primary spotlight__watch">
                <svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg> Watch Now
              </button>
              <button class="btn btn--ghost spotlight__info">More Info</button>
            </div>
          </div>
          <div class="spotlight__dots">${dots}</div>
          <button class="spotlight__nav spotlight__nav--prev" id="spot-prev">
            <svg viewBox="0 0 24 24"><polyline points="15,18 9,12 15,6"/></svg>
          </button>
          <button class="spotlight__nav spotlight__nav--next" id="spot-next">
            <svg viewBox="0 0 24 24"><polyline points="9,18 15,12 9,6"/></svg>
          </button>
        </div>
      </section>`;
  };

  const bindSpotlight = () => {
    document.querySelectorAll(".spotlight__dot").forEach((d) => {
      d.addEventListener("click", () => {
        spotIdx = +d.dataset.i;
        slideSpotlight(spotlights[spotIdx]);
        updateDots();
        startTimer();
      });
    });
    document.getElementById("spot-prev")?.addEventListener("click", () => {
      spotIdx = (spotIdx - 1 + spotlights.length) % spotlights.length;
      slideSpotlight(spotlights[spotIdx]);
      updateDots();
      startTimer();
    });
    document.getElementById("spot-next")?.addEventListener("click", () => {
      spotIdx = (spotIdx + 1) % spotlights.length;
      slideSpotlight(spotlights[spotIdx]);
      updateDots();
      startTimer();
    });
    startTimer();
  };

  // ── Trending row ───────────────────────────────────────────
  const buildTrending = (items) => `
    <section class="home-section">
      ${UI.sectionHeader("Trending Now", "category?c=most-popular")}
      <div class="trending-row">
        ${items.slice(0, 10).map((a, i) => {
          const id = a.id || a.animeId || "";
          const title = a.title || a.name || "";
          const poster = a.poster || a.image || "";
          return `
            <a class="trending-card" href="#watch?id=${encodeURIComponent(id)}"
               onclick="event.preventDefault();Router.navigate('watch?id=${encodeURIComponent(id)}')">
              <span class="trending-num">${String(i + 1).padStart(2, "0")}</span>
              <img src="${poster}" alt="${title}" loading="lazy" onerror="this.src='assets/placeholder.svg'">
              <div class="trending-info">
                <p class="trending-title">${title}</p>
              </div>
            </a>`;
        }).join("")}
      </div>
    </section>`;

  const buildSection = (title, link, items) => `
    <section class="home-section">
      ${UI.sectionHeader(title, link)}
      ${UI.grid(items.slice(0, 12), UI.animeCard)}
    </section>`;

  // ── Main render ────────────────────────────────────────────
  const render = async () => {
    UI.setTitle("");
    UI.render(`
      <div class="spotlight skeleton-spotlight"></div>
      <section class="home-section">
        ${UI.sectionHeader("Trending Now")}
        <div class="trending-row">
          ${Array(10).fill('<div class="trending-card trending-card--skel skeleton-box"></div>').join("")}
        </div>
      </section>
      <section class="home-section">${UI.sectionHeader("Top Airing")}${UI.skeletonCards()}</section>
    `);

    try {
      const data = await API.getHome();

      // Shirayuki home shape:
      // { spotlightAnimes, trendingAnimes, latestEpisodeAnimes, topUpcomingAnimes,
      //   topAiringAnimes, mostPopularAnimes, mostFavoriteAnimes, latestCompletedAnimes }
      spotIdx = 0;

      const spotItems = data.spotlightAnimes || data.spotlight || [];
      const trending  = data.trendingAnimes  || data.trending   || [];

      const html = [
        spotItems.length ? buildSpotlight(spotItems) : "",
        trending.length  ? buildTrending(trending) : "",
        (data.topAiringAnimes    || []).length ? buildSection("Top Airing",          "category?c=top-airing",       data.topAiringAnimes)    : "",
        (data.mostPopularAnimes  || []).length ? buildSection("Most Popular",        "category?c=most-popular",     data.mostPopularAnimes)  : "",
        (data.latestEpisodeAnimes|| []).length ? buildSection("Latest Episodes",     "category?c=recently-updated", data.latestEpisodeAnimes): "",
        (data.mostFavoriteAnimes || []).length ? buildSection("Most Favorited",      "category?c=most-favorite",    data.mostFavoriteAnimes) : "",
        (data.topUpcomingAnimes  || []).length ? buildSection("Top Upcoming",        "category?c=top-upcoming",     data.topUpcomingAnimes)  : "",
        (data.latestCompletedAnimes||[]).length? buildSection("Recently Completed",  "category?c=completed",        data.latestCompletedAnimes):"",
      ].join("");

      UI.render(html || `<div class="error-state"><p>No data returned from API.</p></div>`);
      if (spotItems.length) bindSpotlight();
    } catch (e) {
      UI.error(`Failed to load home page.<br><small>${e.message}</small>`);
    }
  };

  return { render };
})();

window.HomePage = HomePage;
