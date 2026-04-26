// ============================================================
// ROUTER — hash-based SPA routing
// ============================================================
const Router = (() => {
  const routes = {};
  let current = null;

  const parse = (hash) => {
    const [path, qs] = (hash.replace(/^#\/?/, "") || "home").split("?");
    const params = {};
    if (qs)
      qs.split("&").forEach((p) => {
        const [k, v] = p.split("=");
        params[decodeURIComponent(k)] = decodeURIComponent(v || "");
      });
    return { path, params };
  };

  const navigate = (hash) => {
    window.location.hash = hash;
  };

  const on = (path, handler) => {
    routes[path] = handler;
  };

  const dispatch = () => {
    const { path, params } = parse(window.location.hash);
    const handler = routes[path] || routes["404"];
    if (handler) {
      current = path;
      handler(params);
    }
  };

  window.addEventListener("hashchange", dispatch);
  window.addEventListener("load", dispatch);

  return { on, navigate, dispatch, parse, current: () => current };
})();

window.Router = Router;
