// ============================================================
// API SERVICE — all calls to the HiAnime API
// ============================================================
const API = (() => {
  const base = () => window.CONFIG.API_BASE;

  const get = async (endpoint) => {
    const res = await fetch(`${base()}${endpoint}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || "API returned failure");
    return json.results;
  };

  return {
    getHome: () => get("/api/"),
    getTopTen: () => get("/api/top-ten"),
    getTopSearch: () => get("/api/top-search"),
    getAnimeInfo: (id) => get(`/api/info?id=${encodeURIComponent(id)}`),
    getRandomAnime: () => get("/api/random"),
    getCategory: (category, page = 1) =>
      get(`/api/${category}?page=${page}`),
    search: (keyword) =>
      get(`/api/search?keyword=${encodeURIComponent(keyword)}`),
    searchSuggest: (keyword) =>
      get(`/api/search/suggest?keyword=${encodeURIComponent(keyword)}`),
    getEpisodes: (id) => get(`/api/episodes/${id}`),
    getServers: (id, ep) => get(`/api/servers/${id}?ep=${ep}`),
    getStream: (id, ep, server, type) =>
      get(
        `/api/stream?id=${encodeURIComponent(id)}&ep=${ep}&server=${encodeURIComponent(server)}&type=${type}`
      ),
    getStreamFallback: (id, ep, server, type) =>
      get(
        `/api/stream/fallback?id=${encodeURIComponent(id)}&ep=${ep}&server=${encodeURIComponent(server)}&type=${type}`
      ),
    getSchedule: (date) => get(`/api/schedule?date=${date}`),
    getFilter: (params) => {
      const qs = new URLSearchParams(params).toString();
      return get(`/api/filter?${qs}`);
    },
    getCharacters: (id) => get(`/api/character/list/${id}`),
    getCharacterDetail: (id) => get(`/api/character/${id}`),
  };
})();

window.API = API;
