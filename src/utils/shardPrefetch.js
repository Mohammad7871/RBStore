// Lightweight shard prefetcher for demo: fetches shard JSON files and caches them
(function () {
  const base = "/data/shards/";
  let manifest = [];
  const cache = {};

  async function init(manifestUrl = "/data/meta/shard-manifest.json") {
    try {
      const r = await fetch(manifestUrl, { cache: "no-store" });
      manifest = await r.json();
      window.RBShardPrefetch = api; // expose early so other modules can call
      return manifest;
    } catch (e) {
      console.warn("ShardPrefetch: failed to load manifest", e);
      manifest = [];
      window.RBShardPrefetch = api;
      return manifest;
    }
  }

  function list() {
    return manifest.slice();
  }

  async function prefetchShard(name) {
    if (!name) return null;
    if (cache[name]) return cache[name];
    try {
      const r = await fetch(base + name);
      const j = await r.json();
      cache[name] = j;
      return j;
    } catch (e) {
      console.warn("prefetchShard failed", name, e);
      return null;
    }
  }

  // prefetch next `count` shards after `currentName`. Calls onLoaded(name, json)
  function prefetchNextFrom(currentName, count = 1, onLoaded) {
    const idx = manifest.indexOf(currentName);
    if (idx === -1) return [];
    const ops = [];
    for (let i = 1; i <= count; i++) {
      const name = manifest[idx + i];
      if (!name) break;
      const p = prefetchShard(name).then((j) => {
        if (onLoaded) onLoaded && onLoaded(name, j);
        return { name, json: j };
      });
      ops.push(p);
    }
    return Promise.all(ops);
  }

  // Prefetch shards likely to contain results for a textual query.
  // Uses small-index -> product ids, and product-shard-map to find shards.
  async function prefetchByQuery(query, limit = 3) {
    if (!query || typeof query !== "string") return [];
    // load small-index and product->shard map if needed
    try {
      if (!window.__RB_small_index) {
        const r = await fetch("/data/meta/small-index.json", {
          cache: "no-store",
        });
        window.__RB_small_index = await r.json();
      }
      if (!window.__RB_product_shard_map) {
        const r2 = await fetch("/data/meta/product-shard-map.json", {
          cache: "no-store",
        });
        window.__RB_product_shard_map = await r2.json();
      }
    } catch (e) {
      console.warn("prefetchByQuery: failed to load mapping", e);
      return [];
    }

    const tokens = query.toLowerCase().split(/\W+/).filter(Boolean);
    const hits = new Set();
    for (const t of tokens) {
      const ids = window.__RB_small_index[t];
      if (!ids || !Array.isArray(ids)) continue;
      ids.forEach((id) => hits.add(id));
    }

    const shardsToFetch = new Set();
    for (const id of hits) {
      const s = window.__RB_product_shard_map[id];
      if (s) shardsToFetch.add(s);
      if (shardsToFetch.size >= limit) break;
    }

    const ops = [];
    shardsToFetch.forEach((sh) => {
      if (!cache[sh])
        ops.push(
          prefetchShard(sh)
            .then((j) => ({ name: sh, json: j }))
            .catch(() => null),
        );
    });
    return Promise.all(ops);
  }

  const api = {
    init,
    list,
    prefetchShard,
    prefetchNextFrom,
    prefetchByQuery,
    cache,
  };
  // expose on window once loaded
  window.RBShardPrefetch = api;
})();
