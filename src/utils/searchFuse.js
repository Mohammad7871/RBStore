// Fuse.js integration: builds a lightweight Fuse search index for currently-loaded shardItems
(function () {
  let fuse = null;
  let options = {
    keys: ["title", "brand", "category", "id"],
    threshold: 0.4,
    includeScore: true,
    useExtendedSearch: true,
    ignoreLocation: true,
  };

  async function ensureFuse() {
    if (window.Fuse) return window.Fuse;
    // load Fuse from CDN
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/fuse.js@6.6.2/dist/fuse.min.js";
      s.onload = res;
      s.onerror = rej;
      document.head.appendChild(s);
    });
    return window.Fuse;
  }

  async function buildIndex(docs) {
    const F = await ensureFuse();
    fuse = new F(docs || [], options);
    window.RBFuse = fuse;
    return fuse;
  }

  function search(q, limit = 50) {
    if (!fuse || !q) return [];
    try {
      const res = fuse.search(q, { limit });
      return res.map((r) => r.item || r);
    } catch (e) {
      return [];
    }
  }

  window.RBFuseSearch = { buildIndex, search };
})();
