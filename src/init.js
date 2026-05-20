// App bootstrap for demo: initializes search worker, binds search input, and replaces prices
(function () {
  const worker = new Worker("src/workers/search.js");
  worker.postMessage({ type: "init" });

  const searchInput = document.getElementById("global-search");
  const searchDropdown = document.getElementById("search-dropdown");
  let debounceTimer = null;

  // preload shard data map for demo with manifest + prefetch support
  let shardMap = {};
  let shardItems = [];
  let shardManifest = [];
  let currentShardName = null;
  let currentShardIndex = -1;

  // initialize shard manifest and prefetcher
  (async function prepareShards() {
    try {
      if (window.RBShardPrefetch && window.RBShardPrefetch.list) {
        shardManifest = window.RBShardPrefetch.list();
      } else {
        const m = await fetch('/data/meta/shard-manifest.json');
        shardManifest = await m.json();
      }
    } catch (e) {
      shardManifest = ['example-shard.json'];
    }
    // choose initial shard: prefer example-shard if present
    currentShardIndex = Math.max(0, shardManifest.indexOf('example-shard.json'));
    if (currentShardIndex === -1) currentShardIndex = 0;
    currentShardName = shardManifest[currentShardIndex];

    // ensure RBShardPrefetch is initialized
    try {
      if (window.RBShardPrefetch && window.RBShardPrefetch.init) {
        await window.RBShardPrefetch.init('/data/meta/shard-manifest.json');
      }
    } catch (e) {}

    // preload small-index and product->shard map to speed up search and prefetch
    try {
      if (!window.__RB_small_index) {
        const si = await fetch('/data/meta/small-index.json', { cache: 'no-store' });
        window.__RB_small_index = await si.json();
      }
      if (!window.__RB_product_shard_map) {
        const pm = await fetch('/data/meta/product-shard-map.json', { cache: 'no-store' });
        window.__RB_product_shard_map = await pm.json();
      }
      // send the small index to the worker to avoid duplicate fetch inside worker
      try {
        worker.postMessage({ type: 'smallIndex', index: window.__RB_small_index });
      } catch (e) {}
    } catch (e) {
      // non-fatal
    }

    // load the initial shard
    try {
      const r = await fetch(`/data/shards/${currentShardName}`);
      const j = await r.json();
      (j.items || []).forEach((it) => {
        shardMap[it.id] = it;
        shardItems.push(it);
      });
      // prefetch next two shards in background
      if (window.RBShardPrefetch && window.RBShardPrefetch.prefetchNextFrom) {
        window.RBShardPrefetch.prefetchNextFrom(currentShardName, 2, (name, json) => {
          // quietly cache — we'll merge when needed
        });
      }
      // render first batch when shard loaded
      try {
        renderProductBatch();
      } catch (e) {}
    } catch (e) {
      console.warn('Failed to load initial shard', currentShardName, e);
    }
  })();

  function renderDropdownItems(items) {
    searchDropdown.innerHTML = "";
    if (!items || items.length === 0) {
      searchDropdown.classList.remove("sd-open");
      return;
    }
    const list = document.createElement("div");
    items.slice(0, 20).forEach((it) => {
      const id = it.id || it;
      const data = it.title ? it : shardMap[id] || { id, title: id };
      const row = document.createElement("div");
      row.className = "search-row";
      row.setAttribute("role", "option");
      row.innerHTML = `
        <div class="search-row-body">
          <div class="search-row-name">${RBSanitizer?.sanitizeTitle(data.title) || data.title || id}</div>
          <div class="search-row-meta">${data.brand || ""} • ${data.id || ""}</div>
        </div>
      `;
        row.addEventListener("click", () => {
          if (window.openProductQuote) window.openProductQuote(data);
          else alert("Open product: " + data.title);
        });
      list.appendChild(row);
    });
    searchDropdown.appendChild(list);
    searchDropdown.classList.add("sd-open");
  }

  worker.addEventListener("message", (e) => {
    const d = e.data;
    if (d && d.type === "results") {
      renderDropdownItems(d.items || []);
    }
  });

  searchInput.addEventListener("input", (ev) => {
    const q = ev.target.value.trim();
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (!q) {
        renderDropdownItems([]);
        return;
      }
      // kick off shard prefetch for likely shards matching query to improve perceived speed
      try {
        if (window.RBShardPrefetch && window.RBShardPrefetch.prefetchByQuery) {
          window.RBShardPrefetch.prefetchByQuery(q, 3).catch(()=>{});
        }
      } catch (e) {}
      worker.postMessage({ type: "query", q });
    }, 220);
  });

  // Replace prices on initial load
  document.addEventListener("DOMContentLoaded", () => {
    try {
      RBMarketQuote.replacePrices();
    } catch (e) {}
    // initialize optional Phase7 helpers
    try { window.RBVoiceSearch && window.RBVoiceSearch.init(); } catch(e){}
    try { window.RBFuseSearch && window.RBFuseSearch.buildIndex && window.RBFuseSearch.buildIndex(shardItems); } catch(e){}
    // ensure floating contact and trust badges render (they self-init on DOMContentLoaded too)
    // Bind Load More button
    const loadMoreBtn = document.getElementById("load-more-btn");
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener("click", (ev) => {
        ev.preventDefault();
        renderProductBatch();
      });
    }
  });

    // Shared UI: open quote modal with product snapshot
    window.openProductQuote = function(product){
      try{
        const overlay = document.getElementById('quote-overlay');
        const modal = document.getElementById('quote-modal');
        const body = document.getElementById('quote-modal-body');
        if (!overlay || !modal || !body) return;
        // insert or update snapshot
        let snap = document.getElementById('quote-product-snapshot');
        if (!snap){
          snap = document.createElement('div');
          snap.id = 'quote-product-snapshot';
          snap.className = 'mb-4 p-3 rounded border border-border-gray bg-light-gray';
          body.insertBefore(snap, body.firstChild);
        }
        snap.innerHTML = \`
          <div style="display:flex;gap:12px;align-items:center">
            <img src="\${product.image||'/public/assets/brands/placeholder.jpg'}" alt="\${product.title||''}" style="width:84px;height:64px;object-fit:cover;border-radius:6px;"/>
            <div>
              <div style="font-weight:700;font-size:14px;color:var(--text-primary)">\${product.title||product.id}</div>
              <div style="font-size:12px;color:var(--text-light)">\${product.brand||''} • \${product.id||''}</div>
            </div>
          </div>
        \`;
        // open modal
        overlay.classList.add('opacity-100'); overlay.style.pointerEvents='auto';
        modal.classList.remove('opacity-0','pointer-events-none'); modal.style.pointerEvents='auto';
        // prefill hidden product id and message
        const pid = document.getElementById('quote-product-id'); if (pid) pid.value = product.id||'';
        const msg = document.getElementById('quote-message'); if (msg) msg.value = \`Requesting enterprise quote for \${product.title||product.id}. Quantity: \`;
        const nameInput = document.getElementById('quote-name'); if (nameInput) nameInput.focus();
      }catch(e){ console.error(e); }
    };

  // Product grid batch rendering (20 items per batch)
  const BATCH_SIZE = 20;
  let productOffset = 0;
  function renderProductBatch() {
    const grid = document.getElementById("product-grid");
    const stats = document.getElementById("product-count");
    const catalogStats = document.getElementById("catalog-stats");
    if (!grid) return;
    const slice = shardItems.slice(productOffset, productOffset + BATCH_SIZE);
    slice.forEach((item) => {
      // sanitize title before render
      if (window.RBSanitizer)
        item.title = RBSanitizer.sanitizeTitle(item.title);
      const card = window.RBProductCard
        ? RBProductCard.createProductCard(item)
        : createFallbackCard(item);
      grid.appendChild(card);
    });
    productOffset += slice.length;
    // update counts
    if (stats)
      stats.innerText = `${productOffset} of ${shardItems.length} products loaded`;
    if (catalogStats)
      catalogStats.innerText = `Showing ${productOffset} items — use Request Details to inquire about market valuation.`;
    // toggle load more
    const wrap = document.getElementById("load-more-wrap");
    const done = document.getElementById("load-more-done");
    if (productOffset >= shardItems.length) {
      if (wrap) wrap.classList.add("hidden");
      if (done) done.classList.remove("hidden");
    } else {
      if (wrap) wrap.classList.remove("hidden");
      if (done) done.classList.add("hidden");
    }

    // If we are approaching the end of currently loaded items, merge a prefetched shard if available
    try {
      const NEAR_END_THRESHOLD = 5;
      if (productOffset + NEAR_END_THRESHOLD >= shardItems.length) {
        // try to pull next shard from prefetch cache
        const nextIndex = currentShardIndex + 1;
        const nextName = shardManifest[nextIndex];
        if (nextName && window.RBShardPrefetch && window.RBShardPrefetch.cache && window.RBShardPrefetch.cache[nextName]) {
          const nextJson = window.RBShardPrefetch.cache[nextName];
          (nextJson.items || []).forEach((it) => {
            if (!shardMap[it.id]) {
              shardMap[it.id] = it;
              shardItems.push(it);
            }
          });
          // advance current shard pointer so future prefetches move along
          currentShardIndex = nextIndex;
          currentShardName = nextName;
          // fire another prefetch ahead
          if (window.RBShardPrefetch && window.RBShardPrefetch.prefetchNextFrom) {
            window.RBShardPrefetch.prefetchNextFrom(currentShardName, 1);
          }
        }
      }
    } catch (e) {}
  }

  function createFallbackCard(item) {
    const el = document.createElement("div");
    el.className = "product-card p-4 rounded-lg border border-border-gray";
    el.innerHTML = `<h3>${item.title || item.id}</h3><p>${item.brand || ""}</p>`;
    return el;
  }
})();
