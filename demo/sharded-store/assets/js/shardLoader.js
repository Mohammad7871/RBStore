import { rebrandEngine } from "./rebrand.js";

const LIST = document.getElementById("virtual-list");
const SEARCH = document.getElementById("search");
const CATEGORY = document.getElementById("category-select");
const TOGGLE = document.getElementById("industry-toggle");
const CITY = document.getElementById("city-select");

let manifest;
let loadedShards = new Map();
let products = []; // appended as shards load
let filtered = [];

async function loadManifest() {
  const res = await fetch("data/meta/shard-manifest.json");
  manifest = await res.json();
}

async function loadShard(i) {
  if (loadedShards.has(i)) return loadedShards.get(i);
  const shard = manifest.shards[i];
  const res = await fetch(shard.file);
  const data = await res.json();
  // rebrand and remove prices
  const clean = data.map((d) => {
    const r = rebrandEngine(d);
    // strip numeric price fields if any
    delete r.price;
    delete r.priceLabel;
    delete r.price_tag;
    return r;
  });
  loadedShards.set(i, clean);
  // merge into products array at positions
  products = products.concat(clean);
  applyFiltersAndRender();
  return clean;
}

function productCard(p) {
  return `<div class="product-card glass" data-id="${p.id}" onclick="window.selectItem && window.selectItem('${p.id}')">
    <div class="product-thumb"><img src="/public/assets/products/${p.id}.png" alt="" style="width:100%;height:100%;object-fit:cover"></div>
    <div>
      <div class="font-bold">${escapeHtml(p.rb_premium_name)}</div>
      <div class="text-sm text-slate-600">${escapeHtml(p.original_brand)} · ${escapeHtml(p.stock_status)}</div>
    </div>
    <div class="ml-auto">
      <div class="gold-badge">REQUEST PROCUREMENT QUOTE</div>
    </div>
  </div>`;
}

function escapeHtml(s) {
  return (s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function applyFiltersAndRender() {
  const q = (SEARCH.value || "").toLowerCase();
  const cat = CATEGORY.value;
  const industry = TOGGLE.checked ? "hotel" : "hospital";
  filtered = products.filter((p) => {
    if (cat !== "all" && p.category !== cat) return false;
    if (p.industry !== industry) return false;
    if (q && !(p.rb_premium_name || "").toLowerCase().includes(q)) return false;
    return true;
  });
  renderGrid();
}

function renderGrid() {
  LIST.innerHTML = filtered.map(productCard).join("");
}

async function init() {
  await loadManifest();
  // prefetch first shard
  await loadShard(0);
  // lazy load next shards when scrolling to bottom
  window.addEventListener("scroll", async () => {
    const nearBottom =
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 200;
    if (nearBottom) {
      const next = loadedShards.size;
      if (next < manifest.shards.length) await loadShard(next);
    }
  });
  SEARCH.addEventListener(
    "input",
    debounce(() => applyFiltersAndRender(), 150),
  );
  CATEGORY.addEventListener("change", () => applyFiltersAndRender());
  TOGGLE.addEventListener("change", () => applyFiltersAndRender());
  CITY.addEventListener("change", () => {
    /*update meta via other module*/
  });
}

function debounce(fn, wait) {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), wait);
  };
}

window.selectItem = function (id) {
  const p = products.find((x) => x.id === id);
  window.lastSelected = p;
};

init();

export { loadShard };
