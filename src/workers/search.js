// Lightweight Web Worker for client-side prefix search with API fallback
const INDEX_PREFIX = "index_shard_";
let smallIndex = null; // { token: [productId,...] }
let initRequested = false;

function loadSmallIndex() {
  // stub: in production load a precomputed small index JSON
  return fetch("/data/meta/small-index.json")
    .then((r) => r.json())
    .catch(() => ({}));
}

function searchLocalIndex(q) {
  if (!smallIndex) return [];
  const token = q.trim().toLowerCase();
  if (!token) return [];
  const ids = smallIndex[token] || [];
  // Return lightweight product pointers; UI will fetch details if needed
  return ids.slice(0, 100);
}

self.addEventListener("message", async (e) => {
  const data = e.data;
  if (!data) return;
  if (data.type === "init") {
    initRequested = true;
    if (smallIndex) {
      postMessage({ type: "inited" });
      return;
    }
    // fallback: try to load small index inside worker if main didn't supply it
    smallIndex = await loadSmallIndex();
    postMessage({ type: "inited" });
    return;
  }

  if (data.type === "smallIndex") {
    try {
      smallIndex = data.index || {};
      // if init was already requested, notify ready
      if (initRequested) postMessage({ type: "inited" });
    } catch (e) {
      // ignore malformed payload
    }
    return;
  }

  if (data.type === "query") {
    const q = (data.q || "").toLowerCase();
    if (!q) {
      postMessage({ type: "results", items: [] });
      return;
    }
    const local = searchLocalIndex(q);
    if (local.length > 0 && local.length < 200) {
      postMessage({
        type: "results",
        items: local.map((id) => ({ id, lightweight: true })),
      });
      return;
    }
    // fallback to server for ranking and heavy queries
    try {
      const resp = await fetch("/api/search?q=" + encodeURIComponent(q));
      const json = await resp.json();
      postMessage({ type: "results", items: json.items || [] });
    } catch (err) {
      postMessage({ type: "results", items: [] });
    }
  }
});
