// ============================================================
// HOME PAGE
// ============================================================
const HomePage = (() => {
  let spotlightIndex = 0;
  let spotlightTimer = null;
  let spotlights = [];

  const spotlightSlide = (data) => {
    const el = document.getElementById("spotlight-inner");
    if (!el || !data) return;
    const {
      id,
      poster,
      title,
      description,
      tvInfo = {},
    } = data;
    el.style.backgroundImage = `url('${poster}')`;
    el.querySelector(".spotlight__title").textContent = title;
    el.querySelector(".spotlight__desc").textContent =
      (description || "").slice(0, 200) + (description?.length > 200 ? "…" : "");
    el.querySelector(".spotlight__type").textContent = tvInfo.showType || "";
    el.querySelector(".spotlight__dur").textContent = tvInfo.duration || "";
    el.querySelector(".spotlight__ep").textContent = tvInfo.episodeInfo?.[0]
      ? `EP ${tvInfo.episodeInfo[0].ep}` : "";
    el.querySelector(".spotlight__watch").onclick = () =>
      Router.navigate(`watch?id=${encodeURIComponent(id)}`);
    el.querySelector(".spotlight__info").onclick = () =>
      Router.navigate(`anime?id=${encodeURIComponent(id)}`);
  };

  const startSpotlightTimer = () => {
    stopSpotlightTimer();
    spotlightTimer = setInterval(() => {
      spotlightIndex = (spotlightIndex + 1) % spotlights.length;
      spotlightSlide(spotlights[spotlightIndex]);
      updateDots();
    }, 6000);
  };

  const stopSpotlightTimer = () => {
    if (spotlightTimer) clearInterval(spotlightTimer);
  };

  const updateDots = () => {
    document.querySelectorAll(".spotlight__dot").forEach((d, i) => {
      d.classList.toggle("spotlight__dot--active", i === spotlightIndex);
    });
  };

  const buildSpotlight = (items) => {
    spotlights = items;
    const dots = items
      .map(
        (_, i) =>
          `<button class="spotlight__dot ${i === 0 ? "spotlight__dot--active" : ""}" data-i="${i}"></button>`
      )
      .join("");

    return `
      <section class="spotlight">
        <div class="spotlight__inner" id="spotlight-inner" style="background-image:url('${items[0]?.poster}')">
          <div class="spotlight__gradient"></div>
          <div class="spotlight__content">
            <div class="spotlight__meta">
              <span class="spotlight__type"></span>
              <span class="spotlight__dur"></span>
              <span class="spotlight__ep"></span>
            </div>
            <h1 class="spotlight__title">${items[0]?.title || ""}</h1>
            <p class="spotlight__desc">${(items[0]?.description || "").slice(0, 200)}${(items[0]?.description?.length ?? 0) > 200 ? "…" : ""}</p>
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

  const buildTrending = (items) => `
    <section class="home-section">
      ${UI.sectionHeader("Trending Now", "category?c=top-airing")}
      <div class="trending-row">
        ${items.slice(0, 10).map((a, i) => `
          <a class="trending-card" href="#watch?id=${encodeURIComponent(a.id)}" onclick="event.preventDefault();Router.navigate('watch?id=${encodeURIComponent(a.id)}')">
            <span class="trending-num">${String(i + 1).padStart(2, "0")}</span>
            <img src="${a.poster}" alt="${a.title}" loading="lazy" onerror="this.src='assets/placeholder.svg'">
            <div class="trending-info">
              <p class="trending-title">${a.title || a.japanese_title}</p>
            </div>
          </a>`).join("")}
      </div>
    </section>`;

  const buildSection = (title, link, items) => `
    <section class="home-section">
      ${UI.sectionHeader(title, link)}
      ${UI.grid(items.slice(0, 12), UI.animeCard)}
    </section>`;

  const bindSpotlightEvents = () => {
    document.querySelectorAll(".spotlight__dot").forEach((d) => {
      d.addEventListener("click", () => {
        spotlightIndex = +d.dataset.i;
        spotlightSlide(spotlights[spotlightIndex]);
        updateDots();
        startSpotlightTimer();
      });
    });
    document.getElementById("spot-prev")?.addEventListener("click", () => {
      spotlightIndex =
        (spotlightIndex - 1 + spotlights.length) % spotlights.length;
      spotlightSlide(spotlights[spotlightIndex]);
      updateDots();
      startSpotlightTimer();
    });
    document.getElementById("spot-next")?.addEventListener("click", () => {
      spotlightIndex = (spotlightIndex + 1) % spotlights.length;
      spotlightSlide(spotlights[spotlightIndex]);
      updateDots();
      startSpotlightTimer();
    });
    startSpotlightTimer();
  };

  const render = async () => {
    UI.setTitle("");
    UI.render(`
      <div class="spotlight skeleton-spotlight"></div>
      <section class="home-section">
        ${UI.sectionHeader("Trending Now")}
        <div class="trending-row">${Array(10).fill('<div class="trending-card trending-card--skel skeleton-box"></div>').join("")}</div>
      </section>
      <section class="home-section">${UI.sectionHeader("Top Airing")}${UI.skeletonCards()}</section>
    `);

    try {
      const data = await API.getHome();
      spotlightIndex = 0;
      const html = `
        ${buildSpotlight(data.spotlights || [])}
        ${data.trending?.length ? buildTrending(data.trending) : ""}
        ${data.topAiring?.length ? buildSection("Top Airing", "category?c=top-airing", data.topAiring) : ""}
        ${data.mostPopular?.length ? buildSection("Most Popular", "category?c=most-popular", data.mostPopular) : ""}
        ${data.latestEpisode?.length ? buildSection("Latest Episodes", "category?c=recently-updated", data.latestEpisode) : ""}
        ${data.mostFavorite?.length ? buildSection("Most Favorited", "category?c=most-favorite", data.mostFavorite) : ""}
        ${data.latestCompleted?.length ? buildSection("Recently Completed", "category?c=completed", data.latestCompleted) : ""}
      `;
      UI.render(html);
      bindSpotlightEvents();
    } catch (e) {
      UI.error("Failed to load home page. Check your API URL in js/config.js");
    }
  };

  return { render };
})();

window.HomePage = HomePage;
