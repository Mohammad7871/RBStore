self.products = [];

function normalize(s) {
  return (s || "").toLowerCase();
}

self.onmessage = function (e) {
  const msg = e.data;
  if (msg.type === "init") {
    self.products = msg.products || [];
    self.nameIndex = self.products.map((p) =>
      normalize(p.rb_premium_name || p.name || ""),
    );
    self.postMessage({ type: "ready" });
  }

  if (msg.type === "search") {
    const q = normalize(msg.q || "");
    const limit = msg.limit || 200;
    if (!q) {
      self.postMessage({ type: "results", results: [], q });
      return;
    }
    const results = [];
    for (let i = 0; i < self.nameIndex.length && results.length < limit; i++) {
      if (self.nameIndex[i].includes(q)) results.push(self.products[i]);
    }
    self.postMessage({ type: "results", results, q });
  }
};
