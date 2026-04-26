// ============================================================
// WATCH / PLAYER PAGE — Shirayuki Scrapper API V2
// ============================================================
const WatchPage = (() => {
  let currentAnimeId = null;
  let currentEpId    = null;
  let allEpisodes    = [];
  let hls            = null;

  // ── Main render ────────────────────────────────────────────
  const render = async ({ id, ep }) => {
    if (!id) { UI.error("No anime specified."); return; }
    currentAnimeId = id;

    UI.setTitle("Loading…");
    UI.render(`
      <div class="watch-page" id="watch-page">
        <div class="player-area">
          <div class="player-wrap" id="player-wrap">
            <div class="player-loader"><div class="spinner"></div></div>
          </div>
          <div class="player-toolbar" id="player-toolbar">
            <div class="player-toolbar__left">
              <button class="tool-btn" id="prev-ep-btn" title="Previous">
                <svg viewBox="0 0 24 24"><polyline points="15,18 9,12 15,6"/></svg>
              </button>
              <span class="ep-label" id="ep-label">Loading…</span>
              <button class="tool-btn" id="next-ep-btn" title="Next">
                <svg viewBox="0 0 24 24"><polyline points="9,18 15,12 9,6"/></svg>
              </button>
            </div>
            <div class="player-toolbar__right">
              <div class="type-toggle" id="type-toggle">
                <button class="type-btn type-btn--active" data-type="sub">SUB</button>
                <button class="type-btn" data-type="dub">DUB</button>
              </div>
              <select class="server-select" id="server-select">
                <option value="hd-1">HD-1</option>
                <option value="hd-2">HD-2</option>
                <option value="hd-3">HD-3</option>
              </select>
            </div>
          </div>
        </div>

        <div class="watch-sidebar">
          <div class="sidebar-anime-info" id="sidebar-info">
            <div class="skeleton-box" style="height:96px;border-radius:8px"></div>
          </div>
          <div class="sidebar-eps">
            <div class="sidebar-eps__header">
              <span>Episodes</span>
              <input class="ep-search ep-search--sm" id="sidebar-ep-search" type="text" placeholder="Search…">
            </div>
            <div class="ep-list" id="ep-list">
              ${Array(14).fill('<div class="ep-item ep-item--skel skeleton-box"></div>').join("")}
            </div>
          </div>
        </div>
      </div>
    `);

    // Wire controls
    document.getElementById("prev-ep-btn").addEventListener("click", () => {
      const idx = allEpisodes.findIndex((e) => String(getEpId(e)) === String(currentEpId));
      if (idx > 0) selectEp(allEpisodes[idx - 1]);
    });
    document.getElementById("next-ep-btn").addEventListener("click", () => {
      const idx = allEpisodes.findIndex((e) => String(getEpId(e)) === String(currentEpId));
      if (idx >= 0 && idx < allEpisodes.length - 1) selectEp(allEpisodes[idx + 1]);
    });
    document.getElementById("server-select").addEventListener("change", reloadStream);
    document.querySelectorAll(".type-btn").forEach((btn) =>
      btn.addEventListener("click", () => {
        document.querySelectorAll(".type-btn").forEach((b) => b.classList.remove("type-btn--active"));
        btn.classList.add("type-btn--active");
        reloadStream();
      })
    );
    document.getElementById("sidebar-ep-search").addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      renderEpList(allEpisodes.filter((ep) =>
        String(ep.number || ep.episodeNo || "").includes(q) ||
        (ep.title || ep.name || "").toLowerCase().includes(q)
      ), currentEpId);
    });

    // Load sidebar anime info
    loadSidebarInfo(id);

    // Load episodes then start player
    await loadEpisodeList(id);
    const targetEp = ep || (allEpisodes[0] ? getEpId(allEpisodes[0]) : null);
    if (targetEp) {
      currentEpId = targetEp;
      updateEpLabel();
      renderEpList(allEpisodes, targetEp);
      loadPlayer();
    }
  };

  // ── Helpers ────────────────────────────────────────────────
  const getEpId = (ep) => ep.episodeId || ep.id || ep.number || ep.episodeNo;

  const getEpNum = (ep) => ep.number || ep.episodeNo || ep.episode || getEpId(ep);

  const getServerValue = () =>
    document.getElementById("server-select")?.value || CONFIG.DEFAULT_SERVER;

  const getTypeValue = () =>
    document.querySelector(".type-btn--active")?.dataset.type || CONFIG.DEFAULT_TYPE;

  const reloadStream = () => { if (currentEpId) loadPlayer(); };

  const updateEpLabel = () => {
    const ep = allEpisodes.find((e) => String(getEpId(e)) === String(currentEpId));
    const label = document.getElementById("ep-label");
    if (label && ep) label.textContent = `EP ${getEpNum(ep)}${ep.title ? " — " + ep.title : ""}`;
  };

  // ── Sidebar info ───────────────────────────────────────────
  const loadSidebarInfo = async (id) => {
    try {
      const raw = await API.getAnimeInfo(id);
      const info = raw.anime?.info || raw.info || raw.anime || raw;
      const title  = info.name || info.title || "";
      const poster = info.poster || info.image || "";
      const type   = info.stats?.type || info.type || "";
      document.getElementById("sidebar-info").innerHTML = `
        <a class="sidebar-anime-card" href="#anime?id=${encodeURIComponent(id)}"
           onclick="event.preventDefault();Router.navigate('anime?id=${encodeURIComponent(id)}')">
          <img src="${poster}" alt="${title}" onerror="this.src='assets/placeholder.svg'">
          <div>
            <p class="sidebar-anime-title">${title}</p>
            <p class="sidebar-anime-type">${type}</p>
          </div>
        </a>`;
      UI.setTitle(title);
    } catch { /* silent */ }
  };

  // ── Episode list ───────────────────────────────────────────
  const loadEpisodeList = async (id) => {
    try {
      const raw = await API.getEpisodes(id);
      allEpisodes = raw.episodes || (Array.isArray(raw) ? raw : []);
    } catch { allEpisodes = []; }
  };

  const renderEpList = (episodes, activeId) => {
    const list = document.getElementById("ep-list");
    if (!list) return;
    list.innerHTML = episodes.map((ep) => {
      const epId  = getEpId(ep);
      const epNum = getEpNum(ep);
      const title = ep.title || ep.name || "";
      const active = String(epId) === String(activeId);
      return `
        <div class="ep-item ${active ? "ep-item--active" : ""}"
             onclick="WatchPage._selectById('${epId}')"
             title="${title}">
          <span class="ep-item__num">${epNum}</span>
          <span class="ep-item__title">${title || "Episode " + epNum}</span>
        </div>`;
    }).join("");

    const el = list.querySelector(".ep-item--active");
    if (el) el.scrollIntoView({ block: "nearest" });
  };

  const selectEp = (ep) => {
    currentEpId = getEpId(ep);
    updateEpLabel();
    renderEpList(allEpisodes, currentEpId);
    window.history.replaceState(null, "", `#watch?id=${encodeURIComponent(currentAnimeId)}&ep=${currentEpId}`);
    loadPlayer();
  };

  // ── Player ─────────────────────────────────────────────────
  const loadPlayer = async () => {
    const wrap = document.getElementById("player-wrap");
    if (!wrap || !currentEpId) return;
    wrap.innerHTML = `<div class="player-loader"><div class="spinner"></div></div>`;

    const server   = getServerValue();
    const category = getTypeValue();

    try {
      const raw = await API.getSources(currentAnimeId, currentEpId, server, category);
      // Shirayuki sources shape:
      // { sources: [{url, isM3U8}], tracks: [{file, label, kind, default}], intro, outro }
      const sources = raw.sources || raw.streamingLink || [];
      const tracks  = raw.tracks  || raw.subtitles     || [];

      const src = sources[0]?.url || sources[0]?.file;
      if (!src) {
        wrap.innerHTML = `<div class="player-err">
          <p>No stream found for ${server.toUpperCase()} (${category.toUpperCase()}).</p>
          <small>Try a different server or type.</small>
        </div>`;
        return;
      }

      initPlayer(wrap, src, tracks, sources[0]?.isM3U8 !== false);
    } catch (e) {
      wrap.innerHTML = `<div class="player-err">
        <p>Stream unavailable.</p>
        <small>${e.message}</small>
      </div>`;
    }
  };

  const initPlayer = (wrap, src, tracks, isHLS) => {
    if (hls) { hls.destroy(); hls = null; }
    wrap.innerHTML = `<video id="anime-video" class="video-player" controls playsinline></video>`;
    const video = document.getElementById("anime-video");

    if (isHLS && window.Hls?.isSupported()) {
      hls = new Hls({ maxBufferLength: 30 });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.addEventListener("loadedmetadata", () => video.play().catch(() => {}));
    } else {
      video.src = src;
      video.play().catch(() => {});
    }

    // Add subtitle tracks
    tracks.forEach((t) => {
      if (!t.file && !t.src) return;
      const track = document.createElement("track");
      track.kind    = t.kind    || "subtitles";
      track.label   = t.label   || "Sub";
      track.src     = t.file    || t.src;
      track.srclang = t.lang    || "en";
      if (t.default) track.default = true;
      video.appendChild(track);
    });
  };

  // Public helper for inline onclick in ep-list
  const _selectById = (id) => {
    const ep = allEpisodes.find((e) => String(getEpId(e)) === String(id));
    if (ep) selectEp(ep);
  };

  return { render, _selectById };
})();

window.WatchPage = WatchPage;
